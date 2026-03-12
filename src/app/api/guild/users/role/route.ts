import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"
import { ensureAppPermission } from "@/shared/auth/permissions"

export async function PATCH(request: Request) {
    try {
        const session = await ensureAppPermission('roster', 'edit')
        const roleLevel = session.user.roleLevel

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

        // Prevent removing the last GM (safety check)
        if (newRoleLevel !== "gm") {
            const { count, error: countError } = await supabaseAdmin.from("profiles")
                .select("user_id", { count: "exact", head: true })
                .eq("role_level", "gm")

            if (countError) {
                console.error("Error checking GM count:", countError)
                return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
            }

            // If this user is a GM and they are the ONLY GM left, block the demotion
            const { data: targetUser } = await supabaseAdmin.from("profiles").select("role_level").eq("user_id", targetUserId).single()

            if (targetUser?.role_level === "gm" && count === 1) {
                return NextResponse.json({ error: "No puedes degradar al último Guild Master del sistema." }, { status: 400 })
            }
        }

        // Update the profile
        const { error: updateError } = await supabaseAdmin.from("profiles")
            .update({ role_level: newRoleLevel })
            .eq("user_id", targetUserId)

        if (updateError) {
            console.error("Error updating sub role:", updateError)
            return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        return NextResponse.json({ success: true, targetUserId, newRoleLevel })
    } catch (err: any) {
        console.error("PATCH /api/guild/users/role error:", err)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}
