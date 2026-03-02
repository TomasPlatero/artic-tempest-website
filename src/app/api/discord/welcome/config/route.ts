import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const { data: config, error } = await sb
            .from('discord_welcome_configs')
            .select('*')
            .limit(1)
            .single()

        // If not found, create default entry for the first guild
        if (error && error.code === 'PGRST116') {
            const { data: guild } = await sb.from('guilds_managed').select('guild_id').limit(1).single()
            if (guild) {
                const { data: newConfig, error: createError } = await sb
                    .from('discord_welcome_configs')
                    .insert([{ guild_id: guild.guild_id }])
                    .select()
                    .single()
                if (createError) throw createError
                return NextResponse.json(newConfig)
            }
        }

        if (error) throw error
        return NextResponse.json(config)
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
        const payload = await req.json()
        const { guild_id, created_at, updated_at, ...cleanPayload } = payload

        // Ensure we update the correct guild_id
        let targetGuildId = guild_id
        if (!targetGuildId) {
            const { data: g } = await sb.from('guilds_managed').select('guild_id').limit(1).single()
            if (g) targetGuildId = g.guild_id
        }

        const { data: config, error } = await sb
            .from('discord_welcome_configs')
            .upsert({
                ...cleanPayload,
                guild_id: targetGuildId,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(config)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
