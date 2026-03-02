import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const { data: embed, error } = await sb
            .from('discord_embeds')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return NextResponse.json(embed)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const payload = await req.json()
        const { id, created_at, updated_at, ...cleanPayload } = payload

        const { data: embed, error } = await sb
            .from('discord_embeds')
            .update({ ...cleanPayload, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(embed)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const { error } = await sb
            .from('discord_embeds')
            .delete()
            .eq('id', id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
