import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { getGuildCredentials } from '@/shared/auth/credentials';
import {
  RAIDER_RULES_VERSION as RAIDER_RULES_VERSION_CONST,
  RAIDER_VERIFIED_ROLE_ID as RAIDER_VERIFIED_ROLE_ID_CONST,
} from '@/shared/constants/raider-rules';

const RAIDER_RULES_VERSION = RAIDER_RULES_VERSION_CONST;
const RAIDER_VERIFIED_ROLE_ID = RAIDER_VERIFIED_ROLE_ID_CONST;

export type RaiderRulesProfile = {
  user_id: string;
  discord_user_id: string | null;
  role_level: string | null;
};

export type RaiderRulesAcceptance = {
  user_id: string;
  accepted_at: string | null;
  accepted_version: string | null;
  discord_role_assigned_at: string | null;
  discord_role_status: string | null;
  discord_role_error: string | null;
  discord_role_last_attempt_at: string | null;
};

export type DiscordGuildMember = {
  roles: string[];
};

export type DiscordGuildRole = {
  id: string;
  name: string;
  color: number;
  position: number;
  managed: boolean;
  mentionable: boolean;
};

export async function getRaiderRulesProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('user_id, discord_user_id, role_level')
    .eq('user_id', userId)
    .maybeSingle<RaiderRulesProfile>();

  if (error) throw error;
  return data;
}

export async function getRaiderRulesAcceptance(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('raider_rules_acceptances')
    .select(
      'user_id, accepted_at, accepted_version, discord_role_assigned_at, discord_role_status, discord_role_error, discord_role_last_attempt_at',
    )
    .eq('user_id', userId)
    .maybeSingle<RaiderRulesAcceptance>();

  if (error) throw error;
  return data;
}

export async function getRaiderRulesStatus(userId: string) {
  const [profile, acceptance, creds] = await Promise.all([
    getRaiderRulesProfile(userId),
    getRaiderRulesAcceptance(userId),
    getGuildCredentials(),
  ]);

  const discordIntegrationReady = Boolean(
    creds.discord_bot_token && creds.discord_guild_id,
  );

  let discordVerificationError: string | null = null;

  let discordHasVerifiedRole = false;

  if (profile?.discord_user_id && discordIntegrationReady) {
    try {
      discordHasVerifiedRole = await discordMemberHasVerifiedRole({
        discordUserId: profile.discord_user_id,
        guildId: creds.discord_guild_id,
        botToken: creds.discord_bot_token,
      });
    } catch (error) {
      discordVerificationError =
        error instanceof Error
          ? error.message
          : 'Discord no pudo verificar el rol';
    }
  }

  return {
    required: profile?.role_level === 'trial' && !discordHasVerifiedRole,
    acceptedAt: acceptance?.accepted_at ?? null,
    acceptedVersion: acceptance?.accepted_version ?? null,
    discordHasVerifiedRole,
    discordRoleAssignedAt: acceptance?.discord_role_assigned_at ?? null,
    discordRoleStatus: acceptance?.discord_role_status ?? null,
    discordRoleError: acceptance?.discord_role_error ?? null,
    discordRoleLastAttemptAt: acceptance?.discord_role_last_attempt_at ?? null,
    discordVerificationError,
    currentVersion: RAIDER_RULES_VERSION,
    roleLevel: profile?.role_level ?? null,
    discordIntegrationReady,
  };
}

async function upsertRaiderRulesAcceptance(payload: {
  userId: string;
  acceptedAt: string;
  acceptedVersion: string;
  discordRoleAssignedAt?: string | null;
  discordRoleStatus?: string | null;
  discordRoleError?: string | null;
  discordRoleLastAttemptAt?: string | null;
}) {
  const { error } = await supabaseAdmin.from('raider_rules_acceptances').upsert(
    {
      user_id: payload.userId,
      accepted_at: payload.acceptedAt,
      accepted_version: payload.acceptedVersion,
      discord_role_assigned_at: payload.discordRoleAssignedAt ?? null,
      discord_role_status: payload.discordRoleStatus ?? null,
      discord_role_error: payload.discordRoleError ?? null,
      discord_role_last_attempt_at: payload.discordRoleLastAttemptAt ?? null,
    },
    { onConflict: 'user_id' },
  );

  if (error) throw error;
}

function _isRaiderRulesAcceptanceRequired(
  profile:
    | { role_level: string | null; accepted_version?: string | null }
    | null
    | undefined,
) {
  if (!profile) return false;
  if ((profile.role_level ?? '').toLowerCase() !== 'trial') return false;
  return (profile.accepted_version ?? null) !== RAIDER_RULES_VERSION;
}



export async function markRaiderRulesAcceptanceState(params: {
  userId: string;
  acceptedAt: string;
  acceptedVersion: string;
  roleAssignedAt?: string | null;
  roleStatus?: string | null;
  roleError?: string | null;
  roleLastAttemptAt?: string | null;
}) {
  await upsertRaiderRulesAcceptance({
    userId: params.userId,
    acceptedAt: params.acceptedAt,
    acceptedVersion: params.acceptedVersion,
    discordRoleAssignedAt: params.roleAssignedAt ?? null,
    discordRoleStatus: params.roleStatus ?? null,
    discordRoleError: params.roleError ?? null,
    discordRoleLastAttemptAt: params.roleLastAttemptAt ?? null,
  });
}

export async function tryAssignRaiderVerifiedRole(params: {
  discordUserId: string;
  guildId: string;
  botToken: string;
}) {
  return assignDiscordRole({
    discordUserId: params.discordUserId,
    guildId: params.guildId,
    botToken: params.botToken,
    discordRoleId: RAIDER_VERIFIED_ROLE_ID,
  });
}

export async function assignDiscordRole(params: {
  discordUserId: string;
  guildId: string;
  botToken: string;
  discordRoleId: string;
}) {
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${params.guildId}/members/${params.discordUserId}/roles/${params.discordRoleId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${params.botToken}`,
      },
    },
  );

  if (!response.ok && response.status !== 204) {
    const errorBody = await response.text().catch(() => '');
    return {
      ok: false as const,
      error: `Discord no pudo asignar el rol (${response.status}): ${errorBody}`,
    };
  }

  return { ok: true as const };
}

export async function tryRemoveRaiderVerifiedRole(params: {
  discordUserId: string;
  guildId: string;
  botToken: string;
}) {
  return removeDiscordRole({
    discordUserId: params.discordUserId,
    guildId: params.guildId,
    botToken: params.botToken,
    discordRoleId: RAIDER_VERIFIED_ROLE_ID,
  });
}

export async function removeDiscordRole(params: {
  discordUserId: string;
  guildId: string;
  botToken: string;
  discordRoleId: string;
}) {
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${params.guildId}/members/${params.discordUserId}/roles/${params.discordRoleId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bot ${params.botToken}`,
      },
    },
  );

  if (response.status === 404) {
    return { ok: true as const };
  }

  if (!response.ok && response.status !== 204) {
    const errorBody = await response.text().catch(() => '');
    return {
      ok: false as const,
      error: `Discord no pudo quitar el rol (${response.status}): ${errorBody}`,
    };
  }

  return { ok: true as const };
}

export async function fetchDiscordGuildRoles(params: {
  guildId: string;
  botToken: string;
}) {
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${params.guildId}/roles`,
    {
      headers: {
        Authorization: `Bot ${params.botToken}`,
      },
      next: { revalidate: 60 },
    },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `Discord no pudo consultar los roles (${response.status}): ${errorBody}`,
    );
  }

  const roles = (await response.json()) as DiscordGuildRole[];

  return roles
    .filter((role) => role.id !== params.guildId)
    .sort((a, b) => b.position - a.position);
}

export async function fetchDiscordGuildMember(params: {
  discordUserId: string;
  guildId: string;
  botToken: string;
}) {
  const response = await fetch(
    `https://discord.com/api/v10/guilds/${params.guildId}/members/${params.discordUserId}`,
    {
      headers: {
        Authorization: `Bot ${params.botToken}`,
      },
    },
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    const errorBody = await response.text().catch(() => '');
    throw new Error(
      `Discord no pudo consultar el miembro (${response.status}): ${errorBody}`,
    );
  }

  return (await response.json()) as DiscordGuildMember;
}

export async function discordMemberHasVerifiedRole(params: {
  discordUserId: string;
  guildId: string;
  botToken: string;
}) {
  const member = await fetchDiscordGuildMember(params);
  return Boolean(member?.roles?.includes(RAIDER_VERIFIED_ROLE_ID));
}
