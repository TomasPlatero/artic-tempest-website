import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/shared/auth/auth-options"
import { ensureAppPermission } from "@/shared/auth/permissions"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        await ensureAppPermission('planificador-cds', 'view')
        // Fetch all unique event_id and boss_name pairs that have assignments
        // and join with guild_events to get event details
        const { data, error } = await supabaseAdmin
            .from("cd_assignments")
            .select(`
                boss_name,
                event_id,
                guild_events (
                    id,
                    event_date,
                    difficulty,
                    destination
                )
            `)

        if (error) throw error

        // Process data to get unique combinations of (eventId, bossName)
        const summaryMap = new Map()

        data?.forEach(row => {
            const event = row.guild_events as any
            if (!event) return

            const key = `${event.id}-${row.boss_name}`
            if (!summaryMap.has(key)) {
                summaryMap.set(key, {
                    id: event.id,
                    event_date: event.event_date,
                    difficulty: event.difficulty,
                    destination: event.destination,
                    boss_name: row.boss_name,
                    assignment_count: 1
                })
            } else {
                summaryMap.get(key).assignment_count++
            }
        })

        const result = Array.from(summaryMap.values())
            .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())

        return NextResponse.json(result)
    } catch (e: any) {
        console.error("GET /api/cd-planner/boss-summaries error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
