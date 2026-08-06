import { NextRequest, NextResponse } from 'next/server';

import { getGuildCredentials } from '@/shared/auth/credentials';
import { enforceDesktopSessionAuth } from '@/shared/api/desktop-auth';
import { RAIDER_RULES_VERSION } from '@/shared/constants/raider-rules';
import {
  discordMemberHasVerifiedRole,
  getRaiderRulesAcceptance,
  getRaiderRulesProfile,
} from '@/shared/lib/raider-rules.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const claims = await enforceDesktopSessionAuth(request);
  if (claims instanceof NextResponse) return claims;

  try {
    const [profile, acceptance, creds] = await Promise.all([
      getRaiderRulesProfile(claims.sub),
      getRaiderRulesAcceptance(claims.sub),
      getGuildCredentials(),
    ]);

    const discordIntegrationReady = Boolean(
      creds.discord_bot_token && creds.discord_guild_id,
    );

    const discordHasVerifiedRole =
      profile?.discord_user_id &&
      discordIntegrationReady &&
      claims.discordId
        ? await discordMemberHasVerifiedRole({
            discordUserId: claims.discordId,
            guildId: creds.discord_guild_id,
            botToken: creds.discord_bot_token,
          }).catch(() => false)
        : false;

    const required = profile?.role_level === 'trial' && !discordHasVerifiedRole;

    return NextResponse.json({
      required,
      acceptedAt: acceptance?.accepted_at ?? null,
      acceptedVersion: acceptance?.accepted_version ?? null,
      discordRoleAssignedAt: acceptance?.discord_role_assigned_at ?? null,
      discordRoleStatus: acceptance?.discord_role_status ?? null,
      discordRoleError: acceptance?.discord_role_error ?? null,
      discordRoleLastAttemptAt: acceptance?.discord_role_last_attempt_at ?? null,
      discordHasVerifiedRole,
      discordVerificationError: null,
      discordIntegrationReady,
      currentVersion: RAIDER_RULES_VERSION,
      roleLevel: profile?.role_level ?? claims.roleLevel ?? null,
    });
  } catch (error) {
    console.error('[DesktopRaiderRulesStatus] Failed to load status', error);
    return NextResponse.json(
      { error: 'No se pudo cargar la normativa Raider', code: 'STATUS_FAILED' },
      { status: 500 },
    );
  }
}
