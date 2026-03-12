import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"
import { fetchCharacterRIO } from "@/shared/integrations/raiderio/raiderio-client"
import { fetchCharacterItemLevel } from "@/shared/integrations/bnet/bnet-client"

export async function POST(req: Request) {
    // 1. Verificar sesión para que solo un usuario logueado pueda enviar notificaciones
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { application_id } = body

        if (!application_id) {
            return NextResponse.json({ error: "Falta ID de la solicitud" }, { status: 400 })
        }

        // 2. Obtener los detalles de la aplicación desde Supabase usando Service Role
        const { data: application, error: appError } = await supabaseAdmin.from("recruitment_applications")
            .select("*")
            .eq("id", application_id)
            .single()

        if (appError || !application) {
            console.error("Supabase Select Error:", appError)
            throw new Error("No se pudo obtener la solicitud de la base de datos")
        }

        // Obtener el perfil del usuario de forma segura
        const { data: profile } = await supabaseAdmin.from("profiles")
            .select("discord_username, discord_avatar, discord_user_id")
            .eq("user_id", application.user_id)
            .single()

        application.profiles = profile || {}

        // Obtener logo de la guild
        const { data: guild } = await supabaseAdmin.from("guilds_managed")
            .select("icon_url")
            .limit(1)
            .single()

        const guildIconUrl = guild?.icon_url || `${process.env.NEXTAUTH_URL}/favicon.ico`

        // Obtener nivel real del personaje de la BD
        const { data: charData } = await supabaseAdmin.from("bnet_characters")
            .select("level")
            .eq("user_id", application.user_id)
            .eq("name", application.character_name)
            .eq("realm", application.character_realm)
            .single()

        const characterLevel = charData?.level || 80

        // Obtener la configuración del servidor de la tabla de constantes o enviarlo por entorno
        const channelId = process.env.DISCORD_RECRUITMENT_CHANNEL_ID
        const botToken = process.env.DISCORD_BOT_TOKEN

        if (!channelId || !botToken) {
            console.error("Falta DISCORD_RECRUITMENT_CHANNEL_ID o DISCORD_BOT_TOKEN en .env.local")
            return NextResponse.json({ success: true, warning: "Bot no configurado, notificación ignorada." })
        }

        // Map de clases para el diseño (Colores y nombres)
        const classInfo: Record<number, { name: string, color: number }> = {
            1: { name: "Warrior", color: 0xC69B6D },
            2: { name: "Paladin", color: 0xF48CBA },
            3: { name: "Hunter", color: 0xABD473 },
            4: { name: "Rogue", color: 0xFFF468 },
            5: { name: "Priest", color: 0xFFFFFF },
            6: { name: "Death Knight", color: 0xC41E3A },
            7: { name: "Shaman", color: 0x0070DE },
            8: { name: "Mage", color: 0x3FC7EB },
            9: { name: "Warlock", color: 0x8788EE },
            10: { name: "Monk", color: 0x00FF98 },
            11: { name: "Druid", color: 0xFF7C0A },
            12: { name: "Demon Hunter", color: 0xA330C9 },
            13: { name: "Evoker", color: 0x33937F }
        }

        const charClassId = Number(application.character_class)
        const charClass = classInfo[charClassId] || { name: "Unknown", color: 0x2B2D31 }


        // Enlaces Externos
        const realmSlug = application.character_realm.toLowerCase().replace(/\s+/g, '-')
        const nameSlug = application.character_name.toLowerCase()
        const armoryUrl = `https://worldofwarcraft.blizzard.com/es-es/character/eu/${realmSlug}/${nameSlug}`
        const rioUrl = `https://raider.io/characters/eu/${realmSlug}/${nameSlug}`
        const logsUrl = `https://www.warcraftlogs.com/character/eu/${realmSlug}/${nameSlug}`
        const wipefestUrl = `https://www.wipefest.gg/character/${nameSlug}/${realmSlug}/EU?gameVersion=warcraft-live`
        const linksText = `[Rio](${rioUrl}) • [WCL](${logsUrl}) • [Armory](${armoryUrl}) • [WFest](${wipefestUrl})`

        // Obtener Raider.IO Data
        const rioData = await fetchCharacterRIO(application.character_name, application.character_realm)

        let mplusScore = 0
        if (rioData?.mythic_plus_scores_by_season) {
            const seasons = rioData.mythic_plus_scores_by_season
            const activeSeason = seasons.find((s: any) => s.scores?.all > 0) || seasons[0]
            mplusScore = activeSeason?.scores?.all || 0
        }

        let raidProgress = "N/A"
        if (rioData?.raid_progression) {
            const getRaidName = (slug: string) => {
                const known: Record<string, string> = {
                    'manaforge-omega': 'Midnight S1',
                    'liberation-of-undermine': 'TWW S2',
                    'nerubar-palace': 'TWW S1'
                }
                return known[slug] || slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            }

            const raids = Object.entries(rioData.raid_progression) as [string, any][]
            let activeRaid = raids.find(([_, r]) => r.mythic_bosses_killed > 0 || r.heroic_bosses_killed > 0 || r.normal_bosses_killed > 0)

            if (!activeRaid && raids.length > 0) {
                activeRaid = raids[0] // Fallback a la más reciente
            }

            if (activeRaid) {
                const [slug, data] = activeRaid
                const tierName = getRaidName(slug)
                if (data.summary) {
                    raidProgress = `${data.summary} (${tierName})`
                } else {
                    raidProgress = `0/${data.total_bosses} N (${tierName})`
                }
            }
        }

        // Obtener el Item Level real directamente desde Battle.net
        const realmSlugForBnet = application.character_realm.toLowerCase().trim().replace(/\s+/g, '-')
        const nameSlugForBnet = application.character_name.toLowerCase().trim()
        const bnetItemLevel = await fetchCharacterItemLevel(realmSlugForBnet, nameSlugForBnet, "eu")

        const eqIvl = bnetItemLevel?.equipped || rioData?.gear?.item_level_equipped
        const maxIvl = bnetItemLevel?.average || rioData?.gear?.item_level_total
        const iLvl = eqIvl ? (maxIvl > 0 ? `${eqIvl} / ${maxIvl}` : `${eqIvl}`) : 'N/A'

        // 3. Crear el JSON del Embed de Discord
        const discordPayload = {
            embeds: [
                {
                    description: `<@${application.profiles?.discord_user_id || 'unknown'}> ha solicitado unirse a Artic Tempest.`,
                    color: charClass.color,
                    timestamp: application.created_at,
                    thumbnail: {
                        url: rioData?.thumbnail_url || `https://render.worldofwarcraft.com/eu/icons/56/classicon_${charClass.name.toLowerCase().replace(' ', '')}.jpg`
                    },
                    author: {
                        name: `${application.character_name} - ${application.character_realm} (EU) ${charClass.name}`,
                        url: `${process.env.NEXTAUTH_URL}/dashboard/configuracion/reclutamiento/${application.id}`,
                        icon_url: application.profiles?.discord_avatar || null
                    },
                    fields: [
                        { name: "Nivel", value: characterLevel.toString(), inline: true },
                        { name: "Nivel de Objeto", value: iLvl, inline: true },
                        { name: "Progreso Raid", value: raidProgress, inline: false },
                        { name: "Mythic+ Rating", value: `${mplusScore.toFixed(0)} 🛡️`, inline: false },
                        { name: "Estado Apply", value: "🔵 Nuevo", inline: true },
                        { name: "Spect y Rol", value: application.character_spec, inline: true },
                        { name: "Enlaces", value: linksText, inline: false }
                    ],
                    footer: {
                        text: "Reclutamiento Artic Tempest",
                        icon_url: guildIconUrl
                    }
                }
            ],
            components: [
                {
                    type: 1, // Action Row
                    components: [
                        {
                            type: 2, // Button
                            style: 5, // Link
                            label: "Ver Aplicación/Responder",
                            url: `${process.env.NEXTAUTH_URL}/dashboard/configuracion/reclutamiento/${application.id}`
                        }
                    ]
                }
            ]
        }

        // 4. Enviar a la API REST de Discord
        const discordRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${botToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(discordPayload)
        })

        if (!discordRes.ok) {
            const errorText = await discordRes.text()
            console.error("\n❌ [DISCORD EMBED FAIL] Código:", discordRes.status)
            console.error("❌ Texto de discord:", errorText)
            console.error("❌ Intentando mandar al canal:", channelId)
            throw new Error("No se pudo enviar el mensaje a Discord")
        }

        const discordMessage = await discordRes.json()

        // 5. Guardar el discord_message_id en la base de datos (Si la columna ha sido creada)
        if (discordMessage.id) {
            const { error: updateError } = await supabaseAdmin.from("recruitment_applications")
                .update({ discord_message_id: discordMessage.id })
                .eq("id", application_id)

            if (updateError) {
                console.error("No se pudo guardar discord_message_id. Asegúrate de añadir la columna a Supabase:", updateError.message)
            }
        }

        return NextResponse.json({ success: true, message_id: discordMessage.id })

    } catch (error: any) {
        console.error("API Recruitment Discord Notify Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
