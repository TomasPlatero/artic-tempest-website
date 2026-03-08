import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"

export const dynamic = "force-dynamic"

export async function GET(_request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse("Unauthorized", { status: 401 })

        const roleLevel = session.user?.roleLevel
        if (roleLevel !== "gm" && roleLevel !== "officer") {
            return new NextResponse("Forbidden", { status: 403 })
        }

        // Get guild_id
        const { data: guildData } = await supabaseAdmin.from("guilds_managed").select("guild_id").limit(1).single()
        if (!guildData) return NextResponse.json({ error: "Guild not found" }, { status: 404 })

        const guildId = guildData.guild_id

        const { data, error } = await supabaseAdmin.from("guild_raid_schedule")
            .select("*")
            .eq("guild_id", guildId)
            .order("day_of_week", { ascending: true })

        if (error) throw error
        return NextResponse.json({ schedule: data })

    } catch (error: any) {
        console.error("Error fetching schedule:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse("Unauthorized", { status: 401 })

        const roleLevel = session.user?.roleLevel
        if (roleLevel !== "gm" && roleLevel !== "officer") {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const body = await request.json()
        const scheduleData = body.schedule // Expecting an array of 7 objects (1 to 7)

        if (!Array.isArray(scheduleData)) {
            return NextResponse.json({ error: "Invalid schedule data format" }, { status: 400 })
        }

        // Get guild_id
        const { data: guildData } = await supabaseAdmin.from("guilds_managed").select("guild_id").limit(1).single()
        if (!guildData) return NextResponse.json({ error: "Guild not found" }, { status: 404 })

        const guildId = guildData.guild_id

        // Upsert all day configurations
        const upsertData = scheduleData.map((day: any) => ({
            guild_id: guildId,
            day_of_week: day.day_of_week,
            start_time: day.start_time,
            end_time: day.end_time,
            destination: day.destination,
            difficulty: day.difficulty,
            is_active: day.is_active
        }))

        // Supabase upsert requires id, but since we have a unique constraint on (guild_id, day_of_week) we can matching on that
        const { data, error } = await supabaseAdmin.from("guild_raid_schedule")
            .upsert(upsertData, { onConflict: 'guild_id, day_of_week' })
            .select()

        if (error) throw error

        return NextResponse.json({ schedule: data })

    } catch (error: any) {
        console.error("Error updating schedule:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

function getBackgroundUrl(destination: string) {
    if (!destination) return null
    const destLower = destination.toLowerCase()
    if (destLower.includes("voidspire") || destLower.includes("aguja")) return "/assets/images/raids/voidspire.webp"
    if (destLower.includes("dreamrift") || destLower.includes("falla") || destLower.includes("sueño") || destLower.includes("onírica")) return "/assets/images/raids/dreamrift.webp"
    if (destLower.includes("quel'danas") || destLower.includes("sunwell") || destLower.includes("marcha")) return "/assets/images/raids/marchonqueldanas.webp"
    return "/assets/images/raids/all-raids.webp"
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Check if user is auth'd & guild lookup
        const { data: guildData } = await supabaseAdmin.from("guilds_managed").select("guild_id, last_schedule_sync").limit(1).single()

        if (!guildData) {
            return NextResponse.json({ error: "Guild not found" }, { status: 404 })
        }
        const guildId = guildData.guild_id

        let force = false
        let startDate: Date | null = null
        try {
            const body = await request.json()
            if (body && body.force === true) force = true
            if (body && body.startDate) startDate = new Date(body.startDate)
        } catch (e) {
            // No body or invalid JSON, ignore
        }

        const now = new Date()
        if (!force && guildData.last_schedule_sync) {
            const msSinceSync = now.getTime() - new Date(guildData.last_schedule_sync).getTime()
            if (msSinceSync < 6 * 60 * 60 * 1000) {
                return NextResponse.json({ message: "Skipped sync, too soon", synced: false })
            }
        }

        const { data: schedules, error: schedError } = await supabaseAdmin.from("guild_raid_schedule")
            .select("*")
            .eq("guild_id", guildId)
            .eq("is_active", true)

        if (schedError) throw schedError

        if (!schedules || schedules.length === 0) {
            return NextResponse.json({ message: "No active schedule to sync", synced: true })
        }

        const schedMap = new Map()
        schedules.forEach(s => {
            if (!schedMap.has(s.day_of_week)) {
                schedMap.set(s.day_of_week, [])
            }
            schedMap.get(s.day_of_week).push(s)
        })

        const eventsToInsert = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Use startDate if provided, otherwise today
        const startFrom = (startDate && !isNaN(startDate.getTime())) ? startDate : today
        if (startFrom.getTime() < today.getTime()) {
            startFrom.setTime(today.getTime())
        }
        startFrom.setHours(0, 0, 0, 0)

        const SYNC_DAYS_AHEAD = 60
        for (let i = 0; i < SYNC_DAYS_AHEAD; i++) {
            const targetDate = new Date(startFrom)
            targetDate.setDate(startFrom.getDate() + i)
            const dDay = targetDate.getDay() // 0=Sunday
            const dbDayOfWeek = dDay === 0 ? 7 : dDay

            if (schedMap.has(dbDayOfWeek)) {
                const configs = schedMap.get(dbDayOfWeek)
                for (const config of configs) {
                    const [startH, startM] = config.start_time.split(':')
                    const [endH, endM] = config.end_time.split(':')

                    const eventStart = new Date(targetDate)
                    eventStart.setHours(parseInt(startH, 10), parseInt(startM, 10), 0)

                    const eventEnd = new Date(targetDate)
                    eventEnd.setHours(parseInt(endH, 10), parseInt(endM, 10), 0)

                    if (eventStart.getTime() > eventEnd.getTime()) {
                        eventEnd.setDate(eventEnd.getDate() + 1)
                    }

                    if (eventStart.getTime() > now.getTime()) {
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

        const { data: existingEvents, error: existErr } = await supabaseAdmin.from("guild_events")
            .select("event_date, destination")
            .eq("guild_id", guildId)
            .gte("event_date", today.toISOString())
            .lte("event_date", new Date(today.getTime() + SYNC_DAYS_AHEAD * 24 * 60 * 60 * 1000).toISOString())

        if (existErr) throw existErr

        const finalInsertBatch = eventsToInsert.filter(evt => {
            const duplicate = existingEvents?.find(ex => {
                const isSameTime = new Date(ex.event_date).getTime() === new Date(evt.event_date).getTime()
                return isSameTime && ex.destination === evt.destination
            })
            return !duplicate
        })

        if (finalInsertBatch.length > 0) {
            const { error: insertErr } = await supabaseAdmin.from("guild_events").insert(finalInsertBatch)
            if (insertErr) throw insertErr
        }

        await supabaseAdmin.from("guilds_managed").update({ last_schedule_sync: new Date().toISOString() }).eq("guild_id", guildId)
        return NextResponse.json({ message: `Synced ${finalInsertBatch.length} events`, synced: true })

    } catch (error: any) {
        console.error("Error syncing schedule:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
