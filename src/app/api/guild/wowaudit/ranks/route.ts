import { NextResponse } from "next/server";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from "@/shared/auth/permissions";
import {
  fetchWowauditRanks,
  normalizeWowauditRankImageUrl,
} from "@/shared/integrations/wowaudit/wowaudit-ranks.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePayload(body: any) {
  const rank = Number(body?.rank);
  const originalRank = body?.originalRank !== undefined ? Number(body.originalRank) : rank;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const color = typeof body?.color === "string" ? body.color.trim() : null;
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : null;
  const rosterSection = body?.rosterSection === "alters" ? "alters" : "main";

  return { rank, originalRank, name, color, imageUrl: normalizeWowauditRankImageUrl(imageUrl), rosterSection };
}

export async function GET() {
  await ensureAppPermission("settings-bnet", "edit");
  const ranks = await fetchWowauditRanks();
  return NextResponse.json({ ranks });
}

export async function POST(request: Request) {
  await ensureAppPermission("settings-bnet", "edit");
  const body = await request.json();
  const { rank, name, color, imageUrl, rosterSection } = normalizePayload(body);

  if (!Number.isInteger(rank) || rank < 0 || !name) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("app_wowaudit_ranks")
    .upsert({ rank, name, color, image_url: imageUrl, roster_section: rosterSection }, { onConflict: "rank" })
    .select("rank, name, color, image_url, roster_section")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "No se pudo crear el rango", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, rank: data });
}

export async function PATCH(request: Request) {
  await ensureAppPermission("settings-bnet", "edit");
  const body = await request.json();
  const { rank, originalRank, name, color, imageUrl, rosterSection } = normalizePayload(body);

  if (!Number.isInteger(originalRank) || originalRank < 0 || !Number.isInteger(rank) || rank < 0 || !name) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (rank !== originalRank) {
    const { data: existingTarget } = await supabaseAdmin
      .from("app_wowaudit_ranks")
      .select("rank")
      .eq("rank", rank)
      .maybeSingle();

    if (existingTarget) {
      return NextResponse.json(
        { error: "Ese orden ya existe. Elige otro número de rank." },
        { status: 409 },
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from("app_wowaudit_ranks")
    .update({ rank, name, color, image_url: imageUrl, roster_section: rosterSection })
    .eq("rank", originalRank)
    .select("rank, name, color, image_url, roster_section")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "No se pudo actualizar el rango", details: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Rango no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true, rank: data });
}

export async function DELETE(request: Request) {
  await ensureAppPermission("settings-bnet", "edit");
  const body = await request.json();
  const rank = Number(body?.rank);

  if (!Number.isInteger(rank) || rank < 0) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("app_wowaudit_ranks")
    .delete()
    .eq("rank", rank);

  if (error) {
    return NextResponse.json(
      { error: "No se pudo borrar el rango", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
