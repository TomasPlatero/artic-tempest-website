import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { getGuildCredentials } from "@/infrastructure/auth/credentials"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { applicationId, content } = await req.json()
    if (!applicationId || !content) {
        return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    try {
        // 1. Get application details + staff channel config
        const { data: application, error: appError } = await sb
            .from("recruitment_applications")
            .select("*, profiles(discord_user_id, discord_username)")
            .eq("id", applicationId)
            .single()

        if (appError || !application) {
            return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
        }

        // 2. Check permissions
        const isOfficial = ["gm", "officer"].includes(session.user.roleLevel)
        const isApplicant = session.user.id === application.user_id

        if (!isOfficial && !isApplicant) {
            return NextResponse.json({ error: "Prohibido" }, { status: 403 })
        }

        // 3. Save to database
        const { data: savedMsg, error: saveError } = await sb
            .from("application_messages")
            .insert({
                application_id: applicationId,
                author_id: session.user.id,
                content: content
            })
            .select()
            .single()

        if (saveError) throw saveError

        // 4. Relay to Discord (MODMAIL SYSTEM)
        const creds = await getGuildCredentials()
        const botToken = creds.discord_bot_token
        const staffChannelId = process.env.DISCORD_RECRUITMENT_CHANNEL_ID // Using existing recruitment channel

        if (botToken && staffChannelId) {
            // A. If Official speaks -> DM the applicant
            if (isOfficial) {
                const discordUserId = (application as any).profiles?.discord_user_id
                if (discordUserId) {
                    await sendDiscordDM(botToken, discordUserId, `**[Oficial ${session.user.username}]:** ${content}`, application.id)
                }
            }

            // B. If Applicant speaks -> Mirror to Staff
            // We should mirror BOTH ways to keep staff channel in sync
            const staffMsg = `**[${session.user.username || 'Sistema'}]:** ${content}`
            await mirrorToStaffChannel(botToken, staffChannelId, staffMsg, application)
        }

        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error("Relay Chat Error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

async function sendDiscordDM(botToken: string, userId: string, message: string, applicationId: string) {
    try {
        // 1. Create DM channel
        const dmRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
            method: "POST",
            headers: {
                "Authorization": `Bot ${botToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ recipient_id: userId })
        })
        const dmChannel = await dmRes.json()
        if (!dmChannel.id) throw new Error("Could not create DM channel")

        // 2. Send message with "View on Web" button
        await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bot ${botToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: message,
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 5,
                                label: "Responder en la Web",
                                url: `${process.env.NEXTAUTH_URL}/reclutamiento/apply-en-curso/chat`
                            }
                        ]
                    }
                ]
            })
        })
    } catch (e) {
        console.error("Error sending Discord DM:", e)
    }
}

async function mirrorToStaffChannel(botToken: string, channelId: string, message: string, application: any) {
    // We try to use a Thread for each application to keep it clean
    try {
        let threadId = application.discord_chat_thread_id

        // If no thread exists, create one in the staff channel
        if (!threadId) {
            // Find the original recruitment announcement message if it exists
            const { discord_message_id } = application

            if (discord_message_id) {
                // Create thread from message
                const threadRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${discord_message_id}/threads`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bot ${botToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: `Chat con ${application.character_name}`,
                        auto_archive_duration: 1440 // 24h
                    })
                })
                const threadData = await threadRes.json()
                threadId = threadData.id

                // Update application with thread ID
                if (threadId) {
                    await sb
                        .from("recruitment_applications")
                        .update({ discord_chat_thread_id: threadId })
                        .eq("id", application.id)
                }
            } else {
                // Create standalone thread (public/private depending on channel)
                // Fallback to channel if message thread fails
                threadId = channelId
            }
        }

        if (threadId) {
            await fetch(`https://discord.com/api/v10/channels/${threadId}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bot ${botToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ content: message })
            })
        }
    } catch (e) {
        console.error("Error mirroring to staff channel:", e)
    }
}
