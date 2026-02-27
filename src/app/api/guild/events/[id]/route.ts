import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse("No autorizado", { status: 401 })

        const { id } = await params
        const { data, error } = await sb
            .from("guild_events")
            .select("*")
            .eq("id", id)
            .single()

        if (error) throw error
        return NextResponse.json(data)
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("No autorizado", { status: 401 })
        }

        const roleLevel = session.user?.roleLevel
        if (roleLevel !== "gm" && roleLevel !== "officer") {
            return new NextResponse("Sin permisos", { status: 403 })
        }

        const { id } = await params
        const body = await request.json()

        // Use destructuring to pull what we want to update
        const { event_date, end_date, destination, difficulty, status, selected_bosses } = body

        const updateData: any = {}
        if (event_date) updateData.event_date = event_date
        if (end_date) updateData.end_date = end_date
        if (destination) {
            updateData.destination = destination
            updateData.title = destination

            // Refresh background if destination changed
            let background_url = null
            const destLower = destination.toLowerCase()
            if (destLower.includes("ulduar")) background_url = "https://wow.zamimg.com/uploads/screenshots/normal/136894-ulduar.jpg"
            else if (destLower.includes("naxx")) background_url = "https://wow.zamimg.com/uploads/screenshots/normal/105741-naxxramas.jpg"
            else if (destLower.includes("voidspire")) background_url = "https://www.nerdsquare.eu/wp-content/uploads/2025/08/nerdsquare-wow-midnight-raid-voidspire-700x394.jpg"
            else if (destLower.includes("dreamrift")) background_url = "https://www.nerdsquare.eu/wp-content/uploads/2025/08/nerdsquare-wow-midnight-raid-dreamrift-700x394.jpg"
            else if (destLower.includes("quel'danas") || destLower.includes("sunwell")) background_url = "https://www.nerdsquare.eu/wp-content/uploads/2025/08/nerdsquare-wow-midnight-raid-marchonqueldanas-700x394.jpg"

            if (background_url) updateData.background_url = background_url
        }
        if (difficulty) updateData.difficulty = difficulty
        if (status) updateData.status = status
        if (selected_bosses !== undefined) updateData.selected_bosses = selected_bosses

        const { data, error } = await sb
            .from("guild_events")
            .update(updateData)
            .eq("id", id)
            .select()
            .single()

        if (error) {
            console.error("PATCH /api/guild/events/[id] - Update error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, event: data })

    } catch (e: any) {
        console.error("PATCH event error:", e)
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 })
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse("No autorizado", { status: 401 })

        const roleLevel = session.user?.roleLevel
        if (roleLevel !== "gm" && roleLevel !== "officer") return new NextResponse("Sin permisos", { status: 403 })

        const { id } = await params
        const { error } = await sb.from("guild_events").delete().eq("id", id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
