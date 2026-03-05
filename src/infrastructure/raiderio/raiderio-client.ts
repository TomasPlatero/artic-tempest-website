// src/infrastructure/raiderio/raiderio-client.ts
// Raider.io public API client for guild progression

export type RaidProgression = {
    summary: string
    total_bosses: number
    normal_bosses_killed: number
    heroic_bosses_killed: number
    mythic_bosses_killed: number
}

export type RaiderIoGuildProfile = {
    name: string
    region: string
    realm: string
    faction: string
    profile_url: string
    raid_progression: Record<string, RaidProgression>
}

/** Fetch guild raid progression from Raider.io */
export async function fetchGuildProgression(
    realmSlug: string,
    guildName: string,
    region: string = "eu"
): Promise<RaiderIoGuildProfile | null> {
    // Raider.io expects the name with spaces or URL-encoded (e.g. "Artic%20Tempest")
    const url = `https://raider.io/api/v1/guilds/profile?region=${region}&realm=${realmSlug}&name=${encodeURIComponent(guildName)}&fields=raid_progression`

    try {
        // We cache the result for 1 hour to avoid hitting rate limits
        const res = await fetch(url, {
            next: { revalidate: 3600 },
        })

        if (!res.ok) {
            if (res.status === 404) return null
            console.error(`Raider.io API error ${res.status}: ${await res.text()}`)
            return null
        }

        const data: RaiderIoGuildProfile = await res.json()
        return data
    } catch (error) {
        console.error("Failed to fetch Raider.io progression:", error)
        return null
    }
}

/** Fetch character mythic plus and raid progression from Raider.io */
export async function fetchCharacterRIO(
    name: string,
    realm: string,
    region: string = "eu"
): Promise<any | null> {
    const realmSlug = realm.toLowerCase().trim().replace(/\s+/g, '-')
    const seasons = ['current', 'season-mn-1', 'season-tww-3', 'season-tww-2', 'season-tww-1', 'season-df-4', 'season-df-3', 'season-sl-4']
    const raidField = 'raid_progression:tier-mn-1:manaforge-omega:liberation-of-undermine:nerubar-palace:amirdrassil-the-dreams-hope:aberrus-the-shadowed-crucible:vault-of-the-incarnates:sepulcher-of-the-first-ones:sanctum-of-domination:castle-nathria'
    const seasonField = `mythic_plus_scores_by_season:${seasons.join(':')}`
    const url = `https://raider.io/api/v1/characters/profile?region=${region}&realm=${realmSlug}&name=${encodeURIComponent(name)}&fields=${seasonField},${raidField},active_spec_name,gear`

    try {
        const res = await fetch(url, { next: { revalidate: 3600 } })
        if (!res.ok) return null
        return await res.json()
    } catch (error) {
        console.error("Failed to fetch Character RIO:", error)
        return null
    }
}
