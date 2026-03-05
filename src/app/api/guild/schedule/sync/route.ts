import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"
import { addDays, getDay, isAfter, startOfDay, format } from "date-fns"

export const dynamic = "force-dynamic"

const SYNC_DAYS_AHEAD = 60 // 60 days ahead

function getBackgroundUrl(destination: string) {
    if (!destination) return null
    const destLower = destination.toLowerCase()
    if (destLower.includes("voidspire") || destLower.includes("aguja")) return "/assets/images/raids/voidspire.webp"
    if (destLower.includes("dreamrift") || destLower.includes("falla") || destLower.includes("sueño")) return "/assets/images/raids/dreamrift.webp"
    if (destLower.includes("quel'danas") || destLower.includes("sunwell")) return "/assets/images/raids/marchonqueldanas.webp"
    return null
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse("Unauthorized", { status: 401 })

        // Check if user is auth'd & guild lookup
        const { data: guildData } = await supabaseAdmin.from("guilds_managed").select("guild_id, last_schedule_sync").limit(1).single()
        if (!guildData) return NextResponse.json({ error: "Guild not found" }, { status: 404 })
        const guildId = guildData.guild_id

        let force = false
        try {
            const body = await request.json()
            if (body && body.force === true) force = true
        } catch (e) {
            // No body or invalid JSON, ignore
        }

        // Simple debounce: only allow sync once per 6 hours to prevent spam if many users load the calendar
        const now = new Date()
        if (!force && guildData.last_schedule_sync) {
            const msSinceSync = now.getTime() - new Date(guildData.last_schedule_sync).getTime()
            if (msSinceSync < 6 * 60 * 60 * 1000) {
                return NextResponse.json({ message: "Skipped sync, too soon", synced: false })
            }
        }

        // 1. Get active schedules
        const { data: schedules, error: schedError } = await supabaseAdmin.from("guild_raid_schedule")
            .select("*")
            .eq("guild_id", guildId)
            .eq("is_active", true)

        if (schedError) throw schedError

        if (!schedules || schedules.length === 0) {
            return NextResponse.json({ message: "No active schedule to sync", synced: true })
        }

        // 2. Map schedules by day (1 = Monday, 7 = Sunday)
        const schedMap = new Map()
        schedules.forEach(s => {
            if (!schedMap.has(s.day_of_week)) {
                schedMap.set(s.day_of_week, [])
            }
            schedMap.get(s.day_of_week).push(s)
        })

        const eventsToInsert = []
        const today = startOfDay(now)

        // Generate events for the next SYNC_DAYS_AHEAD days
        for (let i = 0; i < SYNC_DAYS_AHEAD; i++) {
            const targetDate = addDays(today, i)
            const dDay = getDay(targetDate) // 0=Sunday, 1=Monday...

            // Map JS Sunday (0) to our DB Sunday (7)
            const dbDayOfWeek = dDay === 0 ? 7 : dDay

            if (schedMap.has(dbDayOfWeek)) {
                const configs = schedMap.get(dbDayOfWeek)

                for (const config of configs) {
                    // parse time strings "HH:mm(:ss)"
                    const [startH, startM] = config.start_time.split(':')
                    const [endH, endM] = config.end_time.split(':')

                    const eventStart = new Date(targetDate)
                    eventStart.setHours(parseInt(startH, 10), parseInt(startM, 10), 0)

                    const eventEnd = new Date(targetDate)
                    eventEnd.setHours(parseInt(endH, 10), parseInt(endM, 10), 0)

                    // If end time is before start time, it likely crossed midnight, add 1 day to end date
                    if (isAfter(eventStart, eventEnd)) {
                        eventEnd.setDate(eventEnd.getDate() + 1)
                    }

                    if (isAfter(eventStart, now)) {
                        eventsToInsert.push({
                            guild_id: guildId,
                            author_id: session.user.id,
                            title: config.destination,
                            description: `Scheduled recurring event`,
                            event_type: 'raid',
                            destination: config.destination,
                            difficulty: config.difficulty,
                            status: 'Scheduled',
                            event_date: eventStart.toISOString(),
                            end_date: eventEnd.toISOString(),
                            background_url: getBackgroundUrl(config.destination),
                            selected_bosses: []
                        })
                    }
                }
            }
        }

        if (eventsToInsert.length === 0) {
            await supabaseAdmin.from("guilds_managed").update({ last_schedule_sync: new Date().toISOString() }).eq("guild_id", guildId)
            return NextResponse.json({ message: "No new events needed", synced: true })
        }

        // 3. fetch EXISTING events in this time range to avoid duplicates
        const startRange = today.toISOString()
        const endRange = addDays(today, SYNC_DAYS_AHEAD).toISOString()

        const { data: existingEvents, error: existErr } = await supabaseAdmin.from("guild_events")
            .select("event_date, destination")
            .eq("guild_id", guildId)
            .gte("event_date", startRange)
            .lte("event_date", endRange)

        if (existErr) throw existErr

        // 4. filter out events that already exist on that exact time and destination
        const finalInsertBatch = eventsToInsert.filter(evt => {
            const duplicate = existingEvents?.find(ex => {
                const isSameTime = new Date(ex.event_date).getTime() === new Date(evt.event_date).getTime()
                return isSameTime && ex.destination === evt.destination
            })
            return !duplicate
        })

        // 5. Insert new events
        if (finalInsertBatch.length > 0) {
            const { error: insertErr } = await supabaseAdmin.from("guild_events").insert(finalInsertBatch)
            if (insertErr) throw insertErr
        }

        // 6. Update last sync time
        await supabaseAdmin.from("guilds_managed").update({ last_schedule_sync: new Date().toISOString() }).eq("guild_id", guildId)

        return NextResponse.json({ message: `Synced ${finalInsertBatch.length} events`, synced: true })

    } catch (error: any) {
        console.error("Error syncing schedule:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
