// src/app/api/loot/raid/route.ts
// GET — Returns cached raid loot entirely from our bnet_* Supabase tables

import { NextResponse } from "next/server"
import { sb } from "@/infrastructure/auth/auth-options"

// Maps arbitrary frontend IDs to official Bnet Instance IDs
const INSTANCE_MAP: Record<string, number> = {
    "voidspire": 1307,
    "marchonqueldanas": 1308,
    "dreamwell": 1314,
}

// Maps Blizzard's inventory types to Spanish names
const SLOT_DISPLAY: Record<string, string> = {
    HEAD: "Cabeza", NECK: "Cuello", SHOULDER: "Hombreras", CHEST: "Pecho",
    WAIST: "Cinturón", LEGS: "Piernas", FEET: "Pies", WRIST: "Muñequeras",
    HANDS: "Guantes", FINGER: "Anillo", TRINKET: "Abalorio",
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
        const requestedInstanceIdStr = url.searchParams.get("instance_id") || "voidspire"

        // Map "voidspire" to 1267, otherwise try parsing as int
        const instanceId = INSTANCE_MAP[requestedInstanceIdStr.toLowerCase()] || parseInt(requestedInstanceIdStr, 10)

        if (isNaN(instanceId)) {
            return NextResponse.json({ error: "ID de banda inválido" }, { status: 400 })
        }

        // 1. Get Instance Name
        const { data: instanceInfo, error: instErr } = await sb
            .from("bnet_instances")
            .select("name")
            .eq("id", instanceId)
            .single()

        if (instErr || !instanceInfo) {
            return NextResponse.json({
                error: "Instancia no encontrada en la base de datos. Pide a un oficial que sincronice los datos desde Ajustes > Apps > BiS List."
            }, { status: 404 })
        }

        // 2. Get Encounters and Loot via Join
        const { data: encounters, error: encErr } = await sb
            .from("bnet_encounters")
            .select(`
                id, 
                name,
                bnet_encounter_loot (
                    bnet_items (
                        id, name, quality, item_level, required_level, 
                        icon, item_class_id, item_subclass_id, inventory_type
                    )
                )
            `)
            .eq("instance_id", instanceId)
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
            instanceId,
            instanceName: instanceInfo.name,
            difficulty,
            bosses,
            cached: true,
            fetchedAt: new Date().toISOString(),
            isMidnight: true // Preserved for frontend logic if needed
        })

    } catch (e: any) {
        console.error("Loot raid error:", e.message)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
