import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const { data: guild, error } = await sb
            .from('guilds_managed')
            .select('discord_streams_channel_id')
            .single()

        if (error) throw error
        return NextResponse.json(guild)
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
        const { discord_streams_channel_id } = await req.json()

        // 1. Fetch the actual guild_id
        const { data: guild, error: fetchError } = await sb
            .from('guilds_managed')
            .select('guild_id')
            .limit(1)
            .single()

        if (fetchError || !guild) {
            throw new Error("No se encontró la configuración de la hermandad")
        }

        // 2. Update that specific guild
        const { error: updateError } = await sb
            .from('guilds_managed')
            .update({ discord_streams_channel_id })
            .eq('guild_id', guild.guild_id)

        if (updateError) throw updateError

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
