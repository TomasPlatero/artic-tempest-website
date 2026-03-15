// src/domains/membership/lib/sync-engine.ts
import { supabaseAdmin } from '@/shared/auth/auth-options';
import { getGuildCredentials } from '@/shared/auth/credentials';
import { toSlug } from '@/shared/integrations/bnet/bnet-client';
import { RoleLevel } from '@/shared/types/auth';

export type SyncResult = {
  discord: boolean;
  bnet: boolean;
  oldRole: RoleLevel;
  newRole: RoleLevel;
  error?: string;
};

/**
 * Refresca un token de Discord si es necesario
 */
async function refreshDiscordToken(refreshToken: string) {
  const res = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!res.ok) throw new Error(`Discord Refresh Error: ${res.status}`);
  return await res.json();
}

/**
 * Verifica las membresías y roles de Discord
 */
async function getDiscordMemberData(
  accessToken: string,
  guildId: string,
): Promise<{ isMember: boolean; roles: string[] }> {
  try {
    const res = await fetch(
      `https://discord.com/api/users/@me/guilds/${guildId}/member`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!res.ok) return { isMember: false, roles: [] };

    const data = await res.json();
    return { isMember: true, roles: data.roles || [] };
  } catch (e) {
    console.error("Error fetching Discord member data:", e);
    return { isMember: false, roles: [] };
  }
}

/**
 * Verifica si alguno de los personajes de Bnet del usuario está en la hermandad
 */
async function checkBnetMembership(userId: string): Promise<boolean> {
  // 1. Obtener personajes vinculados del usuario (de nuestra tabla bnet_characters)
  const { data: bnetChars } = await supabaseAdmin
    .from('bnet_characters')
    .select('name, realm')
    .eq('user_id', userId);

  if (!bnetChars || bnetChars.length === 0) return false;

  // 2. Consultar si alguno de esos personajes está en el Roster (guild_members)
  // Nota: Podríamos hacer un JOIN o un rpc, pero para simplicidad inmediata:
  const { count } = await supabaseAdmin
    .from('guild_members')
    .select('*', { count: 'exact', head: true })
    .in(
      'name',
      bnetChars.map((c) => c.name),
    )
    .in(
      'realm',
      bnetChars.map((c) => c.realm),
    );

  return (count ?? 0) > 0;
}

/**
 * Ejecuta la verificación completa para un usuario
 */
export async function verifyUser(userId: string): Promise<SyncResult> {
  const { data: profile, error: dbError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (dbError || !profile) throw new Error('Perfil no encontrado');

  const creds = await getGuildCredentials();
  let discordValid = false;
  let discordRoles: string[] = [];
  let bnetValid = false;
  let newRefreshToken = profile.discord_refresh_token;

  // --- CHECK DISCORD ---
  if (profile.discord_refresh_token) {
    try {
      const refreshed = await refreshDiscordToken(
        profile.discord_refresh_token,
      );
      newRefreshToken = refreshed.refresh_token;

      const discordData = await getDiscordMemberData(
        refreshed.access_token,
        creds.discord_guild_id,
      );

      discordValid = discordData.isMember;
      discordRoles = discordData.roles;
    } catch (e) {
      console.error(`Verification Discord fail for ${userId}:`, e);
    }
  }

  // --- CHECK BNET ---
  try {
    bnetValid = await checkBnetMembership(userId);
  } catch (e) {
    console.error(`Verification Bnet fail for ${userId}:`, e);
  }

  const oldRole = profile.role_level as RoleLevel;
  let newRole: RoleLevel = "invitado";

  const isActuallyInGuild = discordValid || bnetValid;

  if (isActuallyInGuild) {
    // Definimos prioridad de roles de la App
    const rolePriority: Record<RoleLevel, number> = {
      gm: 5,
      officer: 4,
      raider: 3,
      member: 2,
      invitado: 1,
    };

    // 1. Empezamos con el rol básico si están en Discord o tienen Bnet vinculado
    newRole = "member";

    // 2. Si hay roles de Discord, buscamos si alguno mapea a un nivel superior
    if (discordRoles.length > 0) {
      const { data: mappings } = await supabaseAdmin
        .from("discord_roles")
        .select("role_id, level");

      if (mappings && mappings.length > 0) {
        let highestMappedLevel: RoleLevel = "member";

        for (const roleId of discordRoles) {
          const mapping = mappings.find((m) => m.role_id === roleId);
          if (mapping) {
            const mappedLevel = mapping.level as RoleLevel;
            if (rolePriority[mappedLevel] > rolePriority[highestMappedLevel]) {
              highestMappedLevel = mappedLevel;
            }
          }
        }
        newRole = highestMappedLevel;
      }
    }
  }

  // --- ACTUALIZAR PERFIL ---
  await supabaseAdmin
    .from('profiles')
    .update({
      role_level: newRole,
      discord_refresh_token: newRefreshToken,
      last_verification_check: new Date().toISOString(),
      vertex_sync_at: new Date().toISOString(), // Optional tracking field if exists
      verification_status: { discord: discordValid, bnet: bnetValid, discordRoles },
      tokens_invalidated: !newRefreshToken,
    })
    .eq('user_id', userId);

  // --- LOG ---
  await supabaseAdmin.from('verification_logs').insert({
    user_id: userId,
    old_role: oldRole,
    new_role: newRole,
    method: 'sync_engine',
    results: { discord: discordValid, bnet: bnetValid },
    status: 'success',
  });

  return { discord: discordValid, bnet: bnetValid, oldRole, newRole };
}

/**
 * Procesa un lote de usuarios (Cron Job)
 */
export async function processVerificationBatch(limit: number = 20) {
  // Seleccionamos usuarios que no han sido verificados recientemente
  const { data: users, error } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .order('last_verification_check', { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error || !users) return [];

  const results = [];
  for (const user of users) {
    try {
      const res = await verifyUser(user.user_id);
      results.push({ userId: user.user_id, ...res });
    } catch (e) {
      results.push({ userId: user.user_id, error: String(e) });
    }
  }
  return results;
}
