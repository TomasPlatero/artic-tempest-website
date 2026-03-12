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

        const progression = raids.filter((r: any) => r.key !== 'Todas las Raids').sort((a: any, b: any) => {
            const keys = ['Voidspire', 'Dreamrift', "March on Quel'Danas"];
            return keys.indexOf(a.key) - keys.indexOf(b.key);
        }).map((r: any) => {
            const bossCount = r.metadata?.boss_count || r.metadata?.bosses?.length || 0;
            return {
                name: r.value,
                expansion: r.metadata?.expansion || "Midnight",
                tier: r.metadata?.tier || "Temporada 1",
                progress: `0/${bossCount} M`,
                rank: "-",
                status: "Próximamente"
            };
        });

        // Progreso histórico de The War Within (hardcodeado con datos oficiales de WarcraftLogs al finalizar la expansión)
        const now = new Date();
        const cutoffDate = new Date("2026-03-17T00:00:00Z");

        if (now < cutoffDate) {
            progression.push(
                {
                    name: "Palacio Nerub'ar",
                    expansion: "The War Within",
                    tier: "Temporada 1",
                    progress: "6/8 M",
                    rank: "Top 5 Dun Modr",
                    status: "AotC (En Progreso)"
                },
                {
                    name: "Liberación de Minahonda",
                    expansion: "The War Within",
                    tier: "Temporada 2",
                    progress: "5/8 M",
                    rank: "Top 9 Dun Modr",
                    status: "AotC (En Progreso)"
                },
                {
                    name: "Forja de Maná Omega",
                    expansion: "The War Within",
                    tier: "Temporada 3",
                    progress: "8/8 M",
                    rank: "Top 2 Dun Modr",
                    status: "Cutting Edge"
                }
            );
        }

        return NextResponse.json({ progression });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
