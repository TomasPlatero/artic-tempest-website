/**
 * GUILDBOARD DISCORD RELAY BOT
 * This script synchronizes Discord messages (DMs and Staff Threads) back to the Web Chat.
 * Run this in your server: node scripts/discord-relay-bot.mjs
 */

import { Client, GatewayIntentBits, Partials, ChannelType } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import dns from 'dns';

// Forzar DNS a IPv4 primero. Las redes de Render a veces se quedan colgadas 
// intentando usar IPv6 para contactar con las APIs de Discord (undici/fetch hang).
dns.setDefaultResultOrder('ipv4first');

// Usa .env.local en local, o .env / variables de entorno inyectadas en producción
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const {
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    DISCORD_BOT_TOKEN
} = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !DISCORD_BOT_TOKEN) {
    console.error("❌ Faltan variables de entorno (Supabase URL/Key o Discord Bot Token)");
    process.exit(1);
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log("⏳ Instanciando cliente de Discord...");
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember],
    rest: {
        timeout: 60000,
        retries: 5,
        globalRequestsPerSecond: 50
    }
});

client.on('ready', () => {
    console.log(`✅ GuildBoard Relay Bot ACTIVO (evento ready disparado como ${client.user?.tag})`);
});

client.on('error', (err) => {
    console.error(`⚠️ Discord Client Error Event:`, err);
});

client.on('debug', (info) => {
    console.log(`🐛 DISCORD DEBUG: ${info}`);
});


client.on('messageCreate', async (message) => {
    // 1. Ignorar mensajes del propio bot
    if (message.author.bot) return;

    try {
        // CASE A: Direct Message from Applicant
        if (message.channel.type === ChannelType.DM) {
            console.log(`📩 Recibido DM de ${message.author.username}: ${message.content}`);
            await handleApplicantDiscordReply(message);
        }
    } catch (err) {
        console.error("❌ Error procesando mensaje de Discord:", err);
    }
});

async function handleApplicantDiscordReply(message) {
    // 1. Find the latest active application for this Discord user (Applicant speaking)
    const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, discord_username")
        .eq("discord_user_id", message.author.id)
        .single();

    if (!profile) return;

    // Check if they have an active application
    const { data: application } = await supabase
        .from("recruitment_applications")
        .select("id")
        .eq("user_id", profile.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (!application) return;

    // 2. Insert into DB (this will make it show on the web instantly via polling)
    await supabase.from("application_messages").insert({
        application_id: application.id,
        author_id: profile.user_id,
        content: message.content
    });

    console.log(`✅ Mensaje guardado en BD del aplicante ${profile.discord_username}`);

    // 3. Mirror the message to ALL Officers via DM
    const { data: officers } = await supabase
        .from("profiles")
        .select("discord_user_id")
        .in("role_level", ["gm", "officer"])
        .not("discord_user_id", "is", null);

    if (officers && officers.length > 0) {
        const staffMsg = `**Mensaje de la solicitud [${profile.discord_username}]:** ${message.content}`;

        for (const officer of officers) {
            if (!officer.discord_user_id) continue;
            try {
                // DM Channel
                const dmRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
                    method: "POST",
                    headers: { "Authorization": `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ recipient_id: officer.discord_user_id })
                });
                const dmChannel = await dmRes.json();
                if (!dmChannel.id) continue;

                // Enviar el boton de ver en web
                await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
                    method: "POST",
                    headers: { "Authorization": `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        content: staffMsg,
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 2,
                                        style: 5,
                                        label: `Ver solicitud de ${profile.discord_username}`,
                                        url: `${process.env.NEXTAUTH_URL}/dashboard/settings/recruitment/${application.id}/chat`
                                    }
                                ]
                            }
                        ]
                    })
                });
            } catch (e) {
                console.error(`No pude mandar DM al oficial ${officer.discord_user_id}:`, e.message);
            }
        }
    }
}

client.on('guildMemberAdd', async (member) => {
    try {
        console.log(`👋 Nuevo miembro en Discord: ${member.user.username}`);

        // 1. Fetch config for this guild
        const { data: managed } = await supabase.from("guilds_managed").select("guild_id, name").limit(1).single();
        if (!managed) return;

        const { data: config } = await supabase
            .from("discord_welcome_configs")
            .select("*")
            .eq("guild_id", managed.guild_id)
            .single();

        if (!config || !config.is_enabled || !config.channel_id) return;

        // 2. Format message and card elements
        const messageText = config.message_text.replaceAll("{user}", `<@${member.user.id}>`).replaceAll("{guild}", managed.name);
        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 }) || "https://cdn.discordapp.com/embed/avatars/0.png";
        const guildName = managed.name;

        console.log(`📡 Generando tarjeta de bienvenida para ${member.user.username}...`);

        // 3. Build render URL with config parameters
        // process.env.NEXTAUTH_URL should be defined, fallback to localhost if missing.
        const baseUrl = process.env.NEXTAUTH_URL || "http://127.0.0.1:3000";
        const renderUrl = new URL(`${baseUrl}/api/discord/welcome/render`);

        renderUrl.searchParams.set("username", member.user.username);
        renderUrl.searchParams.set("avatar", avatarUrl);
        renderUrl.searchParams.set("guildName", guildName);
        renderUrl.searchParams.set("bg_url", config.card_background_url || "");
        renderUrl.searchParams.set("bg_color", config.card_background_color);
        renderUrl.searchParams.set("text_color", config.card_text_color);
        renderUrl.searchParams.set("title", config.card_title_template.replaceAll("{user}", member.user.username).replaceAll("{guild}", guildName));
        renderUrl.searchParams.set("subtitle", config.card_subtitle_template.replaceAll("{user}", member.user.username).replaceAll("{guild}", guildName));
        renderUrl.searchParams.set("overlay", config.card_overlay_opacity.toString());

        // 4. Send directly via fetch against Discord API (No need to download the image if Discord API can use Buffer)
        // Let's use discord.js built-in send methods to handle FormData cleanly
        const channel = await client.channels.fetch(config.channel_id);
        if (channel && channel.isTextBased()) {
            // we download the image buffer from our API
            const imageRes = await fetch(renderUrl.href);
            if (!imageRes.ok) throw new Error("API devolvió " + imageRes.status);
            const arrayBuffer = await imageRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            await channel.send({
                content: messageText,
                files: [{ attachment: buffer, name: "welcome.png" }]
            });
            console.log(`✅ Bienvenida enviada a ${member.user.username} (Estilo MEE6)`);
        }
    } catch (e) {
        console.error("❌ Error enviando bienvenida:", e.message);
    }
});

client.on('guildMemberAdd', async (member) => {
    try {
        console.log(`👋 Nuevo miembro en Discord: ${member.user.username}`);

        // 1. Fetch config for this guild
        const { data: managed } = await supabase.from("guilds_managed").select("guild_id, name").limit(1).single();
        if (!managed) return;

        const { data: config } = await supabase
            .from("discord_welcome_configs")
            .select("*")
            .eq("guild_id", managed.guild_id)
            .single();

        console.log(`📋 Configuración leída de BD: enabled=${config?.is_enabled}, channel=${config?.channel_id}`);

        if (!config || !config.is_enabled || !config.channel_id) {
            console.log("❌ Bienvenida cancelada: No activada o sin canal.");
            return;
        }

        // Evitar dobles mensajes si el bot corre en local y en render a la vez
        if (process.env.NODE_ENV === 'development' || (!process.env.RENDER && fs.existsSync('.env.local'))) {
            console.log("🛠️ Local environment detectado. Omitiendo tarjeta de bienvenida para evitar mensaje duplicado con Render.");
            return;
        }

        console.log("🚀 Continuando formato de mensaje...");

        // 2. Format message and card elements
        const messageText = config.message_text.replaceAll("{user}", `<@${member.user.id}>`).replaceAll("{guild}", managed.name);
        // Usamos una URL de placeholder segura si el usuario no tiene avatar
        const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 }) || "https://cdn.discordapp.com/embed/avatars/0.png";
        const guildName = managed.name;

        console.log(`📡 Solicitando imagen renderizada a Vercel para ${member.user.username}...`);

        // 3. Build render URL request to the Vercel API
        const baseUrl = process.env.NEXTAUTH_URL || "https://artictempest.es"; // fallback a prod si falta env
        const renderUrl = new URL(`${baseUrl}/api/discord/welcome/render`);

        renderUrl.searchParams.set("username", member.user.username);
        renderUrl.searchParams.set("avatar", avatarUrl);
        renderUrl.searchParams.set("guildName", guildName);
        renderUrl.searchParams.set("bg_url", config.card_background_url || "");
        renderUrl.searchParams.set("bg_color", config.card_background_color);
        renderUrl.searchParams.set("text_color", config.card_text_color);
        renderUrl.searchParams.set("title", config.card_title_template.replaceAll("{user}", member.user.username).replaceAll("{guild}", guildName));
        renderUrl.searchParams.set("subtitle", config.card_subtitle_template.replaceAll("{user}", member.user.username).replaceAll("{guild}", guildName));
        renderUrl.searchParams.set("overlay", config.card_overlay_opacity.toString());
        renderUrl.searchParams.set("font", config.card_font_family || "Inter");

        // 4. Download image buffer from Vercel Edge API
        const channel = await client.channels.fetch(config.channel_id);
        console.log(`🔍 Canal fetch completado: ${channel ? 'Encontrado (' + channel.name + ')' : 'No encontrado'}`);

        if (channel && channel.isTextBased()) {
            console.log(`⬇️ Descargando imagen de API Vercel...`);
            const imageRes = await fetch(renderUrl.href);
            if (!imageRes.ok) throw new Error("API devolvió " + imageRes.status);

            const arrayBuffer = await imageRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // 5. Send to Discord
            console.log("📤 Enviando tarjeta al canal de Discord...");
            await channel.send({
                content: messageText,
                files: [{ attachment: buffer, name: "welcome.png" }]
            });
            console.log(`✅ ¡Bienvenida enviada a ${member.user.username}!`);
        } else {
            console.log("❌ Error fatal: El canal no se encontró o no permite enviar texto.");
        }
    } catch (e) {
        console.error("❌ Error en bienvenida:", e.message);
    }
});

const rawToken = DISCORD_BOT_TOKEN || "";
const cleanToken = rawToken.trim().replace(/^"|"$/g, '');
console.log(`🔑 Token de discord leído. Longitud: ${cleanToken.length}. Comienza por: ${cleanToken.substring(0, 5)}...`);

console.log("⏳ Llamando a client.login()...");
client.login(cleanToken).then(() => {
    console.log("✅ client.login() Promesa resuelta con éxito.");
}).catch(err => {
    console.error(`❌ FATAL ERROR: No se pudo conectar a Discord.`);
    console.error(`Detalles del error:`, err);
    process.exit(1);
});

// --- DUMMY HTTP SERVER FOR RENDER FREE TIER ---
// Render "Web Services" (which have a free tier) require the app to bind to a port
import http from 'http';

const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Discord Relay Bot is running!\n');
});

server.listen(port, () => {
    console.log(`🌐 Servidor HTTP fantasma escuchando en el puerto ${port} (Para engañar a Render)`);
});
