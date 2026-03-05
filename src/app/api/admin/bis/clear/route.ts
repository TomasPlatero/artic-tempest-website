import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export const dynamic = "force-dynamic"

/** Clear all BiS selections for all members */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { error } = await sb
            .from("bis_selections")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000") // Generic "delete all" workaround for some SB configs if filter is required

        if (error) {
            console.error("Error clearing BiS selections:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: "Todas las listas de deseos han sido eliminadas." })
    } catch (error: any) {
        console.error("Internal API Error clearing BiS:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}
