/**
 * GUILDBOARD DISCORD RELAY BOT
 * This script synchronizes Discord messages (DMs and Staff Threads) back to the Web Chat.
 * Run this in your server: node scripts/discord-relay-bot.mjs
 */

import { Client, GatewayIntentBits, Partials, ChannelType } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

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

        // CASE B: Message in a Staff Thread (Official reply)
        if (message.channel.isThread()) {
            console.log(`🧵 Mensaje en hilo ${message.channel.name}: ${message.content}`);
            await handleStaffDiscordReply(message);
        }
    } catch (err) {
        console.error("❌ Error procesando mensaje de Discord:", err);
    }
});

async function handleApplicantDiscordReply(message) {
    // Find the latest active application for this Discord user
    const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("discord_user_id", message.author.id)
        .single();

    if (!profile) return;

    const { data: application } = await supabase
        .from("recruitment_applications")
        .select("id")
        .eq("user_id", profile.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (!application) return;

    // Insert into DB
    await supabase.from("application_messages").insert({
        application_id: application.id,
        author_id: profile.user_id,
        content: message.content
    });
}

async function handleStaffDiscordReply(message) {
    // Find application by thread ID
    const { data: application } = await supabase
        .from("recruitment_applications")
        .select("id")
        .eq("discord_chat_thread_id", message.channel.id)
        .single();

    if (!application) return;

    // Find official profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("discord_user_id", message.author.id)
        .single();

    if (!profile) return;

    // Insert into DB (will trigger Realtime on the web)
    await supabase.from("application_messages").insert({
        application_id: application.id,
        author_id: profile.user_id,
        content: message.content
    });
}

client.login(DISCORD_BOT_TOKEN);
