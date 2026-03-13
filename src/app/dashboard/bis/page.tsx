// src/app/dashboard/bis/page.tsx
import type React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options";
import { getAppPermission } from "@/shared/auth/permissions";

import { AppSidebar } from "@/shared/layout/app-sidebar";
import { SiteHeader } from "@/shared/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/shared/components/sidebar";
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
  // 1. Fetch visible ranks with fallback
  let { data: rawRanks, error: ranksError } = await supabaseAdmin
    .from("guild_ranks")
    .select("rank, is_visible");

  // Fallback if table doesn't exist or cache is stale
  if (
    ranksError &&
    (ranksError.code === "PGRST204" ||
      ranksError.message.includes("schema cache"))
  ) {
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

  // Simplified visibility logic matching Roster app behavior:
  // Default to true for all ranks unless explicitly set to false in the database.
  const visibilityMap: Record<number, boolean> = {};
  for (let i = 0; i <= 9; i++) visibilityMap[i] = true;
  rawRanks?.forEach((r) => {
    visibilityMap[Number(r.rank)] = r.is_visible;
  });

  if (forceFullRoster) {
    const { data: members } = await supabaseAdmin
      .from("guild_members")
      .select(
        "id, character_name, realm_slug, class_id, rank, role, bis_dps_gain, bis_pct_gain, spec_name, spec_id",
      )
      .order("rank", { ascending: true })
      .order("character_name", { ascending: true });

    const filteredMembers = (members || []).filter(
      (m) => visibilityMap[Number(m.rank)] !== false,
    );
    return {
      eligibleMembers: [] as EligibleMember[], // We'll find user's own chars in the frontend or just send everything
      allMembers: filteredMembers as EligibleMember[],
    };
  }

  // Step 1: Get this user's linked characters
  const { data: bnetChars } = await supabaseAdmin
    .from("bnet_characters")
    .select("id, name, realm_slug")
    .eq("user_id", userId);

  const linkedCharacters = new Set(
    (bnetChars || []).map((c: any) => `${c.name}::${c.realm_slug}`),
  );

  if (linkedCharacters.size === 0) {
    return {
      eligibleMembers: [] as EligibleMember[],
      allMembers: [] as EligibleMember[],
    };
  }

  const { data: members } = await supabaseAdmin
    .from("guild_members")
    .select(
      "id, character_name, realm_slug, class_id, rank, role, bis_dps_gain, bis_pct_gain, spec_name, spec_id, profile_id, bnet_character_id",
    )
    .order("rank", { ascending: true });

  const filteredMembers = (members || []).filter((m: any) => {
    if (visibilityMap[Number(m.rank)] === false) return false;
    if (m.profile_id === userId) return true;
    if (
      m.bnet_character_id &&
      (bnetChars || []).some((c: any) => c.id === m.bnet_character_id)
    )
      return true;
    return linkedCharacters.has(`${m.character_name}::${m.realm_slug}`);
  });

  return {
    eligibleMembers: filteredMembers as EligibleMember[],
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

  const style = {
    "--sidebar-width": "calc(var(--spacing) * 72)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
          <BisClient
            eligibleMembers={eligibleMembers}
            allMembers={allMembers}
            canEdit={canEdit}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
