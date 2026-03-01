
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";
import { getGuildCredentials } from "@/infrastructure/auth/credentials";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
            return new NextResponse("No autorizado", { status: 401 });
        }

        const creds = await getGuildCredentials();
        const { discord_bot_token, discord_guild_id } = creds as any;

        const token = discord_bot_token || process.env.DISCORD_BOT_TOKEN;
        const guildId = discord_guild_id || process.env.DISCORD_GUILD_ID;

        if (!token || !guildId) {
            return NextResponse.json({ error: "Faltan credenciales de Discord (Bot Token o Guild ID)" }, { status: 400 });
        }

        const url = `https://discord.com/api/v10/guilds/${guildId}/roles`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bot ${token}`,
            },
            next: { revalidate: 60 } // Cache for 1 minute
        });

        if (response.ok) {
            const roles = await response.json();
            // Filter out @everyone if you want, but might be better to keep it
            // Typically high level roles like bot roles can be excluded if needed
            return NextResponse.json(roles);
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error("Discord API Error (Roles):", {
                status: response.status,
                data: errorData
            });

            return NextResponse.json({
                error: "Error al obtener roles de Discord",
                discordError: errorData
            }, { status: response.status });
        }

    } catch (e: any) {
        console.error("Error fetching discord roles:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
