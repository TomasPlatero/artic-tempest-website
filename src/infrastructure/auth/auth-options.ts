// src/auth/auth-options.ts
import type { NextAuthOptions, Account, Session } from "next-auth"
import DiscordProvider, { type DiscordProfile } from "next-auth/providers/discord"
import { createClient } from "@supabase/supabase-js"
import { getGuildCredentials } from "@/infrastructure/auth/credentials"

/** ==== Tipos propios ==== */
type RoleLevel = "gm" | "officer" | "raider" | "member"
const ROLE_ORDER: RoleLevel[] = ["member", "raider", "officer", "gm"]

type GuildboardMeta = {
  profileId: string
  discordId: string
  roleLevel: RoleLevel
  username: string | null
  avatarUrl: string | null
  checkedAt: string
}

type DiscordMember = {
  user: { id: string; username?: string; global_name?: string; avatar?: string | null }
  roles: string[]
}

/** ==== ENV ==== */
const {
  NEXTAUTH_SECRET,
  DISCORD_CLIENT_ID = "",
  DISCORD_CLIENT_SECRET = "",
  DISCORD_REQUESTED_SCOPES = "identify guilds guilds.members.read",
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env

if (!NEXTAUTH_SECRET) throw new Error("Falta NEXTAUTH_SECRET")
if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Falta configuración de Supabase")

export const sb = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

/** ==== Utilidades ==== */
const rank = (r?: RoleLevel | null) => ROLE_ORDER.indexOf((r ?? "member") as RoleLevel)

function discordAvatarURL(userId: string, avatar?: string | null) {
  return avatar ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png` : null
}

/** ==== DB / Helpers ==== */
async function fetchDiscordMember(accessToken: string, guildId: string): Promise<DiscordMember | null> {
  if (!guildId) return null
  const url = `https://discord.com/api/users/@me/guilds/${guildId}/member`
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!response.ok) return null
    return (await response.json()) as DiscordMember
  } catch (error) {
    console.error("Error fetching Discord member", error)
    return null
  }
}

async function pickTopDiscordRole(roleIds: string[]): Promise<{ roleId: string; level: RoleLevel } | null> {
  if (!roleIds || roleIds.length === 0) return null

  const { data } = await sb.from("discord_roles").select("role_id, level").in("role_id", roleIds)
  if (!data || data.length === 0) return null

  const sorted = data.sort((a, b) => rank(b.level as RoleLevel) - rank(a.level as RoleLevel))
  return { roleId: sorted[0].role_id, level: sorted[0].level as RoleLevel }
}

const pickMax = (a: RoleLevel | null, b: RoleLevel | null): RoleLevel => {
  const ra = rank(a)
  const rb = rank(b)
  return ra >= rb ? (a ?? "member") : (b ?? "member")
}

/** ==== NextAuth ==== */
export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours (LOPD/GDPR compliance for strict necessity)
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
      const accessToken = account?.access_token
      if (!accessToken) return false

      const userId = profile?.sub ?? (profile as any)?.id
      const dProfile = profile as DiscordProfile | null

      const username =
        dProfile?.global_name ?? dProfile?.username ?? null

      const avatarUrl = discordAvatarURL(
        userId,
        dProfile?.avatar ?? null
      )

      // Read Discord Guild ID from DB (with env fallback)
      const creds = await getGuildCredentials()
      const member = await fetchDiscordMember(accessToken, creds.discord_guild_id)
      const topRole = member ? await pickTopDiscordRole(member.roles) : null

      // Lee el rol persistente de la BD.
      const { data: existing } = await sb
        .from("profiles")
        .select("user_id, role_level")
        .eq("discord_user_id", userId)
        .maybeSingle()

      const dbLevel = (existing?.role_level as RoleLevel | null) ?? "member"
      const newLevel = topRole?.level ?? "member"
      const finalLevel = pickMax(dbLevel, newLevel)

      const { data, error } = await sb
        .from("profiles")
        .upsert(
          {
            discord_user_id: userId,
            discord_username: username,
            discord_avatar: avatarUrl,
            role_level: finalLevel,
            last_role_check: new Date().toISOString(),
          },
          { onConflict: "discord_user_id" }
        )
        .select("user_id")
        .single()

      if (error || !data) throw (error ?? new Error("Upsert perfil falló"))

      const meta: GuildboardMeta = {
        profileId: data.user_id,
        discordId: userId,
        roleLevel: dbLevel,
        username,
        avatarUrl,
        checkedAt: new Date().toISOString(),
      }

        // Anclar metadatos tipados al objeto account sin usar any
        ; (account as Account & { __guildboard?: GuildboardMeta }).__guildboard = meta

      return true
    },

    async jwt({ token, account }) {
      const meta = (account as (Account & { __guildboard?: GuildboardMeta }) | null)?.__guildboard
      if (meta) {
        token.userId = meta.profileId
        token.discordId = meta.discordId
        token.roleLevel = meta.roleLevel
        token.username = meta.username
        token.avatarUrl = meta.avatarUrl
        token.checkedAt = meta.checkedAt
      }
      return token
    },

    async session({ session, token }) {
      session.user = {
        id: (token.userId as string) ?? "",
        discordId: (token.discordId as string) ?? "",
        username: (token.username as string | null) ?? null,
        avatarUrl: (token.avatarUrl as string | null) ?? null,
        roleLevel: (token.roleLevel as RoleLevel) ?? "member",
      }
      session.checkedAt = (token.checkedAt as string) ?? new Date().toISOString()
      return session as Session
    },
  },
}
