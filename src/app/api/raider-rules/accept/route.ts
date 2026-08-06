import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGuildCredentials } from '@/shared/auth/credentials';
import { logRoleAudit } from '@/shared/lib/role-audit.server';
import { RAIDER_RULES_VERSION } from '@/shared/constants/raider-rules';
import {
  getRaiderRulesProfile,
  markRaiderRulesAcceptanceState,
  tryAssignRaiderVerifiedRole,
} from '@/shared/lib/raider-rules.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.discordId) {
      return NextResponse.json(
        { error: 'No autorizado', code: 'UNAUTHORIZED' },
        { status: 401 },
      );
    }

    const profile = await getRaiderRulesProfile(session.user.id);
    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil no encontrado', code: 'PROFILE_NOT_FOUND' },
        { status: 404 },
      );
    }

    if ((profile.role_level ?? '').toLowerCase() !== 'trial') {
      return NextResponse.json(
        { success: true, required: false, message: 'No requiere aceptación' },
        { status: 200 },
      );
    }

    const creds = await getGuildCredentials();
    if (!creds.discord_bot_token || !creds.discord_guild_id) {
      return NextResponse.json(
        {
          error: 'Falta la configuración de Discord',
          code: 'DISCORD_NOT_CONFIGURED',
        },
        { status: 500 },
      );
    }

    if (!profile.discord_user_id) {
      return NextResponse.json(
        {
          error: 'El perfil no tiene Discord vinculado',
          code: 'DISCORD_NOT_LINKED',
        },
        { status: 400 },
      );
    }

    const roleAttempt = await tryAssignRaiderVerifiedRole({
      discordUserId: profile.discord_user_id,
      guildId: creds.discord_guild_id,
      botToken: creds.discord_bot_token,
    });

    const acceptedAt = new Date().toISOString();
    await markRaiderRulesAcceptanceState({
      userId: session.user.id,
      acceptedAt,
      acceptedVersion: RAIDER_RULES_VERSION,
      roleAssignedAt: roleAttempt.ok ? acceptedAt : null,
      roleStatus: roleAttempt.ok ? 'assigned' : 'pending',
      roleError: roleAttempt.ok ? null : roleAttempt.error,
      roleLastAttemptAt: acceptedAt,
    });

    await logRoleAudit({
      action: 'raider_rules_accepted',
      roleLevel: profile.role_level ?? undefined,
      payload: {
        userId: session.user.id,
        discordUserId: profile.discord_user_id,
        acceptedVersion: RAIDER_RULES_VERSION,
        discordRoleId: '1412031080407629856',
      },
      changedBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      required: false,
      acceptedAt,
      acceptedVersion: RAIDER_RULES_VERSION,
      roleAssigned: roleAttempt.ok,
      roleError: roleAttempt.ok ? null : roleAttempt.error,
    });
  } catch (error) {
    console.error('[RaiderRulesAccept] Failed to process acceptance', error);
    return NextResponse.json(
      {
        error: 'No se pudo registrar la aceptación de normativa',
        code: 'ACCEPTANCE_FAILED',
      },
      { status: 500 },
    );
  }
}
