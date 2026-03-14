// src/app/dashboard/bis/page.tsx
import type React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options";
import { getAppPermission } from "@/shared/auth/permissions";

import { BisClient } from "@/domains/bis/components/bis-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EligibleMember = {
  id: string;
  character_name: string;
  realm_slug: string;
  class_id: number;
  rank: number;
  role: string | null;
  bis_dps_gain: number | null;
  bis_pct_gain: string | null;
  spec_name: string;
  spec_id: number | null;
};

async function getBisData(userId: string, forceFullRoster = false) {
  // ... (keeping implementation identical)
  let { data: rawRanks, error: ranksError } = await supabaseAdmin
    .from("guild_ranks")
    .select("rank, is_visible");

  if (ranksError && (ranksError.code === "PGRST204" || ranksError.message.includes("schema cache"))) {
    const { data: fallbackRanks } = await supabaseAdmin
      .from("guild_rank_visibility")
      .select("rank_id, is_visible");

    if (fallbackRanks) {
      rawRanks = fallbackRanks.map((r) => ({
        rank: (r as any).rank_id,
        is_visible: r.is_visible,
      }));
    }
  }

  const visibilityMap: Record<number, boolean> = {};
  for (let i = 0; i <= 9; i++) visibilityMap[i] = true;
  rawRanks?.forEach((r) => {
    visibilityMap[Number(r.rank)] = r.is_visible;
  });

  const { data: bnetChars } = await supabaseAdmin
    .from("bnet_characters")
    .select("id, name, realm_slug")
    .eq("user_id", userId);

  const linkedCharacterKeys = new Set(
    (bnetChars || []).map((c: any) => `${c.name}::${c.realm_slug}`)
  );
  const linkedBnetIds = new Set((bnetChars || []).map((c: any) => c.id));

  const { data: members, error: membersError } = await supabaseAdmin
    .from("guild_members")
    .select(
      "id, character_name, realm_slug, class_id, rank, role, bis_dps_gain, bis_pct_gain, spec_name, spec_id, profile_id, bnet_character_id"
    )
    .order("rank", { ascending: true })
    .order("character_name", { ascending: true });

  if (membersError) throw membersError;

  const allVisibleMembers = (members || []).filter(
    (m) => visibilityMap[Number(m.rank)] !== false
  );

  const eligibleMembers = allVisibleMembers.filter((m: any) => {
    if (m.profile_id === userId) return true;
    if (m.bnet_character_id && linkedBnetIds.has(m.bnet_character_id)) return true;
    return linkedCharacterKeys.has(`${m.character_name}::${m.realm_slug}`);
  });

  if (forceFullRoster) {
    return {
      eligibleMembers: eligibleMembers as EligibleMember[],
      allMembers: allVisibleMembers as EligibleMember[],
    };
  }

  return {
    eligibleMembers: eligibleMembers as EligibleMember[],
    allMembers: [] as EligibleMember[],
  };
}

export default async function BisPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  const userId = session.user.id;
  const roleLevel = session.user?.roleLevel ?? "member";
  const { canView, canEdit } = await getAppPermission(roleLevel, "bis");

  if (!canView) {
    redirect("/dashboard");
  }

  const { eligibleMembers, allMembers } = await getBisData(userId, canEdit);

  return (
    <div className="flex flex-1 flex-col py-6 px-4 lg:px-6 w-full animate-in fade-in duration-500">
      <BisClient
        eligibleMembers={eligibleMembers}
        allMembers={allMembers}
        canEdit={canEdit}
      />
    </div>
  );
}
