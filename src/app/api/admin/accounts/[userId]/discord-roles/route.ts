import { NextResponse, type NextRequest } from 'next/server';
import { getGuildCredentials } from '@/shared/auth/credentials';
import { ensureAppPermission } from '@/shared/auth/permissions';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import {
  assignDiscordRole,
  fetchDiscordGuildMember,
  fetchDiscordGuildRoles,
  removeDiscordRole,
} from '@/shared/lib/raider-rules.server';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ userId: string }>;
};

async function resolveDiscordMember(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('user_id, discord_user_id, discord_username')
    .eq('user_id', userId)
    .maybeSingle<{
      user_id: string;
      discord_user_id: string | null;
      discord_username: string | null;
    }>();

  if (error) throw error;
  if (!data) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Perfil no encontrado' },
        { status: 404 },
      ),
    };
  }

  if (!data.discord_user_id) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error:
            'El usuario no tiene una cuenta de Discord vinculada. Debe iniciar sesión con Discord para poder asignar roles.',
        },
        { status: 400 },
      ),
    };
  }

  return {
    ok: true as const,
    profile: {
      user_id: data.user_id,
      discord_user_id: data.discord_user_id,
      discord_username: data.discord_username,
    },
  };
}

async function resolveDiscordCredentials() {
  const credentials = await getGuildCredentials();
  if (!credentials.discord_bot_token || !credentials.discord_guild_id) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error:
            'Discord no está configurado correctamente (falta Bot Token o Guild ID).',
        },
        { status: 500 },
      ),
    };
  }

  return {
    ok: true as const,
    guildId: credentials.discord_guild_id,
    botToken: credentials.discord_bot_token,
  };
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const [_, { userId }] = await Promise.all([
      ensureAppPermission('settings-accounts', 'manage'),
      context.params,
    ]);
    const memberResult = await resolveDiscordMember(userId);
    if (!memberResult.ok) return memberResult.response;
    const discordUserId = memberResult.profile.discord_user_id;

    const credentialsResult = await resolveDiscordCredentials();
    if (!credentialsResult.ok) return credentialsResult.response;

    const [roles, member] = await Promise.all([
      fetchDiscordGuildRoles({
        guildId: credentialsResult.guildId,
        botToken: credentialsResult.botToken,
      }),
      fetchDiscordGuildMember({
        guildId: credentialsResult.guildId,
        botToken: credentialsResult.botToken,
        discordUserId,
      }),
    ]);

    return NextResponse.json({
      member: {
        userId: memberResult.profile.user_id,
        discordUserId,
        discordUsername: memberResult.profile.discord_username,
      },
      roles,
      memberRoleIds: member?.roles ?? [],
    });
  } catch (error: any) {
    console.error('[admin.accounts.discord-roles.get]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const [_, { userId }, { roleId, assign }] = await Promise.all([
      ensureAppPermission('settings-accounts', 'manage'),
      context.params,
      req.json(),
    ]);

    if (!roleId || typeof roleId !== 'string') {
      return NextResponse.json(
        { error: 'roleId es obligatorio.' },
        { status: 400 },
      );
    }

    if (typeof assign !== 'boolean') {
      return NextResponse.json(
        { error: 'assign debe ser booleano.' },
        { status: 400 },
      );
    }

    const memberResult = await resolveDiscordMember(userId);
    if (!memberResult.ok) return memberResult.response;
    const discordUserId = memberResult.profile.discord_user_id;

    const credentialsResult = await resolveDiscordCredentials();
    if (!credentialsResult.ok) return credentialsResult.response;

    const mutationResult = assign
      ? await assignDiscordRole({
          discordUserId,
          discordRoleId: roleId,
          guildId: credentialsResult.guildId,
          botToken: credentialsResult.botToken,
        })
      : await removeDiscordRole({
          discordUserId,
          discordRoleId: roleId,
          guildId: credentialsResult.guildId,
          botToken: credentialsResult.botToken,
        });

    if (!mutationResult.ok) {
      return NextResponse.json(
        { error: mutationResult.error },
        { status: 502 },
      );
    }

    const member = await fetchDiscordGuildMember({
      discordUserId,
      guildId: credentialsResult.guildId,
      botToken: credentialsResult.botToken,
    });

    return NextResponse.json({
      success: true,
      memberRoleIds: member?.roles ?? [],
    });
  } catch (error: any) {
    console.error('[admin.accounts.discord-roles.post]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
