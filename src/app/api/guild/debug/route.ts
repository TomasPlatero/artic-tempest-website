import { NextResponse } from "next/server"
import { sb } from "@/infrastructure/auth/auth-options"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        console.log("DEBUG ENDPOINT: fetch visible ranks")
        const { data: visibleRanks, error: vrError } = await sb
            .from("guild_ranks")
            .select("rank")
            .eq("is_visible", true)

        const visibleRankIds = (visibleRanks || []).map(r => r.rank)

        console.log("DEBUG ENDPOINT: fetch members")
        let query = sb.from("guild_members").select("*")
        if (visibleRankIds.length > 0) {
            query = query.in("rank", visibleRankIds)
        }
        const { data: members, error: mError } = await query.order("rank", { ascending: true })

        console.log("DEBUG ENDPOINT: RAW check")
        const { data: rawCheck, error: rawError } = await sb.from("guild_members").select("id").limit(1)

        return NextResponse.json({
            visibleRanks: { data: visibleRanks, error: vrError?.message },
            members: { count: members?.length, error: mError?.message },
            rawCheck: { count: rawCheck?.length, error: rawError?.message },
            env: { hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY }
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
