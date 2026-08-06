import { NextResponse } from "next/server"
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from "@/shared/auth/permissions"
import { getAuthzSnapshot } from "@/shared/auth/authz"

export async function PATCH(request: Request) {
    try {
        const session = await ensureAppPermission('roster', 'edit')
        const authz = await getAuthzSnapshot(session)
        const roleLevel = authz.roleSlug ?? session.user?.roleLevel ?? "invitado"

        const body = await request.json()
        const { targetUserId, newRoleLevel } = body

        if (!targetUserId || !newRoleLevel) {
            return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 })
        }

        const validRoles = ["gm", "officer", "raider", "member"]
        if (!validRoles.includes(newRoleLevel)) {
            return NextResponse.json({ error: "Nivel de rol inválido" }, { status: 400 })
        }

        // Officers cannot promote anyone to GM
        if (roleLevel === "officer" && newRoleLevel === "gm") {
            return NextResponse.json({ error: "Solo el Guild Master puede nombrar a otro Guild Master." }, { status: 403 })
        }

        // Atomic role update via RPC — eliminates TOCTOU race condition
        // where two concurrent demotions could both pass the last-GM check
        const { data: result, error: rpcError } = await supabaseAdmin
            .rpc("update_user_role", {
                p_target_user_id: targetUserId,
                p_new_role: newRoleLevel,
            })

        if (rpcError) {
            console.error("Error updating role:", rpcError)
            return NextResponse.json({ error: rpcError.message }, { status: 400 })
        }

        const parsed = result as { success: boolean; error?: string; target_user_id?: string; new_role?: string }

        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error || "Error al actualizar el rol" },
                { status: 400 },
            )
        }

        return NextResponse.json({
            success: true,
            targetUserId: parsed.target_user_id ?? targetUserId,
            newRoleLevel: parsed.new_role ?? newRoleLevel,
        })
    } catch (err: any) {
        console.error("PATCH /api/guild/users/role error:", err)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}
