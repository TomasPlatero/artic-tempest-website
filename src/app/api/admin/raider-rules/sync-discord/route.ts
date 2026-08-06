import { NextResponse } from 'next/server';

import { ensureAppPermission } from '@/shared/auth/permissions';
import { getGuildCredentials } from '@/shared/auth/credentials';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { RAIDER_RULES_VERSION } from '@/shared/constants/raider-rules';
import {
  discordMemberHasVerifiedRole,
  markRaiderRulesAcceptanceState,
} from '@/shared/lib/raider-rules.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SettledResult =
  | { result: 'assigned'; userId: string; username: string }
  | { result: 'missing'; userId: string; username: string }
  | { result: 'error'; userId: string; username: string; error: string };

export async function POST() {
  const session = await ensureAppPermission('settings-accounts', 'manage');
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const creds = await getGuildCredentials();
  if (!creds.discord_bot_token || !creds.discord_guild_id) {
    return NextResponse.json(
      { error: 'Falta la configuración de Discord' },
      { status: 500 },
    );
  }

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('user_id, discord_user_id, discord_username, role_level')
    .in('role_level', ['trial', 'raider']);

  const targetProfiles = (profiles ?? []).filter(
    (profile) => profile.discord_user_id,
  );
  const targetIds = targetProfiles.map((profile) => profile.user_id);

  const { data: acceptances } = await supabaseAdmin
    .from('raider_rules_acceptances')
    .select(
      'user_id, accepted_at, accepted_version, discord_role_assigned_at, discord_role_status, discord_role_error, discord_role_last_attempt_at',
    )
    .in('user_id', targetIds);

  const acceptanceMap = new Map(
    (acceptances ?? []).map((row) => [row.user_id, row] as const),
  );

  const assignedMembers: Array<{ userId: string; username: string }> = [];
  const missingMembers: Array<{ userId: string; username: string }> = [];
  const errors: Array<{ userId: string; username: string; error: string }> = [];

  const settledResults = await Promise.allSettled(
    targetProfiles.map(async (profile): Promise<SettledResult> => {
      const now = new Date().toISOString();

      try {
        const hasRole = await discordMemberHasVerifiedRole({
          discordUserId: profile.discord_user_id,
          guildId: creds.discord_guild_id,
          botToken: creds.discord_bot_token,
        });

        const acceptance = acceptanceMap.get(profile.user_id);
        if (acceptance) {
          await markRaiderRulesAcceptanceState({
            userId: profile.user_id,
            acceptedAt: acceptance.accepted_at ?? now,
            acceptedVersion: acceptance.accepted_version ?? RAIDER_RULES_VERSION,
            roleAssignedAt: hasRole
              ? (acceptance.discord_role_assigned_at ?? now)
              : (acceptance.discord_role_assigned_at ?? null),
            roleStatus: hasRole ? 'assigned' : 'missing',
            roleError: null,
            roleLastAttemptAt: now,
          });
        } else if (hasRole) {
          await markRaiderRulesAcceptanceState({
            userId: profile.user_id,
            acceptedAt: now,
            acceptedVersion: RAIDER_RULES_VERSION,
            roleAssignedAt: now,
            roleStatus: 'assigned',
            roleError: null,
            roleLastAttemptAt: now,
          });
        }

        return {
          result: hasRole ? 'assigned' : 'missing' as const,
          userId: profile.user_id,
          username: profile.discord_username ?? profile.user_id,
        } as SettledResult;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error desconocido';

        const acceptance = acceptanceMap.get(profile.user_id);
        if (acceptance) {
          await markRaiderRulesAcceptanceState({
            userId: profile.user_id,
            acceptedAt: acceptance.accepted_at ?? now,
            acceptedVersion: acceptance.accepted_version ?? RAIDER_RULES_VERSION,
            roleAssignedAt: acceptance.discord_role_assigned_at ?? null,
            roleStatus: 'error',
            roleError: message,
            roleLastAttemptAt: now,
          });
        }

        return {
          result: 'error' as const,
          userId: profile.user_id,
          username: profile.discord_username ?? profile.user_id,
          error: message,
        };
      }
    }),
  );

  for (const settled of settledResults) {
    if (settled.status !== 'fulfilled') continue;
    const value = settled.value;
    if (value.result === 'assigned') {
      assignedMembers.push({ userId: value.userId, username: value.username });
    } else if (value.result === 'missing') {
      missingMembers.push({ userId: value.userId, username: value.username });
    } else {
      errors.push({ userId: value.userId, username: value.username, error: value.error });
    }
  }

  return NextResponse.json({
    success: true,
    assignedCount: assignedMembers.length,
    missingCount: missingMembers.length,
    errorCount: errors.length,
    assignedMembers,
    missingMembers,
    errors,
  });
}
