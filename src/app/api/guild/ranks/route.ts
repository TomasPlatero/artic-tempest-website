import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function PATCH(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        // Only GMs can modify which ranks are imported
        if (session.user.roleLevel !== "gm") {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
        }

        const body = await request.json()
        const { rankId, isVisible, name, appRole } = body

        if (typeof rankId !== "number" || typeof isVisible !== "boolean" || (name !== undefined && typeof name !== "string") || (appRole !== undefined && typeof appRole !== "string")) {
            return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
        }

        const payload: any = { rank: rankId, is_visible: isVisible }
        if (name !== undefined) {
            payload.name = name
        }
        if (appRole !== undefined) {
            payload.app_role = appRole
        }

        const { error } = await sb
            .from("guild_ranks")
            .upsert(
                payload,
                { onConflict: "rank" }
            )

        if (error) {
            console.error("[RANK VISIBILITY UPSERT ERROR]", error)
            throw error
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error("[ROUTE RANK VISIBILITY PATCH]", e)
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 })
    }
}
