import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export const dynamic = "force-dynamic"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("No autorizado", { status: 401 })
        }

        const { id } = await params

        // 1. Fetch visible ranks first since the direct join might fail without explicit FK
        const { data: visibleRanks } = await sb
            .from("guild_ranks")
            .select("rank")
            .eq("is_visible", true)

        const visibleRankIds = visibleRanks?.map(r => r.rank) || []

        // 2. Fetch signups for members in visible ranks
        const { data: roster, error } = await sb
            .from("event_signups")
            .select(`
                member_id, 
                event_role, 
                selection_status, 
                selected_bosses,
                guild_members!inner(
                    character_name, 
                    class_id,
                    rank
                )
            `)
            .eq("event_id", id)
            .eq("selection_status", "selected")
            .in("guild_members.rank", visibleRankIds)

        if (error) throw error

        return NextResponse.json(roster)
    } catch (e: any) {
        console.error("GET /api/guild/events/[id]/selected-roster error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
