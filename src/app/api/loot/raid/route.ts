// src/app/api/loot/raid/route.ts
// GET — Returns cached raid loot, auto-fetches from Blizzard if stale/missing

import { NextResponse } from "next/server"
import { sb } from "@/infrastructure/auth/auth-options"
import { getGuildCredentials } from "@/infrastructure/auth/credentials"
import { MIDNIGHT_RAIDS } from "@/infrastructure/constants/raids"
import { MIDNIGHT_LOOT } from "@/infrastructure/constants/midnight-loot"

const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

// WoW item inventory type → readable slot name
const INVENTORY_TYPE_MAP: Record<number, string> = {
    1: "HEAD", 2: "NECK", 3: "SHOULDER", 4: "SHIRT", 5: "CHEST", 6: "WAIST",
    7: "LEGS", 8: "FEET", 9: "WRIST", 10: "HANDS", 11: "FINGER",
    12: "TRINKET", 13: "ONE_HAND", 14: "SHIELD", 15: "RANGED",
    16: "BACK", 17: "TWO_HAND", 20: "CHEST", 21: "MAIN_HAND", 22: "OFF_HAND",
    23: "HELD_IN_OFF_HAND", 25: "THROWN", 26: "RANGED",
}

const SLOT_DISPLAY: Record<string, string> = {
    HEAD: "Cabeza", NECK: "Cuello", SHOULDER: "Hombreras", CHEST: "Pecho",
    WAIST: "Cinturón", LEGS: "Piernas", FEET: "Pies", WRIST: "Muñequeras",
    HANDS: "Guantes", FINGER: "Anillo", TRINKET: "Abalorio",
    ONE_HAND: "Una Mano", TWO_HAND: "Dos Manos", MAIN_HAND: "Mano Principal",
    OFF_HAND: "Mano Secundaria", SHIELD: "Escudo", BACK: "Capa", CLOAK: "Capa",
    HELD_IN_OFF_HAND: "Sostener", RANGED: "A Distancia", THROWN: "Arrojadiza",
    SHIRT: "Camisa", HAND: "Guantes", HOLDABLE: "Sostener",
    TWOHWEAPON: "Arma de 2 Manos", WEAPON: "Arma",
}

async function getBnetToken(clientId: string, clientSecret: string): Promise<string> {
    const res = await fetch("https://oauth.battle.net/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }).toString()
    })
    if (!res.ok) throw new Error("Bnet OAuth failed: " + res.status)
    return (await res.json()).access_token
}

async function fetchRaidLoot(token: string, region: string, instanceId: number) {
    // 1. Get instance details (encounters list)
    const instRes = await fetch(
        `https://${region}.api.blizzard.com/data/wow/journal-instance/${instanceId}?namespace=static-${region}&locale=es_ES`,
        { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!instRes.ok) throw new Error(`Instance fetch failed: ${instRes.status}`)
    const instance = await instRes.json()

    const encounters = instance.encounters || []
    const bosses: any[] = []

    // 2. For each encounter, fetch items
    for (const enc of encounters) {
        const encRes = await fetch(
            `https://${region}.api.blizzard.com/data/wow/journal-encounter/${enc.id}?namespace=static-${region}&locale=es_ES`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!encRes.ok) continue
        const encounter = await encRes.json()

        const items = (encounter.items || []).map((item: any) => ({
            id: item.item?.id,
            name: item.item?.name || "Unknown",
            quality: item.item?.quality?.type || "EPIC",
        }))

        bosses.push({
            id: enc.id,
            name: encounter.name || enc.name,
            order: encounters.indexOf(enc),
            items,
        })
    }

    // 3. Enrich items with slot + icon (batch by item)
    for (const boss of bosses) {
        for (const item of boss.items) {
            if (!item.id) continue
            try {
                // Get item details (slot)
                const itemRes = await fetch(
                    `https://${region}.api.blizzard.com/data/wow/item/${item.id}?namespace=static-${region}&locale=es_ES`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                if (itemRes.ok) {
                    const itemData = await itemRes.json()
                    const invType = itemData.inventory_type?.type
                    const invTypeId = itemData.inventory_type?.id
                    item.slot = invType || INVENTORY_TYPE_MAP[invTypeId] || "UNKNOWN"
                    item.slotDisplay = SLOT_DISPLAY[item.slot] || item.slot
                    item.itemLevel = itemData.level || null
                    item.itemSubclass = itemData.item_subclass?.name || null
                    item.itemClassId = itemData.item_class?.id ?? null      // 2=Weapon, 4=Armor
                    item.itemSubclassId = itemData.item_subclass?.id ?? null // Armor: 1=Cloth,2=Leather,3=Mail,4=Plate,6=Shield | Weapon: 0=1hAxe,4=1hMace,7=1hSword, etc.
                }

                // Get item icon
                const mediaRes = await fetch(
                    `https://${region}.api.blizzard.com/data/wow/media/item/${item.id}?namespace=static-${region}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                if (mediaRes.ok) {
                    const media = await mediaRes.json()
                    item.icon = media.assets?.[0]?.value || null
                }
            } catch {
                // Item enrichment is best-effort
            }
        }
        // Filter out non-equippables (must be Weapon or Armor)
        boss.items = boss.items.filter((item: any) => item.itemClassId === 2 || item.itemClassId === 4)
    }

    return {
        instanceId,
        instanceName: instance.name || "Unknown Raid",
        bosses: bosses.filter(b => b.items.length > 0),
    }
}

// Auto-discover the latest raid from the journal index
async function discoverLatestRaid(token: string, region: string): Promise<number> {
    // Get all journal expansions
    const expRes = await fetch(
        `https://${region}.api.blizzard.com/data/wow/journal-expansion/index?namespace=static-${region}&locale=es_ES`,
        { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!expRes.ok) throw new Error("Failed to fetch journal expansions")
    const expansions = await expRes.json()

    // Get the last expansion (newest)
    const tiers = expansions.tiers || []
    if (tiers.length === 0) throw new Error("No expansions found")
    const latestExpansion = tiers[tiers.length - 1]

    // Get the instances (raids) for this expansion
    const tierRes = await fetch(
        `https://${region}.api.blizzard.com/data/wow/journal-expansion/${latestExpansion.id}?namespace=static-${region}&locale=es_ES`,
        { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!tierRes.ok) throw new Error("Failed to fetch expansion details")
    const tierData = await tierRes.json()

    const raids = tierData.raids || []
    if (raids.length === 0) {
        throw new Error("No se han encontrado bandas en la expansión Midnight.")
    }

    // Return the last raid in the expansion (usually the current tier)
    return raids[raids.length - 1].id
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const difficulty = url.searchParams.get("difficulty") || "heroic"
        const requestedInstanceId = url.searchParams.get("instance_id")
        const forceRefresh = url.searchParams.get("refresh") === "true"

        // Get guild info for region
        const { data: guild } = await sb
            .from("guilds_managed")
            .select("region")
            .limit(1)
            .single()

        const region = guild?.region || "eu"

        // Get Bnet credentials early — needed for both cache-miss and discovery
        const creds = await getGuildCredentials()
        if (!creds.bnet_client_id || !creds.bnet_client_secret) {
            return NextResponse.json({ error: "Faltan credenciales de Battle.net" }, { status: 400 })
        }

        let instanceId: number | string

        if (requestedInstanceId) {
            // Explicit instance ID requested
            instanceId = requestedInstanceId
        } else {
            // Auto-discover: find the latest cached raid first, or discover from API
            const { data: latestCache } = await sb
                .from("raid_loot_cache")
                .select("instance_id")
                .eq("difficulty", difficulty)
                .order("fetched_at", { ascending: false })
                .limit(1)
                .single()

            if (latestCache) {
                instanceId = latestCache.instance_id
            } else {
                // No cache exists — discover from Blizzard Journal API
                const token = await getBnetToken(creds.bnet_client_id, creds.bnet_client_secret)
                instanceId = await discoverLatestRaid(token, region)
            }
        }

        // --- MIDNIGHT INTERCEPTOR ---
        if (typeof instanceId === "string" && MIDNIGHT_LOOT[instanceId]) {
            const raidInfo = MIDNIGHT_RAIDS.find(r => r.id === instanceId)
            return NextResponse.json({
                instanceId,
                instanceName: raidInfo?.name || "Midnight Raid",
                difficulty,
                bosses: MIDNIGHT_LOOT[instanceId],
                cached: true,
                fetchedAt: new Date().toISOString(),
                isMidnight: true
            })
        }
        // Force numeric for Blizzard IDs
        const blizzardId = typeof instanceId === "string" ? parseInt(instanceId, 10) : instanceId
        if (isNaN(blizzardId as number)) {
            // If it's a string that wasn't a Midnight ID and isn't a number, it's invalid
            return NextResponse.json({ error: "ID de banda inválido" }, { status: 400 })
        }
        instanceId = blizzardId

        // Check cache
        const { data: cached } = await sb
            .from("raid_loot_cache")
            .select("*")
            .eq("instance_id", instanceId)
            .eq("difficulty", difficulty)
            .single()

        if (cached && !forceRefresh) {
            const age = Date.now() - new Date(cached.fetched_at).getTime()
            if (age < CACHE_MAX_AGE_MS) {
                return NextResponse.json({
                    instanceId,
                    instanceName: cached.instance_name,
                    difficulty,
                    bosses: cached.loot_data,
                    cached: true,
                    fetchedAt: cached.fetched_at,
                })
            }
        }

        // Fetch fresh from Blizzard
        const token = await getBnetToken(creds.bnet_client_id, creds.bnet_client_secret)
        const raidData = await fetchRaidLoot(token, region, instanceId)

        // Upsert cache
        await sb.from("raid_loot_cache").upsert({
            instance_id: instanceId,
            instance_name: raidData.instanceName,
            difficulty,
            loot_data: raidData.bosses,
            fetched_at: new Date().toISOString(),
        }, { onConflict: "instance_id,difficulty" })

        return NextResponse.json({
            instanceName: raidData.instanceName,
            difficulty,
            bosses: raidData.bosses,
            cached: false,
            fetchedAt: new Date().toISOString(),
        })

    } catch (e: any) {
        console.error("Loot raid error:", e.message)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
