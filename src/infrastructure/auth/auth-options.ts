// src/auth/auth-options.ts
import type { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { createClient } from "@supabase/supabase-js"

type RoleLevel = "gm" | "officer" | "raider"
const ROLE_ORDER: RoleLevel[] = ["raider", "officer", "gm"]

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

const rank = (r?: RoleLevel | null) => ROLE_ORDER.indexOf((r ?? "raider") as RoleLevel)
const pickMax = (a?: RoleLevel | null, b?: RoleLevel | null): RoleLevel =>
  rank(b) > rank(a) ? (b as RoleLevel) : ((a ?? "raider") as RoleLevel)

async function fetchDiscordMember(accessToken: string) {
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

  return res.json() as Promise<{
    user: { id: string; username?: string; global_name?: string; avatar?: string }
    roles: string[]
  }>
}


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

  return data.reduce(
    (best, row) => {
      const lvl = row.role_level as RoleLevel
      return !best || rank(lvl) > rank(best.level)
        ? { roleId: row.role_id as string, level: lvl }
        : best
    },
    null as { roleId: string; level: RoleLevel } | null
  )
}

const discordAvatarURL = (userId: string, avatar?: string | null) =>
  avatar ? `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png` : null

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
      const username =
        (profile as any)?.global_name ?? member.user.username ?? null
      const avatarUrl =
        discordAvatarURL(userId, (profile as any)?.avatar ?? member.user.avatar ?? null)

      // Lee lo existente (para permitir upgrade pero nunca downgrade)
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

      if (error || !data) throw error ?? new Error("Upsert perfil falló")

      ;(account as any).__guildboard = {
        profileId: data.id,
        discordId: userId,
        roleLevel: finalLevel,
        username,
        avatarUrl,
        checkedAt: new Date().toISOString(),
      }

      return true
    },

    async jwt({ token, account }) {
      const meta = (account as any)?.__guildboard
      if (meta) {
        token.userId = meta.profileId
        token.discordId = meta.discordId
        token.roleLevel = meta.roleLevel
        token.username = meta.username ?? null
        token.avatarUrl = meta.avatarUrl ?? null
        token.checkedAt = meta.checkedAt
      }
      return token
    },

    async session({ session, token }) {
      // @ts-ignore (extensión propia)
      session.user = {
        id: token.userId as string,
        discordId: token.discordId as string,
        username: (token.username as string) ?? null,
        avatarUrl: (token.avatarUrl as string) ?? null,
        roleLevel: (token.roleLevel as RoleLevel) ?? "raider",
      }
      // @ts-ignore
      session.checkedAt = token.checkedAt as string
      return session
    },
  },
}
