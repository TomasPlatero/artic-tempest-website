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
            .order('sort_order', { ascending: true })
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

                let avatarUrl = null
                try {
                    const avatarRes = await fetch(`https://decapi.me/twitch/avatar/${st.twitch_username}`, { next: { revalidate: 3600 } })
                    const avatarText = await avatarRes.text()
                    if (avatarText.startsWith("http")) avatarUrl = avatarText
                } catch (err) { }

                return { ...st, is_live: isLive, avatar_url: avatarUrl }
            } catch (e) {
                return { ...st, is_live: false, avatar_url: null }
            }
        }))

        // Sort live online first, then by manual sort_order
        enrichedStreamers.sort((a, b) => {
            if (a.is_live !== b.is_live) return a.is_live ? -1 : 1
            return (a.sort_order || 0) - (b.sort_order || 0)
        })

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

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { items } = body

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 })
        }

        // Supabase does not support bulk updates natively with an array of objects
        // So we do updates concurrently
        const updates = items.map(async (item: { id: string; sort_order: number }) => {
            return sb
                .from('guild_streamers')
                .update({ sort_order: item.sort_order })
                .eq('id', item.id)
        })

        await Promise.all(updates)

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
