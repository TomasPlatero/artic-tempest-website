import { NextRequest, NextResponse } from 'next/server';

import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { getGuildCredentials } from '@/shared/auth/credentials';
import { enforceDesktopSessionAuth } from '@/shared/api/desktop-auth';
import { canUseRaiderApp, getRoleFlags } from '@/shared/auth/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const claims = await enforceDesktopSessionAuth(request);
  if (claims instanceof NextResponse) return claims;

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('user_id, discord_user_id, role_level')
      .eq('user_id', claims.sub)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: 'No se pudo cargar el perfil', code: 'PROFILE_LOOKUP_FAILED' },
        { status: 500 },
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado', code: 'PROFILE_NOT_FOUND' },
        { status: 404 },
      );
    }

    const roleLevel = profile.role_level ?? claims.roleLevel;
    const flags = await getRoleFlags(roleLevel);
    const creds = await getGuildCredentials();

    return NextResponse.json(
      {
        allowed: await canUseRaiderApp(roleLevel),
        roleLevel,
        label: flags.label,
        priority: flags.priority,
        canUseRaiderApp: flags.canUseRaiderApp,
        discordUserId: profile.discord_user_id,
        discordConfigured:
          Boolean(creds.discord_bot_token) && Boolean(creds.discord_guild_id),
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      },
    );
  } catch (error) {
    console.error('[DesktopRaiderAppStatus] Failed to load status', error);
    return NextResponse.json(
      { error: 'No se pudo cargar el estado Raider', code: 'STATUS_FAILED' },
      { status: 500 },
    );
  }
}
