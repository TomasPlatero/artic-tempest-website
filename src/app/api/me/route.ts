// src/app/api/me/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/infrastructure/auth/auth-options" // según tu estructura
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // SIEMPRE usa las server keys aquí
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const discordId = (session.user as any).discordId as string | undefined
  if (!discordId) {
    return NextResponse.json({ error: "No discord id in session" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("username, avatar_url, role")
    .eq("discord_id", discordId)
    .single()

  // SI HAY BD -> manda siempre el rol de BD (gm/officer/raider_core/raider/trial)
  if (!error && data) {
    return NextResponse.json(
      {
        name: data.username ?? (session.user as any).username ?? "Usuario",
        email: (session.user as any).email ?? "",
        avatar: data.avatar_url ?? (session.user as any).avatarUrl ?? "",
        role: data.role ?? "user",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    )
  }

  // Fallback a lo que venga en la sesión (p.ej. primer login)
  return NextResponse.json(
    {
      name: (session.user as any).username ?? "Usuario",
      email: (session.user as any).email ?? "",
      avatar: (session.user as any).avatarUrl ?? "",
      role: (session.user as any).roleLevel ?? "user",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  )
}
