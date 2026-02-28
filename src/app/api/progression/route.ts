import { NextResponse } from "next/server";
import { sb } from "@/infrastructure/auth/auth-options";

export async function GET() {
    try {
        // Fetch guild info and WCL credentials
        const { data: guild } = await sb
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
        const { data: raids } = await sb
            .from("game_constants")
            .select("key, value, metadata")
            .eq("category", "wow_raid");

        if (!raids || raids.length === 0) {
            throw new Error("No hay datos de raids en la base de datos");
        }

        const progression = raids.sort((a: any, b: any) => {
            const keys = ['Voidspire', 'Dreamrift', "March on Quel'Danas"];
            return keys.indexOf(a.key) - keys.indexOf(b.key);
        }).map((r: any) => {
            const bossCount = r.metadata?.boss_count || 0;
            return {
                name: r.value,
                expansion: r.metadata?.expansion || "Midnight",
                tier: r.metadata?.tier || "Temporada 1",
                progress: `0/${bossCount} M`,
                rank: "-",
                status: "Próximamente"
            };
        });

        return NextResponse.json({ progression });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
