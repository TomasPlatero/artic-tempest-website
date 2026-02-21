import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const roleLevel = session.user?.roleLevel
        if (roleLevel !== "gm" && roleLevel !== "officer") {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const body = await request.json()
        const { title, destination, event_date, end_date, difficulty } = body

        if (!event_date || !destination) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Fake standard backgrounds based on destination
        let background_url = null
        const destLower = destination.toLowerCase()
        if (destLower.includes("ulduar")) {
            background_url = "https://wow.zamimg.com/uploads/screenshots/normal/136894-ulduar.jpg"
        } else if (destLower.includes("naxx")) {
            background_url = "https://wow.zamimg.com/uploads/screenshots/normal/105741-naxxramas.jpg"
        } else if (destLower.includes("malygos") || destLower.includes("eye of eternity")) {
            background_url = "https://wow.zamimg.com/uploads/screenshots/normal/105745-the-eye-of-eternity.jpg"
        } else if (destLower.includes("sartharion") || destLower.includes("obsidian")) {
            background_url = "https://wow.zamimg.com/uploads/screenshots/normal/105742-the-obsidian-sanctum.jpg"
        }

        const { data, error } = await sb
            .from("guild_events")
            .insert({
                title: destination, // For this usecase wowaudit usually titles it by destination
                event_type: "raid",
                event_date,
                end_date: end_date || event_date,
                description: title || "",
                destination,
                difficulty,
                status: "scheduled",
                background_url
            })
            .select()
            .single()

        if (error) {
            console.error("Supabase insert error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, event: data })

    } catch (e: any) {
        console.error("API error:", e)
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 })
    }
}
