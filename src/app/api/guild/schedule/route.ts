import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse("Unauthorized", { status: 401 })

        const roleLevel = session.user?.roleLevel
        if (roleLevel !== "gm" && roleLevel !== "officer") {
            return new NextResponse("Forbidden", { status: 403 })
        }

        // Get guild_id
        const { data: guildData } = await sb.from("guilds_managed").select("guild_id").limit(1).single()
        if (!guildData) return NextResponse.json({ error: "Guild not found" }, { status: 404 })

        const guildId = guildData.guild_id

        const { data, error } = await sb
            .from("guild_raid_schedule")
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
        const { data: guildData } = await sb.from("guilds_managed").select("guild_id").limit(1).single()
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
        const { data, error } = await sb
            .from("guild_raid_schedule")
            .upsert(upsertData, { onConflict: 'guild_id, day_of_week' })
            .select()

        if (error) throw error

        return NextResponse.json({ schedule: data })

    } catch (error: any) {
        console.error("Error updating schedule:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
