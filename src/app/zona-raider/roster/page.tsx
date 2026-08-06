// src/app/zona-raider/roster/page.tsx
import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { getAppPermission } from "@/shared/auth/permissions";
import { getAuthzSnapshot } from "@/shared/auth/authz";

import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { RosterClient } from "@/domains/roster/components/roster-client";
import { RAIDER_PAGE_FADE_IN_CLASSES } from "@/shared/components/raider-motion";
import { fetchWowauditRanks } from "@/shared/integrations/wowaudit/wowaudit-ranks.server";

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Roster | Zona Raider",
  description: "Gestión del roster de raiders de Artic Tempest.",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_RACE_NAMES: Record<number, string> = {
  1: "Humano",
  2: "Orco",
  3: "Enano",
  4: "Elfo de la noche",
  5: "No-Muerto",
  6: "Tauren",
  7: "Gnomo",
  8: "Trol",
  9: "Goblin",
  10: "Elfo de sangre",
  11: "Draenei",
  22: "Huargen",
  23: "Pandaren (Neutral)",
  24: "Pandaren (Alianza)",
  25: "Pandaren (Horda)",
  27: "Nocheterna",
  28: "Tauren de Monte Alto",
  29: "Elfo del Vacío",
  30: "Draenei Forjaz de Luz",
  31: "Trol Zandalari",
  32: "Humano de Kul Tiras",
  34: "Enano Hierro Negro",
  35: "Vulpera",
  36: "Orco Mag'har",
  37: "Mecagnomo",
  70: "Dracthyr",
};

async function getRoster() {
  const [membersRes, wowauditRanks, constantsRes] = await Promise.all([
    supabaseAdmin
      .from("guild_members")
      .select(
        "id, character_name, realm_slug, realm_name, class_id, race_id, level, rank, synced_at, note, role",
      )
      .order("rank", { ascending: true })
      .order("character_name", { ascending: true }) as any,
    fetchWowauditRanks(),
    supabaseAdmin
      .from("game_constants")
      .select("category, key, value, metadata") as any,
  ]);

  const data = membersRes.data;
  const rawRanks = wowauditRanks;
  const constants = constantsRes.data;

  const rankColors: (string | null)[] = [];
  const rankNames: string[] = [];
  const rankImages: (string | null)[] = [];
  const rankSections: Array<"main" | "alters" | undefined> = [];
  const rankOptions = rawRanks ?? [];

  for (const rank of rawRanks ?? []) {
    rankNames[rank.rank] = rank.name;
    rankColors[rank.rank] = rank.color;
    rankImages[rank.rank] = rank.image_url;
    rankSections[rank.rank] = rank.roster_section;
  }

  const classNames: Record<number, string> = {};
  const classColors: Record<number, string> = {};
  const classRoleMapping: Record<number, string> = {};
  const raceNames: Record<number, string> = {};

  constants?.forEach((c: any) => {
    if (c.category === "wow_class") {
      classNames[Number(c.key)] = c.value;
      if (c.metadata?.color) classColors[Number(c.key)] = c.metadata.color;
    }
    if (c.category === "class_role") {
      classRoleMapping[Number(c.key)] = c.value;
    }
    if (c.category === "wow_race") {
      raceNames[Number(c.key)] = c.value;
    }
  });

  if (Object.keys(raceNames).length === 0) {
    Object.assign(raceNames, DEFAULT_RACE_NAMES);
  } else {
    for (const [key, label] of Object.entries(DEFAULT_RACE_NAMES)) {
      const numericKey = Number(key);
      if (!raceNames[numericKey]) {
        raceNames[numericKey] = label;
      }
    }
  }

  return {
    roster: data ?? [],
    rankNames,
    rankOptions,
    rankColors,
    rankImages,
    rankSections,
    classNames,
    classColors,
    classRoleMapping,
    raceNames,
  };
}

export default async function RosterPage() {
  const session = await getCachedServerSession();
  if (!session) {
    redirect("/");
  }

  const authz = await getAuthzSnapshot(session);
  const roleLevel = authz.roleSlug ?? session.user?.roleLevel ?? "member";
  const { canView, canEdit } = await getAppPermission(roleLevel, "roster");

  if (!canView) {
    redirect("/zona-raider");
  }

  const {
    roster,
    rankNames,
    rankOptions,
    rankColors,
    rankImages,
    rankSections,
    classNames,
    classColors,
    classRoleMapping,
    raceNames,
  } = await getRoster();

  return (
    <div
      className={`flex w-full flex-1 flex-col gap-6 ${RAIDER_PAGE_FADE_IN_CLASSES}`}
      data-tour-step="roster-page"
    >
      <AdminPageHeader
        title="GESTION DE ROSTER"
        description={`Explora y filtra los miembros actuales de la hermandad (${roster.length} personajes).`}
      />

      <RosterClient
        members={roster}
        canEdit={canEdit}
        roleLevel={roleLevel}
        rankNames={rankNames}
        rankOptions={rankOptions}
        rankColors={rankColors}
        rankImages={rankImages}
        rankSections={rankSections}
        classNames={classNames}
        classColors={classColors}
        classRoleMapping={classRoleMapping}
        raceNames={raceNames}
      />
    </div>
  );
}
