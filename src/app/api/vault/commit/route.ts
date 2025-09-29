import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  STORAGE_BUCKET = "guild-vault",
  DISCORD_GUILD_ID,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase server env missing");
if (!DISCORD_GUILD_ID) throw new Error("DISCORD_GUILD_ID missing");

type RoleLevel = "gm" | "officer" | "core" | "raider" | "trial";
const ROLE_ORDER: RoleLevel[] = ["trial", "raider", "core", "officer", "gm"];
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function requireMinRole(role: RoleLevel, min: RoleLevel) {
  return ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(min);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.roleLevel as RoleLevel;
  if (!requireMinRole(role, "trial")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { weekIso, paths } = body as { weekIso?: string; paths?: string[] };
  if (!weekIso || !/^20\d{2}-W\d{2}$/.test(weekIso)) {
    return NextResponse.json({ error: "weekIso inválido (YYYY-WW)" }, { status: 422 });
  }
  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ error: "paths requerido" }, { status: 422 });
  }

  const guildId = DISCORD_GUILD_ID!;
  const discordId = session.user.discordId;

  // Valida prefijo de todas las rutas y que correspondan al usuario
  const expectedPrefix = `${weekIso}/${guildId}/${discordId}/`;
  for (const p of paths) {
    if (!p.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: `Ruta inválida para este usuario: ${p}` }, { status: 422 });
    }
  }

  // Busca el profile.id
  const { data: prof, error: eProf } = await sb
    .from("profiles")
    .select("id")
    .eq("discord_id", discordId)
    .single();
  if (eProf || !prof) return NextResponse.json({ error: "Perfil no encontrado" }, { status: 500 });

  // Inserta/actualiza entrada semanal (unique user_id+week_iso)
  const filesPayload = paths.map((p) => ({
    path: p,
    uploadedAt: new Date().toISOString(),
    name: p.split("/").pop(),
  }));

  const { data, error } = await sb
    .from("vault_entries")
    .upsert(
      {
        user_id: prof.id,
        week_iso: weekIso,
        files: filesPayload,
        status: "pending",
      },
      { onConflict: "user_id,week_iso" }
    )
    .select("id,status")
    .single();

  if (error || !data) {
    const isConflict = (error as any)?.code === "23505";
    return NextResponse.json(
      { error: "No se pudo registrar", detail: error?.message },
      { status: isConflict ? 409 : 500 }
    );
  }

  return NextResponse.json({ entryId: data.id, status: data.status }, { status: 201 });
}
