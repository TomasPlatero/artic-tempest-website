"use server";

import { supabaseAdmin, authOptions } from "@/infrastructure/auth/auth-options";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { getGuildCredentials } from "@/infrastructure/auth/credentials";

export async function getEnrichedStreamers() {
    try {
        const { data: guild } = await supabaseAdmin.from('guilds_managed').select('guild_id').single()
        if (!guild) return [];

        const { data: streamers, error } = await supabaseAdmin.from('guild_streamers')
            .select('*')
            .eq('guild_id', guild.guild_id)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })

        if (error || !streamers) return [];

        const enrichedStreamers = await Promise.all(streamers.map(async (st) => {
            try {
                const uptimeRes = await fetch(`https://decapi.me/twitch/uptime/${st.twitch_username}`, { next: { revalidate: 60 } })
                const text = await uptimeRes.text()
                const isLive = !text.toLowerCase().includes("offline") && !text.includes("User not found")

                let avatarUrl = null
                try {
                    const avatarRes = await fetch(`https://decapi.me/twitch/avatar/${st.twitch_username}`, { next: { revalidate: 3600 } })
                    const avatarText = await avatarRes.text()
                    if (avatarText.startsWith("http")) avatarUrl = avatarText
                } catch (err) { }

                return { ...st, is_live: isLive, avatar_url: avatarUrl }
            } catch (e) {
                return { ...st, is_live: false, avatar_url: null }
            }
        }))

        enrichedStreamers.sort((a, b) => {
            if (a.is_live !== b.is_live) return a.is_live ? -1 : 1
            return (a.sort_order || 0) - (b.sort_order || 0)
        })

        return enrichedStreamers;
    } catch (err) {
        console.error("Error fetching streamers:", err);
        return [];
    }
}

import { ensureAdmin } from "@/infrastructure/auth/permissions";

export async function addStreamer(twitchUsername: string) {
    await ensureAdmin();
    const { data: guild } = await supabaseAdmin.from('guilds_managed').select('guild_id').single();
    if (!guild) throw new Error("Guild not found");

    const { data, error } = await supabaseAdmin.from('guild_streamers')
        .insert({
            guild_id: guild.guild_id,
            twitch_username: twitchUsername.toLowerCase().trim(),
        })
        .select()
        .single();

    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/streamers");
    return data;
}

export async function removeStreamer(id: string) {
    await ensureAdmin();
    const { error } = await supabaseAdmin.from('guild_streamers')
        .delete()
        .eq('id', id);

    if (error) throw error;
    revalidatePath("/");
    revalidatePath("/streamers");
}

export async function updateStreamersOrder(items: { id: string; sort_order: number }[]) {
    await ensureAdmin();
    const updates = items.map(item =>
        supabaseAdmin.from('guild_streamers')
            .update({ sort_order: item.sort_order })
            .eq('id', item.id)
    );

    await Promise.all(updates);
    revalidatePath("/");
    revalidatePath("/streamers");
}

export async function getStreamerConfig() {
    await ensureAdmin();
    const { data, error } = await supabaseAdmin.from('guilds_managed')
        .select('discord_streams_channel_id')
        .single();

    if (error) throw error;
    return data;
}

export async function updateStreamerConfig(discordChannelId: string) {
    await ensureAdmin();
    const { data: guild } = await supabaseAdmin.from('guilds_managed').select('guild_id').single();
    if (!guild) throw new Error("Guild not found");

    const { error } = await supabaseAdmin.from('guilds_managed')
        .update({ discord_streams_channel_id: discordChannelId })
        .eq('guild_id', guild.guild_id);

    if (error) throw error;
}

export async function getDiscordChannels() {
    await ensureAdmin();
    const creds = await getGuildCredentials();
    if (!creds.discord_bot_token || !creds.discord_guild_id) {
        throw new Error("Discord not configured");
    }

    const res = await fetch(`https://discord.com/api/v10/guilds/${creds.discord_guild_id}/channels`, {
        headers: { Authorization: `Bot ${creds.discord_bot_token}` }
    });

    if (!res.ok) throw new Error("Failed to fetch channels");
    const channels = await res.json();

    return channels
        .filter((c: any) => c.type === 0 || c.type === 5)
        .map((c: any) => ({ id: c.id, name: c.name }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
}
