import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const member_id = searchParams.get("member_id")
    const instance_id = searchParams.get("instance_id")
    const difficulty = searchParams.get("difficulty")

    try {
        if (member_id) {
            // Fetch specific member selections
            let query = sb
                .from("bis_selections")
                .select("*")
                .eq("member_id", member_id)

            if (difficulty) query = query.eq("difficulty", difficulty)

            const numericInstanceId = parseInt(instance_id || "0", 10)
            if (!isNaN(numericInstanceId) && numericInstanceId !== 0) {
                query = query.eq("instance_id", numericInstanceId)
            }

            const { data, error } = await query.order("slot")
            if (error) throw error
            return NextResponse.json(data || [])
        }

        // Fetch rank visibility configurations to match Roster app behavior
        const { data: rawRanks } = await sb
            .from("guild_ranks")
            .select("rank, is_visible")

        const visibilityMap: Record<number, boolean> = {}
        // Default to true for all ranks if not configured
        for (let i = 0; i <= 9; i++) visibilityMap[i] = true
        rawRanks?.forEach(r => {
            visibilityMap[r.rank] = r.is_visible
        })

        // Fetch summary for all members with a character in guild_members
        const { data: members, error } = await sb
            .from("guild_members")
            .select("id, character_name, class_id, rank, realm_slug")
            .lte("rank", 9)
            .order("character_name")

        if (error) throw error

        // Filter members based on rank visibility
        const visibleMembers = (members || []).filter(m => visibilityMap[Number(m.rank)] !== false)

        const { data: selectionsCount } = await sb
            .from("bis_selections")
            .select("member_id")

        const selectionMap = new Map()
        selectionsCount?.forEach(s => {
            selectionMap.set(s.member_id, (selectionMap.get(s.member_id) || 0) + 1)
        })

        const processed = visibleMembers.map((m: any) => ({
            ...m,
            selection_count: selectionMap.get(m.id) || 0
        }))

        return NextResponse.json({
            members: processed,
            ranks: rawRanks || []
        })
    } catch (error: any) {
        console.error("BiS Admin API Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
