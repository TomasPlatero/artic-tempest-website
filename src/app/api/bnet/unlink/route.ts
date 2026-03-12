import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const profileId = session.user.id

        // The user's Battle.net characters will automatically be deleted by the Database Foreign Key CASCADE 
        // rule on bnet_characters when the user_id matches, but since we are just emptying columns in profiles,
        // we have to delete the characters manually.

        await supabaseAdmin.from("bnet_characters").delete().eq("user_id", profileId)

        // Clear battlenet fields from user profile
        const { error: profileError } = await supabaseAdmin.from("profiles")
            .update({
                battlenet_id: null,
                battlenet_battletag: null,
            })
            .eq("user_id", profileId)

        if (profileError) {
            throw profileError
        }

        return NextResponse.json({ success: true, message: "Cuenta de Battle.net desvinculada." })
    } catch (e: any) {
        console.error("[BNET UNLINK ERROR]", e)
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 })
    }
}
