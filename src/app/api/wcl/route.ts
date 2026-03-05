import { NextResponse } from "next/server";
import { sb } from "@/infrastructure/auth/auth-options";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/infrastructure/auth/auth-options";

export async function GET(_req: Request) {
    try {
        const { searchParams } = new URL(_req.url);
        const reportCode = searchParams.get("code");
        const zoneID = searchParams.get("zoneID");
        const guildTagID = searchParams.get("guildTagID");
        const action = searchParams.get("action");

        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("No autorizado", { status: 401 });
        }

        // Fetch WCL credentials from the guild settings
        const { data: guild } = await sb
            .from("guilds_managed")
            .select("wcl_client_id, wcl_client_secret")
            .limit(1)
            .single();

        if (!guild?.wcl_client_id || !guild?.wcl_client_secret) {
            return NextResponse.json({ error: "No se han configurado credenciales de WCL" }, { status: 400 });
        }

        const clientId = guild.wcl_client_id;
        const clientSecret = guild.wcl_client_secret;

        // 1. Authenticate with WCL OAuth
        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

        const tokenRes = await fetch("https://www.warcraftlogs.com/oauth/token", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${authString}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "grant_type=client_credentials",
            // Cache the token to prevent rate limiting, or WCL tokens usually last for 24h
            next: { revalidate: 3600 }
        });

        if (!tokenRes.ok) {
            console.error("WCL Token error:", await tokenRes.text());
            return NextResponse.json({ error: "Error al autenticar con WarcraftLogs" }, { status: 502 });
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        // 2. Fetch data via GraphQL
        let query = "";

        if (action === 'tags') {
            // Fetch guild tags
            query = `
            query {
                guildData {
                    guild(id: 743623) {
                        tags {
                            id
                            name
                        }
                    }
                }
            }`;
        } else if (reportCode) {
            // Fetch detailed report fights + summary tables
            query = `
            query {
                reportData {
                    report(code: "${reportCode}") {
                        code
                        title
                        startTime
                        endTime
                        zone { name }
                        fights(killType: All) {
                            id
                            name
                            difficulty
                            kill
                            fightPercentage
                            bossPercentage
                            lastPhase
                            friendlyPlayers
                        }
                        damageDone: table(dataType: DamageDone)
                        healingDone: table(dataType: HealingDone)
                    }
                }
            }`;
        } else {
            // Fetch recent reports list
            const zoneFilter = zoneID ? `, zoneID: ${zoneID}` : '';
            const tagFilter = guildTagID ? `, guildTagID: ${guildTagID}` : '';
            query = `
            query {
                reportData {
                    reports(guildID: 743623, limit: 50${zoneFilter}${tagFilter}) {
                        data {
                            code
                            title
                            startTime
                            zone { name }
                            segments
                            guildTag { id name }
                        }
                    }
                }
            }`;
        }

        const gqlRes = await fetch("https://www.warcraftlogs.com/api/v2/client", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query }),
            next: { revalidate: 0 } // No cache to ensure deleted logs disappear immediately
        });

        if (!gqlRes.ok) {
            console.error("WCL GraphQL error:", await gqlRes.text());
            return NextResponse.json({ error: "Error al obtener informes de WarcraftLogs" }, { status: 502 });
        }

        const responseData = await gqlRes.json();

        if (responseData.errors) {
            console.error("WCL GraphQL errors:", JSON.stringify(responseData.errors));
            return NextResponse.json({ error: "Error en la consulta a WarcraftLogs" }, { status: 502 });
        }

        return NextResponse.json(responseData.data);

    } catch (e: any) {
        console.error("WCL API Error:", e.message);
        return new NextResponse("Error interno del servidor", { status: 500 });
    }
}
