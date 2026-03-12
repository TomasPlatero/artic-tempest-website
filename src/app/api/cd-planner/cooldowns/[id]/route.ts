import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"

export const dynamic = "force-dynamic"

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse("No autorizado", { status: 401 })

        const { id } = await params

        const { error } = await supabaseAdmin
            .from("cooldown_definitions")
            .delete()
            .eq("id", id)

        if (error) throw error

        return NextResponse.json({ ok: true })
    } catch (e: any) {
        console.error("DELETE cooldown error:", e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
