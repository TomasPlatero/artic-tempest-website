import { NextResponse } from 'next/server';
import { getGuildCredentials } from '@/shared/auth/credentials';
import { ensureAppPermission } from '@/shared/auth/permissions';

export async function GET() {
  await ensureAppPermission('settings-discord', 'edit');

  try {
    const creds = await getGuildCredentials();
    if (!creds.discord_bot_token || !creds.discord_guild_id) {
      return NextResponse.json(
        { error: 'Discord not configured' },
        { status: 400 },
      );
    }

    const res = await fetch(
      `https://discord.com/api/v10/guilds/${creds.discord_guild_id}/channels`,
      {
        headers: {
          Authorization: `Bot ${creds.discord_bot_token}`,
        },
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('Discord error:', err);
      throw new Error('Failed to fetch channels');
    }

    const channels = await res.json();

    // Filter only text channels (type 0) and announcement channels (type 5)
    const textChannels = channels
      .filter((c: any) => c.type === 0 || c.type === 5)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json(textChannels);
  } catch (err: any) {
    console.error('API Discord channels error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
