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
  NEXT_PUBLIC_UPLOAD_MAX_FILES = "5",
  NEXT_PUBLIC_UPLOAD_MAX_MB = "8",
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase server env missing");
if (!DISCORD_GUILD_ID) throw new Error("DISCORD_GUILD_ID missing");

type RoleLevel = "gm" | "officer" | "core" | "raider" | "trial";
const ROLE_ORDER: RoleLevel[] = ["trial", "raider", "core", "officer", "gm"];
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function requireMinRole(role: RoleLevel, min: RoleLevel) {
  return ROLE_ORDER.indexOf(role) >= ROLE_ORDER.indexOf(min);
}

function extFromNameOrType(name: string, type: string) {
  const byName = name.split(".").pop()?.toLowerCase();
  if (byName && ["jpg", "jpeg", "png", "webp"].includes(byName)) return byName === "jpeg" ? "jpg" : byName;
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "bin";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.roleLevel as RoleLevel;
  if (!requireMinRole(role, "trial")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { weekIso, files } = body as {
    weekIso?: string;
    files?: { name: string; size: number; type: string }[];
  };

  if (!weekIso || !/^20\d{2}-W\d{2}$/.test(weekIso)) {
    return NextResponse.json({ error: "weekIso inválido (formato YYYY-WW)" }, { status: 422 });
  }
  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: "files requerido" }, { status: 422 });
  }

  const maxFiles = parseInt(NEXT_PUBLIC_UPLOAD_MAX_FILES, 10);
  const maxMb = parseInt(NEXT_PUBLIC_UPLOAD_MAX_MB, 10);
  if (files.length > maxFiles) {
    return NextResponse.json({ error: `Máximo ${maxFiles} archivos` }, { status: 413 });
  }

  for (const f of files) {
    if (!ALLOWED_MIME.has(f.type)) {
      return NextResponse.json({ error: `MIME no permitido: ${f.type}` }, { status: 422 });
    }
    if (f.size > maxMb * 1024 * 1024) {
      return NextResponse.json({ error: `Archivo demasiado grande (> ${maxMb} MB)` }, { status: 413 });
    }
  }

  const guildId = DISCORD_GUILD_ID;
  const discordId = session.user.discordId;

  // Genera rutas y URLs firmadas de subida (Supabase: createSignedUploadUrl)
  const paths: string[] = [];
  const signed: { url: string; token: string; path: string; headers: Record<string, string> }[] = [];

  for (const f of files) {
    const uuid = crypto.randomUUID();
    const ext = extFromNameOrType(f.name || "", f.type || "");
    const path = `${weekIso}/${guildId}/${discordId}/${uuid}.${ext}`;

    // URL firmada para subida
    const { data, error } = await sb.storage.from(STORAGE_BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      return NextResponse.json({ error: `No se pudo firmar ${f.name}`, detail: error?.message }, { status: 500 });
    }
    // El cliente deberá hacer upload con el token usando `uploadToSignedUrl`.
    paths.push(path);
    signed.push({
      url: data.signedUrl,
      token: data.token,
      path,
      headers: { "x-upsert": "false", "Content-Type": f.type },
    });
  }

  return NextResponse.json(
    { bucket: STORAGE_BUCKET, paths, signed, expiresIn: 60 * 15 },
    { status: 200 }
  );
}
