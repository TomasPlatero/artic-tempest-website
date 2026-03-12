import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"
import { ensureAppPermission } from "@/shared/auth/permissions"

export async function DELETE() {
    try {
        const session = await ensureAppPermission('roster', 'edit')

        // Wipe all characters from the guild_members table
        const { error } = await supabaseAdmin.from("guild_members")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000") // A dummy condition to satisfy PostgREST requiring a condition for DELETE

        if (error) {
            console.error("[ROSTER WIPE] DB Error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: "Roster borrado con éxito" })
    } catch (e: any) {
        console.error("[ROSTER WIPE] Fatal Error:", e)
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 })
    }
}
