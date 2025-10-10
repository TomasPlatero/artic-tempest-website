// src/app/api/me/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/infrastructure/auth/auth-options"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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
    return NextResponse.json({ error: "No discord id in session" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("username, avatar_url, role")
    .eq("discord_id", discordId)
    .single()

  if (!error && data) {
    return NextResponse.json(
      {
        name: data.username ?? sessUsername ?? "Usuario",
        email: sessEmail ?? "",
        avatar: data.avatar_url ?? sessAvatarUrl ?? "",
        role: data.role ?? "user",
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
      role: sessRoleLevel ?? "user",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  )
}
