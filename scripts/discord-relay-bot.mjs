/**
 * GUILDBOARD DISCORD RELAY BOT
 * This script synchronizes Discord messages (DMs and Staff Threads) back to the Web Chat.
 * Run this in your server: node scripts/discord-relay-bot.mjs
 */

import { Client, GatewayIntentBits, Partials, ChannelType } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

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

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User]
});

client.once('ready', () => {
    console.log(`✅ GuildBoard Relay Bot activo como ${client.user.tag}`);
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

client.login(DISCORD_BOT_TOKEN);
