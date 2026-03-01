import { NextResponse } from "next/server";
import { InteractionType, InteractionResponseType } from "discord-interactions";
import nacl from "tweetnacl"; // Usaremos tweetnacl directamente que es a prueba de balas

/**
 * Endpoint para las interacciones HTTP de Discord
 * URL en Discord Dev Portal: https://tu-dominio.com/api/discord/interactions
 */
export async function POST(req: Request) {
    // 1. Verificación de seguridad requerida por Discord
    const signature = req.headers.get("X-Signature-Ed25519");
    const timestamp = req.headers.get("X-Signature-Timestamp");

    const { getGuildCredentials } = await import("@/infrastructure/auth/credentials");
    const creds = await getGuildCredentials();
    const publicKey = creds.discord_public_key || process.env.DISCORD_PUBLIC_KEY;

    if (!signature || !timestamp || !publicKey) {
        return NextResponse.json({ error: "Missing signatures or public key" }, { status: 401 });
    }

    const arrayBuffer = await req.arrayBuffer();
    const bodyBuffer = Buffer.from(arrayBuffer);
    const timestampData = Buffer.from(timestamp || '');

    // Concatenamos puros bytes para evitar el parser de Node/NextJS
    const message = Buffer.concat([timestampData, bodyBuffer]);

    // Verificación manual paso a paso con tweetnacl (Súper robusto)
    let isValidRequest = false;
    try {
        const isVerified = nacl.sign.detached.verify(
            message,
            Buffer.from(signature || '', 'hex'),
            Buffer.from(publicKey || '', 'hex')
        );
        isValidRequest = isVerified;
    } catch (e) {
        // Ignorar errores de parseo o firmas muy mal formadas
    }

    if (!isValidRequest) {
        return new Response("Bad request signature", { status: 401 });
    }

    // 2. Parsear el cuerpo de la petición ya validada
    const interaction = JSON.parse(bodyBuffer.toString('utf-8'));

    // 3. Manejar PING (Discord envía esto al configurar la URL)
    if (interaction.type === InteractionType.PING) {
        return NextResponse.json({ type: InteractionResponseType.PONG });
    }

    // 4. Manejar Comandos de Aplicación (Slash Commands)
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        const { name } = interaction.data;

        // Verificar si el comando está habilitado en DB
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

        const { data: cmdDb } = await sb
            .from("discord_commands")
            .select("is_enabled")
            .eq("name", name)
            .single();

        if (cmdDb && !cmdDb.is_enabled) {
            return NextResponse.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: "Este comando ha sido desactivado por el administrador.",
                    flags: 64, // Ephemeral
                },
            });
        }

        if (name === "ping") {
            return NextResponse.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: "¡Pong! 🏓 El asistente Guildboard está funcionando correctamente.",
                },
            });
        }

        if (name === "reclutamiento") {
            // Fetch open spots
            const { data: spots } = await sb
                .from("recruitment_spots")
                .select("class_id, spec_name, urgency")
                .neq("urgency", "closed")
                .order("class_id");

            const { data: constants } = await sb
                .from("game_constants")
                .select("key, value, metadata")
                .eq("category", "wow_class");

            const classMap = constants?.reduce((acc: any, curr: any) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});

            let content = "**🔍 RECLUTAMIENTO ACTUAL - ARTIC TEMPEST**\n\n";

            if (!spots || spots.length === 0) {
                content += "Actualmente el reclutamiento está cerrado para todas las especializaciones. Sin embargo, siempre buscamos jugadores excepcionales.";
            } else {
                content += "Estamos buscando las siguientes clases y especializaciones:\n";

                // Group by class
                const grouped: Record<string, string[]> = {};
                spots.forEach(s => {
                    const className = classMap?.[s.class_id] || "Clase Desconocida";
                    if (!grouped[className]) grouped[className] = [];
                    const emoji = s.urgency === 'high' ? '🔴' : (s.urgency === 'medium' ? '🟡' : '🔵');
                    grouped[className].push(`**${s.spec_name}** ${emoji}`);
                });

                for (const [className, specs] of Object.entries(grouped)) {
                    content += `• **${className}**: ${specs.join(", ")}\n`;
                }
            }

            content += "\n\n✨ **¿Quieres unirte?**\nAplícanos directamente en nuestra web:\nhttps://artictempest.es/apply";

            return NextResponse.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content },
            });
        }

        if (name === "progreso") {
            const { fetchGuildProgression } = await import("@/infrastructure/auth/credentials").then(async () => {
                // In interactions route, we might need a more direct way since it's an API route
                return await import("@/infrastructure/raiderio/raiderio-client");
            });

            const profile = await fetchGuildProgression("dun-modr", "Artic Tempest", "eu");

            let content = "**🏆 PROGRESO DE HERMANDAD - ARTIC TEMPEST**\n\n";

            if (!profile || !profile.raid_progression) {
                content += "No se han podido recuperar los datos de progreso en este momento.";
            } else {
                const raids = profile.raid_progression;
                // Priority: Midnight Raids
                const midnightRaids = [
                    { key: "voidspire", name: "La Aguja del Vacío" },
                    { key: "dreamwell", name: "La Falla del Sueño" },
                    { key: "marchonqueldanas", name: "Marcha sobre Quel'Danas" },
                    { key: "manaforge-omega", name: "Manaforge Omega" }
                ];

                let foundMidnight = false;
                midnightRaids.forEach(r => {
                    const data = raids[r.key];
                    if (data && (data.mythic_bosses_killed > 0 || data.heroic_bosses_killed > 0)) {
                        content += `✨ **${r.name}**: ${data.summary} (${data.mythic_bosses_killed}/${data.total_bosses} M)\n`;
                        foundMidnight = true;
                    }
                });

                if (!foundMidnight) {
                    // Fallback to Nerub-ar Palace (TWW S1) or current highest
                    const nerubar = raids["nerubar-palace"];
                    if (nerubar) {
                        content += `⚔️ **Palacio Nerub'ar (TWW S1)**: ${nerubar.summary} (${nerubar.mythic_bosses_killed}/${nerubar.total_bosses} M)\n`;
                    } else {
                        // Just show the first one available
                        const firstRaidKey = Object.keys(raids)[0];
                        const firstRaid = raids[firstRaidKey];
                        content += `⚔️ **${firstRaidKey}**: ${firstRaid.summary} (${firstRaid.mythic_bosses_killed}/${firstRaid.total_bosses} M)\n`;
                    }
                }
            }

            content += "\n🔗 [Ver perfil completo en Raider.io](https://raider.io/guilds/eu/dun-modr/Artic%20Tempest)";

            return NextResponse.json({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: { content },
            });
        }
    }

    // Si no conocemos el tipo, devolvemos un 400
    return NextResponse.json({ error: "Unknown interaction type" }, { status: 400 });
}
