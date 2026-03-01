// src/infrastructure/auth/credentials.ts
// Centralized credential resolver: DB first, .env fallback, in-memory cache.

import { createClient } from "@supabase/supabase-js"

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export type GuildCredentials = {
    discord_client_id: string
    discord_client_secret: string
    discord_app_id: string
    discord_bot_token: string
    discord_public_key: string
    discord_guild_id: string
    bnet_client_id: string
    bnet_client_secret: string
}

let cached: { data: GuildCredentials; fetchedAt: number } | null = null

/**
 * Returns guild integration credentials.
 * Reads from `guilds_managed` table with a 5-minute in-memory cache.
 * Falls back to process.env for any missing value.
 */
export async function getGuildCredentials(): Promise<GuildCredentials> {
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.data
    }

    // We create a lightweight client here to avoid circular dependency with auth-options.ts
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
        // Can't reach DB — return env-only
        return envFallback()
    }

    try {
        const sb = createClient(url, key, { auth: { persistSession: false } })
        const { data } = await sb
            .from("guilds_managed")
            .select("discord_client_id, discord_client_secret, discord_app_id, discord_bot_token, discord_public_key, discord_guild_id, bnet_client_id, bnet_client_secret")
            .limit(1)
            .single()

        const creds: GuildCredentials = {
            discord_client_id: data?.discord_client_id || process.env.DISCORD_CLIENT_ID || "",
            discord_client_secret: data?.discord_client_secret || process.env.DISCORD_CLIENT_SECRET || "",
            discord_app_id: data?.discord_app_id || process.env.DISCORD_APP_ID || "",
            discord_bot_token: data?.discord_bot_token || process.env.DISCORD_BOT_TOKEN || "",
            discord_public_key: data?.discord_public_key || process.env.DISCORD_PUBLIC_KEY || "",
            discord_guild_id: data?.discord_guild_id || process.env.DISCORD_GUILD_ID || "",
            bnet_client_id: data?.bnet_client_id || process.env.BNET_CLIENT_ID || "",
            bnet_client_secret: data?.bnet_client_secret || process.env.BNET_CLIENT_SECRET || "",
        }

        cached = { data: creds, fetchedAt: Date.now() }
        return creds
    } catch (e) {
        console.error("credentials.ts: Failed to fetch from DB, using env fallback", e)
        return envFallback()
    }
}

/** Invalidate the in-memory cache (call after saving new credentials) */
export function invalidateCredentialsCache() {
    cached = null
}

function envFallback(): GuildCredentials {
    return {
        discord_client_id: process.env.DISCORD_CLIENT_ID || "",
        discord_client_secret: process.env.DISCORD_CLIENT_SECRET || "",
        discord_app_id: process.env.DISCORD_APP_ID || "",
        discord_bot_token: process.env.DISCORD_BOT_TOKEN || "",
        discord_public_key: process.env.DISCORD_PUBLIC_KEY || "",
        discord_guild_id: process.env.DISCORD_GUILD_ID || "",
        bnet_client_id: process.env.BNET_CLIENT_ID || "",
        bnet_client_secret: process.env.BNET_CLIENT_SECRET || "",
    }
}
