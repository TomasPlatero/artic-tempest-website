import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function GET(req: Request) {
    try {
        const { data: guild } = await sb.from('guilds_managed').select('guild_id').single()
        if (!guild) return NextResponse.json([])

        const { data: streamers, error } = await sb
            .from('guild_streamers')
            .select('*')
            .eq('guild_id', guild.guild_id)
            .order('created_at', { ascending: true })

        if (error) throw error

        if (!streamers || streamers.length === 0) return NextResponse.json([])

        // Check if live using public decapi to prevent needing active twitch app auth keys
        const enrichedStreamers = await Promise.all(streamers.map(async (st) => {
            try {
                const uptimeRes = await fetch(`https://decapi.me/twitch/uptime/${st.twitch_username}`, { next: { revalidate: 60 } })
                const text = await uptimeRes.text()
                // returns "[name] is offline" if they are not live
                const isLive = !text.toLowerCase().includes("offline") && !text.includes("User not found")
                return { ...st, is_live: isLive }
            } catch (e) {
                return { ...st, is_live: false }
            }
        }))

        // Sort live online first
        enrichedStreamers.sort((a, b) => (a.is_live === b.is_live ? 0 : a.is_live ? -1 : 1))

        return NextResponse.json(enrichedStreamers)
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

        const { data: guild } = await sb.from('guilds_managed').select('guild_id').single()
        if (!guild) return NextResponse.json({ error: "No guild found" }, { status: 404 })

        const { data, error } = await sb
            .from('guild_streamers')
            .insert({
                guild_id: guild.guild_id,
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
