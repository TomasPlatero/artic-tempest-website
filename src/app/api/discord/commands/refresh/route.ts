
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/infrastructure/auth/auth-options";
import { getGuildCredentials } from "@/infrastructure/auth/credentials";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.roleLevel !== 'gm') {
            return new NextResponse("No autorizado", { status: 401 });
        }

        const creds = await getGuildCredentials();
        const { discord_bot_token, discord_client_id, discord_app_id, discord_guild_id } = creds as any;

        const token = discord_bot_token || process.env.DISCORD_BOT_TOKEN;
        const appId = discord_app_id || process.env.DISCORD_APP_ID || discord_client_id || process.env.DISCORD_CLIENT_ID;
        const guildId = discord_guild_id || process.env.DISCORD_GUILD_ID;

        if (!token || !appId) {
            return NextResponse.json({ error: "Faltan credenciales de Discord" }, { status: 400 });
        }

        // Fetch enabled commands from DB
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

        const { data: dbCommands } = await sb
            .from("discord_commands")
            .select("name, description")
            .eq("is_enabled", true);

        const commands = dbCommands?.length ? dbCommands.map(c => ({
            name: c.name,
            description: c.description,
            type: 1
        })) : []; // Si no hay comandos habilitados, enviamos lista vacía para limpiar Discord

        // Si tenemos Guild ID, usamos el endpoint de servidor (Instantáneo)
        // Si NO tenemos Guild ID, usamos el global (Tarda hasta 1 hora)
        const url = guildId
            ? `https://discord.com/api/v10/applications/${appId}/guilds/${guildId}/commands`
            : `https://discord.com/api/v10/applications/${appId}/commands`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bot ${token}`,
            },
            body: JSON.stringify(commands),
        });

        if (response.ok) {
            const data = await response.json();
            return NextResponse.json({ success: true, commands: data });
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error("Discord API Error:", {
                status: response.status,
                data: errorData
            });

            let message = "Error de Discord";
            if (response.status === 403) message = "403 Forbidden: El bot no tiene permisos o el token es inválido para esta aplicación.";
            if (response.status === 401) message = "401 Unauthorized: El Bot Token es incorrecto.";
            if (response.status === 404) message = "404 Not Found: El Application ID o Guild ID es incorrecto.";

            return NextResponse.json({
                error: message,
                discordError: errorData
            }, { status: response.status });
        }

    } catch (e: any) {
        console.error("Error refreshing discord commands:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
