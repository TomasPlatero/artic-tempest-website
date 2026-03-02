import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function GET(req: Request) {
    try {
        const { data: guild } = await sb.from('guilds_managed').select('id').single()
        if (!guild) return NextResponse.json([])

        const { data: streamers, error } = await sb
            .from('guild_streamers')
            .select('*')
            .eq('guild_id', guild.id)
            .order('created_at', { ascending: true })

        if (error) throw error

        return NextResponse.json(streamers || [])
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const body = await req.json()

        const { data: guild } = await sb.from('guilds_managed').select('id').single()
        if (!guild) return NextResponse.json({ error: "No guild found" }, { status: 404 })

        const { data, error } = await sb
            .from('guild_streamers')
            .insert({
                guild_id: guild.id,
                twitch_username: body.twitch_username.toLowerCase(),
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const url = new URL(req.url)
        const id = url.searchParams.get('id')
        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })

        const { error } = await sb
            .from('guild_streamers')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
