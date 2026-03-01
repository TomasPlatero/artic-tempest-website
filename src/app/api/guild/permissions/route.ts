import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function GET() {
    try {
        const { data, error } = await sb
            .from("app_permissions")
            .select("*")

        if (error) throw error
        return NextResponse.json(data || [])
    } catch (err: any) {
        console.error("GET /api/guild/permissions error:", err)
        // Fallback or empty if table doesn't exist yet
        return NextResponse.json([])
    }
}

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        const roleLevel = session?.user?.roleLevel
        if (roleLevel !== "gm" && roleLevel !== "officer") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const body = await request.json()
        const { role_level, app_id, can_view, can_edit } = body

        if (!role_level || !app_id) {
            return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })
        }

        const { error } = await sb
            .from("app_permissions")
            .upsert({
                role_level,
                app_id,
                can_view,
                can_edit
            }, { onConflict: "role_level, app_id" })

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error("PATCH /api/guild/permissions error:", err)
        return NextResponse.json({ error: "Error de base de datos. ¿Has creado la tabla app_permissions?" }, { status: 500 })
    }
}
