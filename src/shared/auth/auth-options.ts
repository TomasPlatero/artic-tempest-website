// src/shared/auth/auth-options.ts
import type { NextAuthOptions, Account, Session } from 'next-auth';
import DiscordProvider, {
  type DiscordProfile,
} from 'next-auth/providers/discord';
import { createClient } from '@supabase/supabase-js';
import { getGuildCredentials } from '@/shared/auth/credentials';

/** ==== Tipos propios ==== */
type RoleLevel = 'gm' | 'officer' | 'raider' | 'member' | 'invitado';
const ROLE_ORDER: RoleLevel[] = [
  'invitado',
  'member',
  'raider',
  'officer',
  'gm',
];

type GuildboardMeta = {
  profileId: string;
  discordId: string;
  roleLevel: RoleLevel;
  username: string | null;
  avatarUrl: string | null;
  checkedAt: string;
};

type DiscordMember = {
  user: {
    id: string;
    username?: string;
    global_name?: string;
    avatar?: string | null;
  };
  roles: string[];
};

/** ==== ENV ==== */
const {
  NEXTAUTH_SECRET,
  DISCORD_CLIENT_ID = '',
  DISCORD_CLIENT_SECRET = '',
  DISCORD_REQUESTED_SCOPES = 'identify guilds guilds.members.read email',
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_SERVICE_ROLE,
} = process.env;

if (!NEXTAUTH_SECRET) throw new Error('Falta NEXTAUTH_SECRET');

const finalSupabaseUrl = NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
const finalSupabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE;

if (!finalSupabaseUrl || !finalSupabaseKey) {
  console.error('❌ Error: Falta configuración de Supabase (URL o Key)');
}

export const supabaseAdmin = createClient(
  finalSupabaseUrl || '',
  finalSupabaseKey || '',
  {
    auth: { persistSession: false },
  },
);

/** ==== Utilidades ==== */
const rank = (r?: RoleLevel | null) =>
  ROLE_ORDER.indexOf((r ?? 'invitado') as RoleLevel);

function discordAvatarURL(userId: string, avatar?: string | null) {
  return avatar
    ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png`
    : null;
}

/** ==== DB / Helpers ==== */
async function fetchDiscordMember(
  accessToken: string,
  guildId: string,
): Promise<DiscordMember | null> {
  if (!guildId) return null;
  const url = `https://discord.com/api/users/@me/guilds/${guildId}/member`;
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return null;
    return (await response.json()) as DiscordMember;
  } catch (error) {
    console.error('Error fetching Discord member', error);
    return null;
  }
}

async function pickTopDiscordRole(
  roleIds: string[],
): Promise<{ roleId: string; level: RoleLevel } | null> {
  if (!roleIds || roleIds.length === 0) return null;

  const { data } = await supabaseAdmin
    .from('discord_roles')
    .select('role_id, level')
    .in('role_id', roleIds);
  if (!data || data.length === 0) return null;

  const sorted = data.sort(
    (a, b) => rank(b.level as RoleLevel) - rank(a.level as RoleLevel),
  );
  return { roleId: sorted[0].role_id, level: sorted[0].level as RoleLevel };
}

const pickMax = (a: RoleLevel | null, b: RoleLevel | null): RoleLevel => {
  const ra = rank(a);
  const rb = rank(b);
  return ra >= rb ? (a ?? 'invitado') : (b ?? 'invitado');
};

/** ==== NextAuth ==== */
export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days for better public experience
  },
  providers: [
    DiscordProvider({
      clientId: DISCORD_CLIENT_ID,
      clientSecret: DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: DISCORD_REQUESTED_SCOPES } },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      const accessToken = account?.access_token;
      const refreshToken = account?.refresh_token;
      if (!accessToken) return false;

      const userId = profile?.sub ?? (profile as any)?.id;
      const dProfile = profile as DiscordProfile | null;

      const username = dProfile?.global_name ?? dProfile?.username ?? null;
      const avatarUrl = discordAvatarURL(userId, dProfile?.avatar ?? null);

      // 1. Basic Membership Check via Discord
      const creds = await getGuildCredentials();
      const member = await fetchDiscordMember(
        accessToken,
        creds.discord_guild_id,
      );
      const topRole = member ? await pickTopDiscordRole(member.roles) : null;

      // 2. Load existing profile
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('user_id, role_level')
        .eq('discord_user_id', userId)
        .maybeSingle();

      const dbLevel = (existing?.role_level as RoleLevel | null) ?? 'invitado';

      // 3. Initial Provisioning Logic
      // If the user is new, we use the Discord-to-App mappings (discordLevel).
      // If the user already exists, the App's role_level is the absolute source of truth (Manual priority).
      const discordLevel: RoleLevel =
        topRole?.level ?? (member ? 'member' : 'invitado');
      let finalLevel: RoleLevel = existing ? dbLevel : discordLevel;

      // 4. Save / Update Profile
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            discord_user_id: userId,
            discord_username: username,
            discord_avatar: avatarUrl,
            discord_refresh_token: refreshToken, // Save for Cron
            role_level: finalLevel,
            last_role_check: new Date().toISOString(),
          },
          { onConflict: 'discord_user_id' },
        )
        .select('user_id')
        .single();

      if (error || !data) throw error ?? new Error('Upsert perfil falló');

      const meta: GuildboardMeta = {
        profileId: data.user_id,
        discordId: userId,
        roleLevel: finalLevel,
        username,
        avatarUrl,
        checkedAt: new Date().toISOString(),
      };

      // Tipado ad-hoc del meta
      (account as any).__guildboard = meta;

      return true;
    },

    async jwt({ token, account, trigger }) {
      // Initial sign in
      const meta = (
        account as (Account & { __guildboard?: GuildboardMeta }) | null
      )?.__guildboard;
      if (meta) {
        token.userId = meta.profileId;
        token.discordId = meta.discordId;
        token.roleLevel = meta.roleLevel;
        token.username = meta.username;
        token.avatarUrl = meta.avatarUrl;
        token.checkedAt = meta.checkedAt;
        return token;
      }

      // Periodically refresh role from DB (e.g. if more than 5 minutes have passed or on every check)
      // Since this runs in the edge or server-side, a quick DB fetch is acceptable to keep roles in sync
      try {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('role_level')
          .eq('user_id', token.userId)
          .maybeSingle();

        if (profile) {
          token.roleLevel = profile.role_level;
        }
      } catch (error) {
        console.error('[JWT Callback] Error refreshing role:', error);
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: (token.userId as string) ?? '',
        discordId: (token.discordId as string) ?? '',
        username: (token.username as string | null) ?? null,
        avatarUrl: (token.avatarUrl as string | null) ?? null,
        roleLevel: (token.roleLevel as RoleLevel) ?? 'member',
      };
      session.checkedAt =
        (token.checkedAt as string) ?? new Date().toISOString();
      return session as Session;
    },
  },
};
