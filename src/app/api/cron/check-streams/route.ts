import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * CRON API Endpoint to check Twitch streams and notify in Discord
 * This endpoint should be called every 5-10 minutes.
 */
export const dynamic = "force-dynamic"

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const DISCORD_ANNOUNCE_CHANNEL_ID = process.env.DISCORD_STREAMERS_CHANNEL_ID || process.env.DISCORD_RECRUITMENT_CHANNEL_ID

export async function GET(req: Request) {
    // 1. Check for basic auth simple token to prevent public spamming if it's on a cron job
    // You can use process.env.CRON_SECRET if you're using Vercel Cron
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const sb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        )

        // 2. Fetch managed guild and streamers
        const { data: guild } = await sb.from('guilds_managed').select('guild_id, name, icon_url, discord_streams_channel_id').single()
        if (!guild) return NextResponse.json({ error: "No guild found" }, { status: 404 })

        const targetChannelId = guild.discord_streams_channel_id || DISCORD_ANNOUNCE_CHANNEL_ID
        if (!targetChannelId || !DISCORD_BOT_TOKEN) return NextResponse.json({ error: "Discord not configured" }, { status: 500 })

        const { data: streamers } = await sb
            .from('guild_streamers')
            .select('*')
            .eq('guild_id', guild.guild_id)

        if (!streamers || streamers.length === 0) return NextResponse.json({ status: "No streamers to check" })

        const results = []

        // 3. Process each streamer
        for (const streamer of streamers) {
            const username = streamer.twitch_username.toLowerCase()

            // Check current status via decapi
            let isLive = false
            let statusText = "offline"
            let title = ""
            let viewers = "0"
            let game = ""

            try {
                const uptimeRes = await fetch(`https://decapi.me/twitch/uptime/${username}`)
                const uptimeText = await uptimeRes.text()
                isLive = !uptimeText.toLowerCase().includes("offline") && !uptimeText.toLowerCase().includes("user not found")

                if (isLive) {
                    statusText = "online"
                    // Get extra data
                    const [titleRes, viewersRes, gameRes] = await Promise.all([
                        fetch(`https://decapi.me/twitch/title/${username}`),
                        fetch(`https://decapi.me/twitch/viewercount/${username}`),
                        fetch(`https://decapi.me/twitch/game/${username}`)
                    ])
                    title = await titleRes.text()
                    viewers = await viewersRes.text()
                    game = await gameRes.text()
                }
            } catch (e) {
                console.error(`Error checking twitch for ${username}:`, e)
                continue
            }

            // 4. Check previous notification state in DB
            const { data: prevNotify } = await sb
                .from('stream_notifications')
                .select('*')
                .eq('twitch_username', username)
                .single()

            const wasLive = prevNotify?.last_status === 'online'
            const messageId = prevNotify?.discord_message_id

            // Case A: Just went ONLINE -> Send new message
            if (isLive && !wasLive) {
                const newId = await sendDiscordNotification(targetChannelId, username, title, game, viewers, guild.icon_url, null)
                if (newId) {
                    await sb.from('stream_notifications').upsert({
                        twitch_username: username,
                        discord_message_id: newId,
                        last_status: 'online',
                        guild_id: guild.guild_id,
                        updated_at: new Object().toString() === '[object Object]' ? new Date().toISOString() : new Date().toISOString()
                    }, { onConflict: 'twitch_username' })
                }
                results.push(`${username} went live!`)
            }
            // Case B: Still ONLINE -> Update existing message (refresh viewers/title)
            else if (isLive && wasLive && messageId) {
                await sendDiscordNotification(targetChannelId, username, title, game, viewers, guild.icon_url, messageId)
                results.push(`${username} updated (live)`)
            }
            // Case C: Just went OFFLINE -> Delete or edit message to show offline
            else if (!isLive && wasLive && messageId) {
                // We update with offline status instead of deleting to keep the history if preferred, or delete it
                // user said "si no están pon la foto de offline", but for Discord message maybe better to just update it or delete it.
                // Let's update it to say OFFLINE.
                await sendDiscordNotification(targetChannelId, username, "Stream Finalizado", "-", "0", guild.icon_url, messageId, true)
                await sb.from('stream_notifications').update({
                    last_status: 'offline',
                    updated_at: new Date().toISOString()
                }).eq('twitch_username', username)
                results.push(`${username} went offline`)
            }
        }

        return NextResponse.json({ status: "processed", results })

    } catch (err: any) {
        console.error("Cron check-streams error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

async function sendDiscordNotification(
    channelId: string,
    username: string,
    title: string,
    game: string,
    viewers: string,
    guildIcon: string | null,
    messageId: string | null = null,
    isOffline: boolean = false
) {
    if (!DISCORD_BOT_TOKEN || !channelId) return null

    const embedColor = isOffline ? 0x2b2d31 : 0x9146ff // Grey or Twitch Purple
    const url = `https://twitch.tv/${username}`

    const embed = {
        title: title || `${username} is live!`,
        url: url,
        color: embedColor,
        author: {
            name: username,
            icon_url: "https://static-cdn.jtvnw.net/jtv_user_pictures/twitch-profile-image.png"
        },
        fields: [
            { name: "Juego", value: game || "Unknown", inline: true },
            { name: "Espectadores", value: viewers || "0", inline: true },
        ],
        image: {
            url: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${username}-1280x720.jpg?t=${Date.now()}`
        },
        footer: {
            text: `Twitch • ${new Date().toLocaleString()}`,
            icon_url: guildIcon || undefined
        }
    }

    const payload = {
        content: isOffline ? `${username} ha terminado su directo.` : `¡Hey @everyone, **${username}** está en directo en ${url}!`,
        embeds: [embed]
    }

    const method = messageId ? "PATCH" : "POST"
    const endpoint = messageId
        ? `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`
        : `https://discord.com/api/v10/channels/${channelId}/messages`

    try {
        const res = await fetch(endpoint, {
            method,
            headers: {
                "Authorization": `Bot ${DISCORD_BOT_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })

        if (!res.ok) {
            console.error(`Discord API error (${method}):`, await res.text())
            return null
        }

        const data = await res.json()
        return data.id
    } catch (e) {
        console.error("Discord fetch fatal error:", e)
        return null
    }
}
