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
        const { rankId, isVisible, name, appRole, color } = body

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
        if (color !== undefined) {
            payload.color = color
        }

        let { error } = await sb
            .from("guild_ranks")
            .upsert(
                payload,
                { onConflict: "rank" }
            )

        // If the 'color' column is missing, retry without it to at least save name/visibility
        const isColumnError = error && (
            error.code === 'PGRST204' ||
            error.message.toLowerCase().includes("column 'color'") ||
            error.message.toLowerCase().includes("'color' column") ||
            error.message.toLowerCase().includes("schema cache")
        );

        if (isColumnError) {
            console.warn("[RANK API] 'color' column missing, retrying without it...");
            const fallbackPayload = { ...payload };
            delete fallbackPayload.color;

            const { error: retryError } = await sb
                .from("guild_ranks")
                .upsert(fallbackPayload, { onConflict: "rank" });

            if (!retryError) {
                return NextResponse.json({
                    success: true,
                    warning: "La columna 'color' no existe en la base de datos. Los otros cambios se guardaron."
                });
            }
            error = retryError;
        }

        if (error) {
            console.error("[RANK UPSERT ERROR]", {
                payload,
                error
            })
            return NextResponse.json({
                error: "Error al actualizar el rango en la base de datos.",
                details: error.message,
                code: error.code
            }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        console.error("[ROUTE RANK VISIBILITY PATCH]", e)
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 })
    }
}
