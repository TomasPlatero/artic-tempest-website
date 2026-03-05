import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const { data: embeds, error } = await supabaseAdmin.from('discord_embeds')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return NextResponse.json(embeds)
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
        const payload = await req.json()

        // Fetch guild_id if not provided
        if (!payload.guild_id) {
            const { data: g } = await supabaseAdmin.from('guilds_managed').select('guild_id').limit(1).single()
            if (g) payload.guild_id = g.guild_id
            else throw new Error("No guild found")
        }

        const { data: embed, error } = await supabaseAdmin.from('discord_embeds')
            .insert([payload])
            .select()
            .single()

        if (error) throw error
        return NextResponse.json(embed)
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
