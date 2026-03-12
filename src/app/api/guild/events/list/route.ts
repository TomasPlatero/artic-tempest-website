import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("No autorizado", { status: 401 })
        }

        const today = new Date().toISOString().split('T')[0]
        const { data: events, error } = await supabaseAdmin.from("guild_events")
            .select("id, title, destination, event_date, difficulty")
            .gte("event_date", today)
            .order("event_date", { ascending: true })
            .limit(10)

        if (error) throw error

        return NextResponse.json(events)
    } catch (e: any) {
        console.error("GET /api/guild/events/list error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
