// src/auth/auth-options.ts
import type { NextAuthOptions, Account, Session } from "next-auth"
import DiscordProvider, { type DiscordProfile } from "next-auth/providers/discord"
import { createClient } from "@supabase/supabase-js"

/** ==== Tipos propios ==== */
type RoleLevel = "gm" | "officer" | "raider"
const ROLE_ORDER: RoleLevel[] = ["raider", "officer", "gm"]

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
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REQUESTED_SCOPES = "identify guilds guilds.members.read",
  DISCORD_GUILD_ID,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env

if (!NEXTAUTH_SECRET) throw new Error("Falta NEXTAUTH_SECRET")
if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) throw new Error("Faltan credenciales de Discord")
if (!DISCORD_GUILD_ID) throw new Error("Falta DISCORD_GUILD_ID")
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Falta configuración de Supabase")

export const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

/** ==== Utilidades ==== */
const rank = (r?: RoleLevel | null) => ROLE_ORDER.indexOf((r ?? "raider") as RoleLevel)
const pickMax = (a?: RoleLevel | null, b?: RoleLevel | null): RoleLevel =>
  rank(b) > rank(a) ? (b as RoleLevel) : ((a ?? "raider") as RoleLevel)

function discordAvatarURL(userId: string, avatar?: string | null) {
  return avatar ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png` : null
}

/** ==== Discord API ==== */
async function fetchDiscordMember(accessToken: string): Promise<DiscordMember | null> {
  const res = await fetch(
    `https://discord.com/api/users/@me/guilds/${DISCORD_GUILD_ID}/member`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  )

  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Discord API ${res.status}: ${text}`)
  }

  const ct = res.headers.get("content-type")
  if (!ct?.includes("application/json")) {
    const text = await res.text()
    throw new Error(`Discord devolvió algo inesperado: ${text.slice(0, 200)}`)
  }

  return res.json() as Promise<DiscordMember>
}

/** ==== DB ==== */
/** Devuelve el mejor rol (gm/officer/raider) basado en los IDs de Discord y la tabla guild_roles */
async function pickTopDiscordRole(
  discordRoleIds: string[]
): Promise<{ roleId: string; level: RoleLevel } | null> {
  if (!discordRoleIds?.length) return null

  const { data, error } = await sb
    .from("guild_roles")
    .select("role_id, role_level")
    .in("role_id", discordRoleIds)

  if (error) throw error
  if (!data?.length) return null

  return data.reduce<{ roleId: string; level: RoleLevel } | null>((best, row) => {
    const lvl = row.role_level as RoleLevel
    return !best || rank(lvl) > rank(best.level)
      ? { roleId: row.role_id as string, level: lvl }
      : best
  }, null)
}

/** ==== NextAuth ==== */
export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
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

      const member = await fetchDiscordMember(accessToken)
      if (!member) return false

      const top = await pickTopDiscordRole(member.roles) // puede ser null

      const userId = member.user.id
      const dProfile = profile as DiscordProfile | null

      const username =
        dProfile?.global_name ?? member.user.username ?? null

      const avatarUrl = discordAvatarURL(
        userId,
        dProfile?.avatar ?? member.user.avatar ?? null
      )

      // Lee lo existente (permite upgrade pero nunca downgrade)
      const { data: existing } = await sb
        .from("profiles")
        .select("id, role, guild_role_id")
        .eq("discord_id", userId)
        .maybeSingle()

      const dbLevel = (existing?.role as RoleLevel | null) ?? null
      const newLevel = top?.level ?? null
      const finalLevel = pickMax(dbLevel, newLevel)

      const finalGuildRoleId =
        newLevel && rank(newLevel) > rank(dbLevel)
          ? top!.roleId
          : existing?.guild_role_id ?? top?.roleId ?? null

      const { data, error } = await sb
        .from("profiles")
        .upsert(
          {
            discord_id: userId,
            username,
            avatar_url: avatarUrl,
            guild_role_id: finalGuildRoleId,
            role: finalLevel,
            roles_cached: member.roles,
            last_role_check: new Date().toISOString(),
          },
          { onConflict: "discord_id" }
        )
        .select("id")
        .single()

      if (error || !data) throw (error ?? new Error("Upsert perfil falló"))

      const meta: GuildboardMeta = {
        profileId: data.id,
        discordId: userId,
        roleLevel: finalLevel,
        username,
        avatarUrl,
        checkedAt: new Date().toISOString(),
      }

      // Anclar metadatos tipados al objeto account sin usar any
      ;(account as Account & { __guildboard?: GuildboardMeta }).__guildboard = meta

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
        roleLevel: (token.roleLevel as RoleLevel) ?? "raider",
      }
      session.checkedAt = (token.checkedAt as string) ?? new Date().toISOString()
      return session as Session
    },
  },
}
