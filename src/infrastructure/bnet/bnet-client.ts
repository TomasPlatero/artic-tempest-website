// src/infrastructure/bnet/bnet-client.ts
// Blizzard Battle.net API client using client_credentials OAuth2

import { getGuildCredentials } from "@/infrastructure/auth/credentials"

/** Cached token */
let cachedToken: { token: string; expiresAt: number } | null = null

/** Get OAuth2 access token via client_credentials */
export async function getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.token
    }

    const creds = await getGuildCredentials()
    if (!creds.bnet_client_id || !creds.bnet_client_secret) {
        throw new Error("Faltan credenciales de Battle.net (configúralas en Ajustes > Dashboard)")
    }

    const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: creds.bnet_client_id,
        client_secret: creds.bnet_client_secret,
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

const SPEC_TO_ROLE: Record<string, string> = {
    // Death Knight
    "Blood": "Tank", "Frost": "Melee", "Unholy": "Melee",
    // Demon Hunter
    "Havoc": "Melee", "Vengeance": "Tank",
    // Druid
    "Balance": "Ranged", "Feral": "Melee", "Guardian": "Tank", "Restoration": "Heal",
    // Evoker
    "Devastation": "Ranged", "Preservation": "Heal", "Augmentation": "Ranged",
    // Hunter
    "Beast Mastery": "Ranged", "Marksmanship": "Ranged", "Survival": "Melee",
    // Mage
    "Arcane": "Ranged", "Fire": "Ranged", // Frost is covered under DK, but mapped to Ranged if mage (handled via class if collision occurs, but we'll use a better approach)
    // Monk
    "Brewmaster": "Tank", "Windwalker": "Melee", "Mistweaver": "Heal",
    // Paladin
    "Holy": "Heal", "Protection": "Tank", "Retribution": "Melee",
    // Priest
    "Discipline": "Heal", "Shadow": "Ranged", // Holy is covered
    // Rogue
    "Assassination": "Melee", "Outlaw": "Melee", "Subtlety": "Melee",
    // Shaman
    "Elemental": "Ranged", "Enhancement": "Melee", // Restoration is covered
    // Warlock
    "Affliction": "Ranged", "Demonology": "Ranged", "Destruction": "Ranged",
    // Warrior
    "Arms": "Melee", "Fury": "Melee", // Protection covered
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
    role?: string // dynamically fetched
}

type GuildRosterResponse = {
    members: GuildMemberRaw[]
}

/** Fetch a single character's active spec and deduce their role */
export async function fetchCharacterRole(
    realmSlug: string,
    characterNameSlug: string,
    region: string,
    token: string
): Promise<string | null> {
    const url = `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${characterNameSlug}?namespace=profile-${region}&locale=en_US`

    try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
        if (!res.ok) return null

        const data = await res.json()
        const specName = data.active_spec?.name as string
        if (!specName) return null

        // Handle collision: Frost can be Mage (Ranged) or DK (Melee). Protection can be Paladin (Tank) or Warrior (Tank). Holy can be Paladin (Heal) or Priest (Heal).
        // For Frost Mage/DK:
        if (specName === "Frost") {
            return data.character_class?.id === 8 /* Mage */ ? "Ranged" : "Melee"
        }

        return SPEC_TO_ROLE[specName] || null
    } catch {
        return null
    }
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
    const members = data.members ?? []

    // Fetch active specs in chunks to avoid overwhelming the server/connections
    const CHUNK_SIZE = 20
    for (let i = 0; i < members.length; i += CHUNK_SIZE) {
        const chunk = members.slice(i, i + CHUNK_SIZE)
        await Promise.all(
            chunk.map(async (m) => {
                // only fetch specs for higher level to save bandwidth? The user wants max accuracy, we fetch for all.
                const role = await fetchCharacterRole(m.character.realm.slug, toSlug(m.character.name), region, token)
                if (role) {
                    m.role = role
                }
            })
        )
    }

    return members
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
