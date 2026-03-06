// src/app/api/loot/raid/route.ts
// GET — Returns cached raid loot entirely from our bnet_* Supabase tables

import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/infrastructure/auth/auth-options"

// Maps arbitrary frontend IDs to official Bnet Instance IDs
const INSTANCE_MAP: Record<string, number> = {
    "voidspire": 1307,
    "queldanas": 1308,
    "dreamrift": 1314,
}

// Maps Blizzard's inventory types to Spanish names
const SLOT_DISPLAY: Record<string, string> = {
    HEAD: "Cabeza", NECK: "Cuello", SHOULDER: "Hombreras", CHEST: "Pecho",
    WAIST: "Cinturón", LEGS: "Piernas", FEET: "Pies", WRIST: "Muñequeras",
    HANDS: "Guantes", HAND: "Guantes", FINGER: "Anillo", TRINKET: "Abalorio",
    ONE_HAND: "Una Mano", TWO_HAND: "Dos Manos", MAIN_HAND: "Mano Principal",
    OFF_HAND: "Mano Secundaria", SHIELD: "Escudo", BACK: "Capa", CLOAK: "Capa",
    HELD_IN_OFF_HAND: "Sostener", RANGED: "A Distancia", THROWN: "Arrojadiza",
    SHIRT: "Camisa", HOLDABLE: "Sostener", TWOHWEAPON: "Arma de 2 Manos", WEAPON: "Arma",
    ROBE: "Toga", NON_EQUIP: "No Equipable", BAG: "Bolsa", TABARD: "Tabardo",
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const difficulty = url.searchParams.get("difficulty") || "heroic"
        const requestedInstanceIdStr = url.searchParams.get("instance_id") || "all"
        const isAll = requestedInstanceIdStr === "all"

        // 1. Get Instance(s) Info
        const instanceIds = isAll ? Object.values(INSTANCE_MAP) : [INSTANCE_MAP[requestedInstanceIdStr.toLowerCase()] || parseInt(requestedInstanceIdStr, 10)]

        if (instanceIds.some(id => isNaN(id))) {
            return NextResponse.json({ error: "ID de banda inválido" }, { status: 400 })
        }

        const { data: instancesInfo, error: instErr } = await supabaseAdmin
            .from("bnet_instances")
            .select("id, name")
            .in("id", instanceIds)

        if (instErr || !instancesInfo || instancesInfo.length === 0) {
            return NextResponse.json({
                error: instancesInfo?.length === 0 ? "Instancia no encontrada" : "Error de base de datos"
            }, { status: 404 })
        }

        // 2. Get Encounters and Loot via Join
        const { data: encounters, error: encErr } = await supabaseAdmin
            .from("bnet_encounters")
            .select(`
                id, 
                name,
                instance_id,
                bnet_encounter_loot (
                    bnet_items (
                        id, name, quality, item_level, required_level, 
                        icon, item_class_id, item_subclass_id, inventory_type, stats
                    )
                )
            `)
            .in("instance_id", instanceIds)
            .order("instance_id", { ascending: true })
            .order("id", { ascending: true })

        if (encErr || !encounters) {
            return NextResponse.json({ error: "Error fetching data from database: " + encErr?.message }, { status: 500 })
        }

        const bosses = []

        for (const encounter of encounters) {
            // bnet_encounter_loot is an array of relations
            const rawLoot = Array.isArray(encounter.bnet_encounter_loot)
                ? encounter.bnet_encounter_loot
                : []

            const items = rawLoot
                .map((rel: any) => rel.bnet_items)
                .filter(Boolean)
                // Filter: we usually only care about equippable gear (Weapon=2, Armor=4).
                // Rings/Trinkets/Necks are Armor.
                .filter((item: any) => item.item_class_id === 2 || item.item_class_id === 4)
                .map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    icon: item.icon,
                    slot: item.inventory_type,
                    slotDisplay: SLOT_DISPLAY[item.inventory_type] || item.inventory_type,
                    quality: item.quality,
                    itemLevel: item.item_level,
                    itemClassId: item.item_class_id,
                    itemSubclassId: item.item_subclass_id,
                    instanceId: encounter.instance_id,
                    stats: item.stats,
                    isManaged: true // Indicates it comes from our central DB
                }))

            if (items.length > 0) {
                bosses.push({
                    id: encounter.id,
                    name: encounter.name,
                    items
                })
            }
        }

        return NextResponse.json({
            instanceId: requestedInstanceIdStr,
            instanceName: isAll ? "Toda la Temporada 1" : instancesInfo[0]?.name || "Desconocida",
            difficulty,
            bosses,
            cached: true,
            fetchedAt: new Date().toISOString(),
            isMidnight: true
        })

    } catch (e: any) {
        console.error("Loot raid error:", e.message)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
