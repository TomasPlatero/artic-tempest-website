import { NextResponse } from 'next/server';
import { getGuildCredentials } from '@/shared/auth/credentials';
import { ensureAppPermission } from '@/shared/auth/permissions';

export async function GET() {
  try {
    await ensureAppPermission('settings-discord', 'edit');

    const creds = await getGuildCredentials();
    const { discord_bot_token, discord_guild_id } = creds as any;

    const token = discord_bot_token || process.env.DISCORD_BOT_TOKEN;
    const guildId = discord_guild_id || process.env.DISCORD_GUILD_ID;

    if (!token || !guildId) {
      return NextResponse.json(
        { error: 'Faltan credenciales de Discord' },
        { status: 400 },
      );
    }

    const url = `https://discord.com/api/v10/guilds/${guildId}/emojis`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bot ${token}`,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (response.ok) {
      const emojis = await response.json();
      return NextResponse.json(emojis);
    } else {
      return NextResponse.json(
        { error: 'Error al obtener emojis' },
        { status: response.status },
      );
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
