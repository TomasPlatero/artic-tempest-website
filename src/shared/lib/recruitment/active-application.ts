import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ACTIVE_RECRUITMENT_STATUSES } from '@/domains/recruitment/lib/application-status';

type ActiveApplication = {
  id: string;
  userId: string;
  characterName: string;
  characterRealm: string;
  status: string;
  applicantDiscordUserId: string | null;
};

type ResolveResult =
  | { ok: true; application: ActiveApplication }
  | { ok: false; error: string; status: number };

export async function resolveActiveApplicationForDiscordUser(
  discordUserId: string,
): Promise<ResolveResult> {
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .eq('discord_user_id', discordUserId)
    .single();

  if (profileError || !profile) {
    return { ok: false, error: 'Usuario no encontrado', status: 404 };
  }

  const { data: applications, error: appError } = await supabaseAdmin
    .from('recruitment_applications')
    .select('id, user_id, character_name, character_realm, status')
    .eq('user_id', profile.user_id)
    .in('status', [...ACTIVE_RECRUITMENT_STATUSES]);

  if (appError) {
    console.error('[Recruitment:ActiveApp] Query error:', appError);
    return { ok: false, error: 'Error interno del servidor', status: 500 };
  }

  if (!applications || applications.length === 0) {
    return {
      ok: false,
      error: 'No hay solicitudes activas para este usuario',
      status: 404,
    };
  }

  if (applications.length > 1) {
    return {
      ok: false,
      error: 'Múltiples solicitudes activas encontradas',
      status: 409,
    };
  }

  const app = applications[0];

  return {
    ok: true,
    application: {
      id: app.id,
      userId: app.user_id,
      characterName: app.character_name,
      characterRealm: app.character_realm,
      status: app.status,
      applicantDiscordUserId: discordUserId,
    },
  };
}

export async function resolveDiscordUserIdForApplication(
  applicationId: string,
): Promise<string | null> {
  const { data: application } = await supabaseAdmin
    .from('recruitment_applications')
    .select('user_id')
    .eq('id', applicationId)
    .single();

  if (!application) return null;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('discord_user_id')
    .eq('user_id', application.user_id)
    .single();

  return profile?.discord_user_id ?? null;
}
