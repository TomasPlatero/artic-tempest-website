import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { id, status, internal_notes, character_spec } = body

        if (!id) {
            return NextResponse.json({ error: "Falta ID de la solicitud" }, { status: 400 })
        }

        const updateData: any = { updated_at: new Date().toISOString() }
        if (status) updateData.status = status
        if (internal_notes !== undefined) updateData.internal_notes = internal_notes
        if (character_spec) updateData.character_spec = character_spec

        const { data, error } = await sb
            .from("recruitment_applications")
            .update(updateData)
            .eq("id", id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(data)
    } catch (error: any) {
        console.error("Recruitment API Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
