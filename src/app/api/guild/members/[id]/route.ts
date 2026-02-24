import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("No autorizado", { status: 401 })
        }

        const roleLevel = session.user?.roleLevel
        if (roleLevel !== "gm" && roleLevel !== "officer") {
            return new NextResponse("Sin permisos", { status: 403 })
        }

        const p = await params
        const body = await request.json()

        // Allowed fields for update via this endpoint
        const { role, rank } = body

        const updateData: any = {}
        if (role !== undefined) updateData.role = role
        if (rank !== undefined) updateData.rank = rank

        const { data, error } = await sb
            .from("guild_members")
            .update(updateData)
            .eq("id", p.id)
            .select()
            .single()

        if (error) {
            console.error("Supabase update member error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })

    } catch (e: any) {
        console.error("API error:", e)
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse("No autorizado", { status: 401 })
        }

        const roleLevel = session.user?.roleLevel
        if (roleLevel !== "gm" && roleLevel !== "officer") {
            return new NextResponse("Sin permisos", { status: 403 })
        }

        const p = await params
        const { error } = await sb
            .from("guild_members")
            .delete()
            .eq("id", p.id)

        if (error) {
            console.error("Supabase delete member error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (e: any) {
        console.error("API error:", e)
        return NextResponse.json({ error: e.message || "Error interno del servidor" }, { status: 500 })
    }
}
