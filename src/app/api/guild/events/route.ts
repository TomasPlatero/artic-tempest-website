import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("No autorizado", { status: 401 })
        }

        const roleLevel = session.user?.roleLevel
        if (roleLevel !== "gm" && roleLevel !== "officer") {
            return new NextResponse("Sin permisos", { status: 403 })
        }

        const body = await request.json()
        const { title, destination, event_date, end_date, difficulty, selected_bosses } = body

        if (!event_date || !destination) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
        }

        // Fake standard backgrounds based on destination
        let background_url = null
        const destLower = destination.toLowerCase()
        if (destLower.includes("voidspire") || destLower.includes("aguja")) {
            background_url = "/assets/images/raids/voidspire.webp"
        } else if (destLower.includes("dreamrift") || destLower.includes("falla") || destLower.includes("sueño")) {
            background_url = "/assets/images/raids/dreamrift.webp"
        } else if (destLower.includes("quel'danas") || destLower.includes("sunwell")) {
            background_url = "/assets/images/raids/marchonqueldanas.webp"
        } else if (destLower.includes("todas las raids")) {
            background_url = "/assets/images/raids/all-raids.webp"
        }

        // Get the first guild ID (since the app manages one guild for now)
        const { data: guildData, error: guildError } = await sb
            .from("guilds_managed")
            .select("guild_id")
            .limit(1)
            .single()

        if (guildError || !guildData) {
            console.error("POST /api/guild/events - Guild fetch error:", guildError)
            return NextResponse.json({ error: "Hermandad no encontrada" }, { status: 500 })
        }

        const { data, error } = await sb
            .from("guild_events")
            .insert({
                guild_id: guildData.guild_id,
                author_id: session.user.id,
                title: destination, // For this usecase wowaudit usually titles it by destination
                event_type: "raid",
                event_date,
                end_date: end_date || event_date,
                description: title || "",
                destination,
                difficulty,
                status: "scheduled",
                background_url,
                selected_bosses: selected_bosses || []
            })
            .select()
            .single()

        if (error) {
            console.error("POST /api/guild/events - Insert error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, event: data })

    } catch (e: any) {
        console.error("API error:", e)
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 })
    }
}
