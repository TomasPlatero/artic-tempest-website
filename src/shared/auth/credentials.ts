// src/shared/auth/credentials.ts
// Centralized credential resolver: Discord config comes from DB; Battle.net/WCL/WoWAudit still allow env fallback.

import { createClient } from "@supabase/supabase-js"

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export type GuildCredentials = {
    discord_client_id: string
    discord_client_secret: string
    discord_app_id: string
    discord_bot_token: string
    discord_public_key: string
    discord_guild_id: string
    discord_streams_channel_id: string
    discord_recruitment_channel_id: string
    discord_requested_scopes: string
    bnet_client_id: string
    bnet_client_secret: string
    wowaudit_api_key: string
    wcl_client_id: string
    wcl_client_secret: string
    sources?: {
        discord: "db" | "env"
        bnet: "db" | "env"
        wowaudit: "db" | "env"
        api: "db" | "env"
    }
}

let cached: { data: GuildCredentials; fetchedAt: number } | null = null

/**
 * Returns integration credentials.
 * Reads Discord config from `app_discord`, Battle.net from `app_battlenet`, WoWAudit from `app_wowaudit`, WCL from `app_wcl`.
 */
export async function getGuildCredentials(): Promise<GuildCredentials> {
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.data
    }

    // We create a lightweight client here to avoid circular dependency with auth-options.ts
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
        // Can't reach DB — return a DB-shaped empty config (no Discord env fallback).
        return emptyDiscordFallback()
    }

    try {
        const sb = createClient(url, key, { auth: { persistSession: false } })
        const [{ data: discordData }, { data: bnetData }, { data: wowauditData }, { data: wclData }] = await Promise.all([
            sb
                .from("app_discord")
                .select("discord_client_id, discord_client_secret, discord_app_id, discord_bot_token, discord_public_key, discord_guild_id, discord_streams_channel_id, discord_recruitment_channel_id, discord_requested_scopes")
                .eq("id", 1)
                .limit(1)
                .maybeSingle(),
            sb
                .from("app_battlenet")
                .select("bnet_client_id, bnet_client_secret")
                .limit(1)
                .maybeSingle(),
            sb
                .from("app_wowaudit")
                .select("wowaudit_api_key")
                .limit(1)
                .maybeSingle(),
            sb
                .from("app_wcl")
                .select("wcl_client_id, wcl_client_secret")
                .limit(1)
                .maybeSingle(),
        ])

        const creds: GuildCredentials = {
            discord_client_id: discordData?.discord_client_id || "",
            discord_client_secret: discordData?.discord_client_secret || "",
            discord_app_id: discordData?.discord_app_id || "",
            discord_bot_token: discordData?.discord_bot_token || "",
            discord_public_key: discordData?.discord_public_key || "",
            discord_guild_id: discordData?.discord_guild_id || "",
            discord_streams_channel_id: discordData?.discord_streams_channel_id || "",
            discord_recruitment_channel_id: discordData?.discord_recruitment_channel_id || "",
            discord_requested_scopes: discordData?.discord_requested_scopes || "identify guilds guilds.members.read",
            bnet_client_id: bnetData?.bnet_client_id || process.env.BNET_CLIENT_ID || "",
            bnet_client_secret: bnetData?.bnet_client_secret || process.env.BNET_CLIENT_SECRET || "",
            wowaudit_api_key: wowauditData?.wowaudit_api_key || process.env.WOWAUDIT_API_KEY || "",
            wcl_client_id: wclData?.wcl_client_id || process.env.WCL_CLIENT_ID || "",
            wcl_client_secret: wclData?.wcl_client_secret || process.env.WCL_CLIENT_SECRET || "",
            sources: {
                discord: "db",
                bnet: bnetData?.bnet_client_id ? "db" : "env",
                wowaudit: wowauditData?.wowaudit_api_key ? "db" : "env",
                api: wclData?.wcl_client_id ? "db" : "env",
            }
        }

        cached = { data: creds, fetchedAt: Date.now() }
        return creds
    } catch (e) {
        console.error("credentials.ts: Failed to fetch from DB; returning empty Discord config", e)
        return emptyDiscordFallback()
    }
}

/** Invalidate the in-memory cache (call after saving new credentials) */
export function invalidateCredentialsCache() {
    cached = null
}

function emptyDiscordFallback(): GuildCredentials {
    return {
        discord_client_id: "",
        discord_client_secret: "",
        discord_app_id: "",
        discord_bot_token: "",
        discord_public_key: "",
        discord_guild_id: "",
        discord_streams_channel_id: "",
        discord_recruitment_channel_id: "",
        discord_requested_scopes: "identify guilds guilds.members.read",
        bnet_client_id: process.env.BNET_CLIENT_ID || "",
        bnet_client_secret: process.env.BNET_CLIENT_SECRET || "",
        wowaudit_api_key: process.env.WOWAUDIT_API_KEY || "",
        wcl_client_id: process.env.WCL_CLIENT_ID || "",
        wcl_client_secret: process.env.WCL_CLIENT_SECRET || "",
        sources: {
            discord: "db",
            bnet: "env",
            wowaudit: "env",
            api: "env",
        }
    }
}
