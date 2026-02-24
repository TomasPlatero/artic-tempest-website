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

        let { error } = await sb
            .from("guild_ranks")
            .upsert(
                payload,
                { onConflict: "rank" }
            )

        // Fallback if table doesn't exist or cache is stale
        if (error && (error.code === 'PGRST204' || error.message.includes("schema cache"))) {
            console.log("[RANK API] Falling back to guild_rank_visibility...");
            const fallbackPayload = {
                rank_id: rankId,
                is_visible: isVisible,
                name: payload.name
            };
            const { error: fallbackError } = await sb
                .from("guild_rank_visibility")
                .upsert(fallbackPayload, { onConflict: "rank_id" });

            error = fallbackError;
        }

        if (error) {
            console.error("[RANK VISIBILITY UPSERT ERROR]", {
                payload,
                error
            })
            return NextResponse.json({
                error: "Error al actualizar la base de datos",
                details: error.message
            }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error("[ROUTE RANK VISIBILITY PATCH]", e)
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 })
    }
}
