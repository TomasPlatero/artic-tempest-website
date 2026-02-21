// src/infrastructure/bnet/bnet-client.ts
// Blizzard Battle.net API client using client_credentials OAuth2

const {
    BNET_CLIENT_ID,
    BNET_CLIENT_SECRET,
} = process.env

if (!BNET_CLIENT_ID || !BNET_CLIENT_SECRET) {
    console.warn("⚠️ Faltan BNET_CLIENT_ID / BNET_CLIENT_SECRET — la sincronización con Battle.net no funcionará")
}

/** Cached token */
let cachedToken: { token: string; expiresAt: number } | null = null

/** Get OAuth2 access token via client_credentials */
export async function getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.token
    }

    const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: BNET_CLIENT_ID!,
        client_secret: BNET_CLIENT_SECRET!,
    })

    const res = await fetch("https://oauth.battle.net/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Battle.net OAuth error ${res.status}: ${text}`)
    }

    const data = await res.json()
    cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 1 min before expiry
    }

    return cachedToken.token
}

/** WoW class names by ID */
export const WOW_CLASSES: Record<number, string> = {
    1: "Guerrero",
    2: "Paladín",
    3: "Cazador",
    4: "Pícaro",
    5: "Sacerdote",
    6: "Caballero de la Muerte",
    7: "Chamán",
    8: "Mago",
    9: "Brujo",
    10: "Monje",
    11: "Druida",
    12: "Cazador de Demonios",
    13: "Evocador",
}

/** WoW guild rank names (common defaults) */
export const RANK_NAMES: Record<number, string> = {
    0: "Guild Master",
    1: "Officer",
    2: "Officer Alt",
    3: "Raider",
    4: "Trial",
    5: "Social",
    6: "Alt",
    7: "Initiate",
}

export type GuildMemberRaw = {
    character: {
        name: string
        id: number
        realm: { slug: string; name: string }
        level: number
        playable_class: { id: number }
        playable_race: { id: number }
    }
    rank: number
}

type GuildRosterResponse = {
    members: GuildMemberRaw[]
}

/** Fetch guild roster from Blizzard API */
export async function fetchGuildRoster(
    realmSlug: string,
    guildNameSlug: string,
    region: string = "eu",
    locale: string = "es_ES"
): Promise<GuildMemberRaw[]> {
    const token = await getAccessToken()

    const url = `https://${region}.api.blizzard.com/data/wow/guild/${realmSlug}/${guildNameSlug}/roster?namespace=profile-${region}&locale=${locale}`

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Blizzard API ${res.status}: ${text}`)
    }

    const data: GuildRosterResponse = await res.json()
    return data.members ?? []
}

/** Convert guild name to slug (lowercase, hyphens, no special chars) */
export function toSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
}
