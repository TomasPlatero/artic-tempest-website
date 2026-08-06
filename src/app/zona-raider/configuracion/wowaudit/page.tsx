import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { SettingsWowauditClient } from "@/domains/settings/components/settings-wowaudit";
import React from "react";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";
import {
  fetchWowauditRanks,
  fetchWowauditRankImages,
} from "@/shared/integrations/wowaudit/wowaudit-ranks.server";

export const runtime = "nodejs";

async function getWowauditData() {
  const [{ data: settings }, { count: memberCount }, { data: lastSynced }, { data: wowauditRow }, ranks, rankImages] =
    await Promise.all([
      supabaseAdmin
        .from("settings")
        .select("guild_id")
        .eq("id", 1)
        .maybeSingle(),
      supabaseAdmin
        .from("guild_members")
        .select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("guild_members")
        .select("synced_at")
        .order("synced_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
      .from("app_wowaudit")
      .select("last_wowaudit_sync, wowaudit_api_key")
      .eq("id", 1)
      .maybeSingle(),
      fetchWowauditRanks(),
      fetchWowauditRankImages(),
    ]);

  const wowauditApiKey = wowauditRow?.wowaudit_api_key || "";

  return {
    memberCount: memberCount ?? 0,
    lastSync: wowauditRow?.last_wowaudit_sync ?? lastSynced?.synced_at ?? null,
    wowauditConfigured: !!wowauditApiKey,
    hasGuild: !!settings?.guild_id,
    initialCredentials: {
      wowaudit_api_key: wowauditApiKey,
    },
    sources: {
      wowaudit: (wowauditApiKey ? "db" : "env") as "db" | "env",
    },
    ranks,
    rankImages,
  };
}

export default async function SettingsWowauditPage() {
  const session = await getCachedServerSession();
  const authz = session ? await getAuthzSnapshot(session) : null;
  const roleLevel = authz?.roleSlug ?? session?.user?.roleLevel ?? "invitado";
  const { canEdit } = await getAppPermission(roleLevel, "settings-bnet");

  if (!canEdit) {
    return <Forbidden />;
  }

  const data = await getWowauditData();
  return <SettingsWowauditClient {...data} />;
}
