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

        // Notificar a Discord asíncronamente para actualizar el Embed
        if (data && data.discord_message_id) {
            try {
                // Hacemos el fetch sin await para no bloquear la respuesta rápida al cliente
                fetch(`${process.env.NEXTAUTH_URL}/api/discord/update-apply`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Cookie": req.headers.get("cookie") || "" // Pasamos las cookies para la auth
                    },
                    body: JSON.stringify({ application_id: data.id })
                }).catch(e => console.error("Error trigger Discord update:", e))
            } catch (e) {
                console.error("Fetch Discord Update Error", e)
            }
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error("Recruitment API Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "Falta ID de la solicitud" }, { status: 400 })
        }

        const { error } = await sb
            .from("recruitment_applications")
            .delete()
            .eq("id", id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Recruitment API Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
