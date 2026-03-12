import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"
import { getGuildCredentials } from "@/shared/auth/credentials"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        // 1. Fetch the embed data
        const { data: embed, error: fetchError } = await supabaseAdmin
            .from('discord_embeds')
            .select('*')
            .eq('id', id)
            .single()

        if (fetchError || !embed) throw new Error("Embed not found")

        // 2. Get Discord credentials
        const creds = await getGuildCredentials()
        if (!creds.discord_bot_token) throw new Error("Discord bot token not configured")

        // 3. Prepare Discord payload
        const embedsArray = Array.isArray(embed.embeds) && embed.embeds.length > 0
            ? embed.embeds
            : [{
                title: embed.title,
                description: embed.description,
                color: embed.color,
                thumbnail_url: embed.thumbnail_url,
                image_url: embed.image_url,
                footer_text: embed.footer_text
            }];

        const discordEmbeds = embedsArray.map((e: any) => ({
            title: e.title || undefined,
            description: e.description || undefined,
            color: e.color || 0x5865F2,
            thumbnail: e.thumbnail_url ? { url: e.thumbnail_url } : undefined,
            image: e.image_url ? { url: e.image_url } : undefined,
            footer: e.footer_text ? { text: e.footer_text } : undefined,
            timestamp: new Date().toISOString()
        }));

        const payload = {
            content: embed.content || undefined,
            embeds: discordEmbeds
        }

        // 4. Send to Discord
        // If we have a last_message_id, we might want to EDIT instead of POST a new one?
        // User screenshot shows "Publicado" status, usually MEE6 allows editing or posting new.
        // Let's implement POST for now, and maybe PATCH if messageId exists.

        const method = embed.last_message_id ? "PATCH" : "POST"
        const url = embed.last_message_id
            ? `https://discord.com/api/v10/channels/${embed.channel_id}/messages/${embed.last_message_id}`
            : `https://discord.com/api/v10/channels/${embed.channel_id}/messages`

        const res = await fetch(url, {
            method,
            headers: {
                "Authorization": `Bot ${creds.discord_bot_token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })

        if (!res.ok) {
            const errBody = await res.text()
            console.error("Discord error:", errBody)
            throw new Error(`Discord API error: ${res.statusText}`)
        }

        const discordMsg = await res.json()

        // 5. Update DB with last_message_id and timestamp
        await supabaseAdmin
            .from('discord_embeds')
            .update({
                last_message_id: discordMsg.id,
                last_published_at: new Date().toISOString()
            })
            .eq('id', id)

        return NextResponse.json({ success: true, messageId: discordMsg.id })
    } catch (err: any) {
        console.error("Publish error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
