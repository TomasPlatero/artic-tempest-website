import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/auth/auth-options";

export async function GET() {
    try {
        // Fetch guild info and WCL credentials
        const { data: guild } = await supabaseAdmin
            .from("guilds_managed")
            .select("name, realm, region, wcl_client_id, wcl_client_secret")
            .limit(1)
            .single();

        if (!guild?.wcl_client_id || !guild?.wcl_client_secret) {
            return NextResponse.json({ error: "No WCL credentials" }, { status: 400 });
        }

        // 1. Get WCL Token (cached)
        const authString = Buffer.from(`${guild.wcl_client_id}:${guild.wcl_client_secret}`).toString("base64");
        const tokenRes = await fetch("https://www.warcraftlogs.com/oauth/token", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${authString}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "grant_type=client_credentials",
            next: { revalidate: 3600 }
        });

        if (!tokenRes.ok) throw new Error("WCL Auth failed");
        const { access_token } = await tokenRes.json();

        // 2. Fetch Raid Constants from DB
        const { data: raids } = await supabaseAdmin
            .from("game_constants")
            .select("key, value, metadata")
            .eq("category", "wow_raid");

        if (!raids || raids.length === 0) {
            throw new Error("No hay datos de raids en la base de datos");
        }

        // 3. Fetch live data from WCL for current raids
        // Note: For Midnight, we query by Zone ID. If unknown, we'll try to find them.
        // For now, we'll use a placeholder logic that can be updated with real IDs.
        const midnightZoneIds = {
            "voidspire": 41, // Example ID, would need verification
            "dreamwell": 42,
            "sunwell": 43
        };

        const gqlQuery = `
          query {
            guildData {
              guild(id: 743623) {
                voidspire: raidProgression(zoneId: 41) { summary { mythicKills mythicRank } }
                dreamwell: raidProgression(zoneId: 42) { summary { mythicKills mythicRank } }
                sunwell: raidProgression(zoneId: 43) { summary { mythicKills mythicRank } }
              }
            }
          }
        `;

        let wclData: any = null;
        try {
            const wclRes = await fetch("https://www.warcraftlogs.com/api/v2/client", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ query: gqlQuery }),
                next: { revalidate: 3600 }
            });
            if (wclRes.ok) {
                const json = await wclRes.json();
                wclData = json.data?.guildData?.guild;
            }
        } catch (e) {
            console.error("Error fetching live WCL data:", e);
        }

        const progression = raids.filter((r: any) => r.key !== 'Todas las Raids').sort((a: any, b: any) => {
            const keys = ['voidspire', 'dreamwell', "sunwell"];
            return keys.indexOf(a.key) - keys.indexOf(b.key);
        }).map((r: any) => {
            const bossCount = r.metadata?.boss_count || r.metadata?.bosses?.length || 0;
            const live = wclData ? wclData[r.key] : null;

            const kills = live?.summary?.mythicKills || 0;
            const rank = live?.summary?.mythicRank;

            // Normalized keys for image mapping
            const normalizedKey = r.key.toLowerCase().trim()
                .replace(/['"']/g, "")
                .replace(/\s+/g, "");

            const imageMap: Record<string, string> = {
                "voidspire": "/assets/images/raids/voidspire.webp",
                "dreamwell": "/assets/images/raids/dreamrift.webp",
                "dreamrift": "/assets/images/raids/dreamrift.webp",
                "sunwell": "/assets/images/raids/marchonqueldanas.webp",
                "marchonqueldanas": "/assets/images/raids/marchonqueldanas.webp"
            };

            return {
                name: r.value,
                expansion: r.metadata?.expansion || "Midnight",
                tier: r.metadata?.tier || "Temporada 1",
                progress: `${kills}/${bossCount} M`,
                rank: rank ? `Rank ${rank}` : "-",
                status: kills > 0 ? "En Progreso" : "Próximamente",
                imageUrl: imageMap[normalizedKey] || "/assets/images/raids/all-raids.webp"
            };
        });

        // Remove the cutoff date check and TWW data for the landing page (clean start for Midnight)
        return NextResponse.json({ progression });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
