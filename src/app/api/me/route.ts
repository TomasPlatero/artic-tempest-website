// src/app/api/me/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const {
    user: {
      discordId,
      username: sessUsername,
      avatarUrl: sessAvatarUrl,
      roleLevel: sessRoleLevel,
      email: sessEmail,
    },
  } = session

  if (!discordId) {
    return NextResponse.json({ error: "Falta el ID de Discord en la sesión" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from("profiles")
    .select("discord_username, discord_avatar, role_level")
    .eq("discord_user_id", discordId)
    .single()

  if (!error && data) {
    return NextResponse.json(
      {
        name: data.discord_username ?? sessUsername ?? "Usuario",
        email: sessEmail ?? "",
        avatar: data.discord_avatar ?? sessAvatarUrl ?? "",
        role: data.role_level ?? "raider",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    )
  }

  // Fallback a lo que venga en la sesión (primer login, etc.)
  return NextResponse.json(
    {
      name: sessUsername ?? "Usuario",
      email: sessEmail ?? "",
      avatar: sessAvatarUrl ?? "",
      role: sessRoleLevel ?? "raider",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  )
}
