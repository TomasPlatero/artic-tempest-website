import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)

    // Solo permitimos que el GM borre usuarios manualmente por ahora
    if (!session || session.user.roleLevel !== 'gm') {
        return NextResponse.json({ error: "No autorizado. Solo el GM puede realizar esta acción." }, { status: 401 })
    }

    try {
        const { userId } = await req.json()
        if (!userId) throw new Error("userId es requerido")

        // No permitimos que el GM se borre a sí mismo desde aquí por seguridad
        if (userId === session.user.id) {
            return NextResponse.json({ error: "No puedes borrar tu propia cuenta desde este panel. Usa el panel de 'Mis Personajes' si deseas darte de baja." }, { status: 400 })
        }

        // El borrado en cascada en la base de datos se encarga de lo demás:
        // - recruitment_applications (REFERENCES public.profiles ON DELETE CASCADE)
        // - bnet_characters (REFERENCES public.profiles ON DELETE CASCADE)
        // - application_answers (REFERENCES recruitment_applications ON DELETE CASCADE)

        const { error } = await sb
            .from('profiles')
            .delete()
            .eq('user_id', userId)

        if (error) throw error

        return NextResponse.json({
            success: true,
            message: "Usuario y todos sus datos asociados han sido eliminados permanentemente."
        })
    } catch (error: any) {
        console.error("Admin user delete error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
