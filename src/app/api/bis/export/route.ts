import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/infrastructure/auth/auth-options"

// We make this route fully public and dynamic because it's called from a raw script
export const dynamic = "force-dynamic"

export async function GET() {
    try {
        // Build a set of all valid Item IDs currently stored in our Battle.net cache
        const { data: encounterLoot, error: lootErr } = await supabaseAdmin
            .from("bnet_encounter_loot")
            .select("item_id")

        if (lootErr) throw lootErr

        const validItemIds = new Set<number>()
        encounterLoot?.forEach(l => validItemIds.add(l.item_id))

        // Fetch all members with valid realms
        const { data: members, error: membersError } = await supabaseAdmin
            .from("guild_members")
            .select("id, character_name, realm_slug")

        if (membersError) throw membersError

        // Fetch all BiS selections
        const { data: selections, error: selectionsError } = await supabaseAdmin
            .from("bis_selections")
            .select("member_id, item_id, difficulty, ilvl")

        if (selectionsError) throw selectionsError

        // Map members by ID for easy lookup
        const memberMap = new Map()
        members?.forEach(m => {
            if (m.character_name && m.realm_slug) {
                const realm = m.realm_slug.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join('')
                memberMap.set(m.id, `${m.character_name}-${realm}`)
            }
        })

        // Build the output JSON format
        const timestamp = Math.floor(Date.now() / 1000)
        const exportData: Record<string, Record<string, { isBis: boolean, ilvl?: number }>> = {}

        selections?.forEach(selection => {
            const itemId = parseInt(selection.item_id, 10)

            // Only export items that we track (which means they are from valid raids we synced)
            if (!validItemIds.has(itemId)) return

            const memberKey = memberMap.get(selection.member_id)
            if (!memberKey) return

            if (!exportData[memberKey]) {
                exportData[memberKey] = {}
            }

            // Append difficulty suffix: N (Normal), H (Heroic), M (Mythic)
            let suffix = ""
            if (selection.difficulty === "mythic") {
                suffix = "M"
            } else if (selection.difficulty === "heroic") {
                suffix = "H"
            } else if (selection.difficulty === "normal") {
                suffix = "N"
            }

            const keyWithSuffix = `${selection.item_id}${suffix}`
            exportData[memberKey][keyWithSuffix] = {
                isBis: true,
                ilvl: selection.ilvl || 0
            }
        })

        const finalOutput = {
            timestamp,
            data: exportData
        }

        return NextResponse.json(finalOutput, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=0, max-age=0, must-revalidate",
            }
        })

    } catch (e: any) {
        console.error("BiS Export API Error:", e.message)
        return new NextResponse(`Error interno: ${e.message}`, { status: 500, headers: { "Content-Type": "text/plain" } })
    }
}
