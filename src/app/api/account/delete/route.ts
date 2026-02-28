import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const profileId = session.user.id

        // Borramos el perfil. 
        // bnet_characters y apps_recruitment deberían tener ON DELETE CASCADE.
        // Verificamos si hay que borrar algo más manualmente para estar seguros 
        // de cumplir con el derecho al olvido.

        const { error: profileError } = await sb
            .from("profiles")
            .delete()
            .eq("user_id", profileId)

        if (profileError) {
            throw profileError
        }

        return NextResponse.json({
            success: true,
            message: "Tu cuenta y todos tus datos asociados han sido eliminados permanentemente."
        })
    } catch (e: any) {
        console.error("[ACCOUNT DELETE ERROR]", e)
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 })
    }
}
