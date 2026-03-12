import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"
import { getGuildCredentials } from "@/shared/auth/credentials"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const applicationId = searchParams.get("applicationId")

    if (!applicationId) {
        return NextResponse.json({ error: "Falta id de solicitud" }, { status: 400 })
    }

    try {
        const { data: application, error: appError } = await supabaseAdmin.from("recruitment_applications")
            .select("user_id")
            .eq("id", applicationId)
            .single()

        if (appError || !application) {
            return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
        }

        const isOfficial = ["gm", "officer"].includes(session.user.roleLevel)
        const isApplicant = session.user.id === application.user_id

        if (!isOfficial && !isApplicant) {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
        }

        const { data: messages, error: msgError } = await supabaseAdmin.from("application_messages")
            .select("*, author:profiles(discord_username, discord_avatar, role_level)")
            .eq("application_id", applicationId)
            .order("created_at", { ascending: true })

        if (msgError) throw msgError

        return NextResponse.json(messages || [])
    } catch (error: any) {
        console.error("GET Chat Error:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { applicationId, content } = await req.json()
    if (!applicationId || !content) {
        return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    try {
        // 1. Get application details
        const { data: application, error: appError } = await supabaseAdmin.from("recruitment_applications")
            .select("*")
            .eq("id", applicationId)
            .single()

        if (appError || !application) {
            return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
        }

        // Fetch applicant profile separately to avoid relation naming issues
        const { data: applicantProfile } = await supabaseAdmin.from("profiles")
            .select("discord_user_id, discord_username")
            .eq("user_id", application.user_id)
            .single()

        // Attach profile data
        application.profiles = applicantProfile


        // 2. Check permissions
        const isOfficial = ["gm", "officer"].includes(session.user.roleLevel)
        const isApplicant = session.user.id === application.user_id

        if (!isOfficial && !isApplicant) {
            return NextResponse.json({ error: "Prohibido" }, { status: 403 })
        }

        // 3. Save to database
        const { data: savedMsg, error: saveError } = await supabaseAdmin.from("application_messages")
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

            // B. If Applicant speaks -> Mirror to all Officials via DM
            if (isApplicant) {
                const staffMsg = `**Mensaje de la solicitud [${session.user.username}]:** ${content}`
                await mirrorToAllOfficials(botToken, staffMsg, session.user.username || 'Desconocido', application.id)
            }
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

async function mirrorToAllOfficials(botToken: string, message: string, applicantName: string, applicationId: string) {
    try {
        // 1. Get all GMs and Officers
        const { data: officers } = await supabaseAdmin.from("profiles")
            .select("discord_user_id")
            .in("role_level", ["gm", "officer"])
            .not("discord_user_id", "is", null)

        if (!officers || officers.length === 0) return

        // 2. DM each officer
        await Promise.all(officers.map(async (officer) => {
            if (!officer.discord_user_id) return
            try {
                // Create DM channel
                const dmRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bot ${botToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ recipient_id: officer.discord_user_id })
                })
                const dmChannel = await dmRes.json()
                if (!dmChannel.id) return

                // Send message
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
                                        label: `Ver solicitud de ${applicantName}`,
                                        url: `${process.env.NEXTAUTH_URL}/dashboard/configuracion/reclutamiento/${applicationId}/chat`
                                    }
                                ]
                            }
                        ]
                    })
                })
            } catch (err) {
                console.error(`Failed to DM officer ${officer.discord_user_id}`, err)
            }
        }))
    } catch (e) {
        console.error("Error mirroring to officials:", e)
    }
}

