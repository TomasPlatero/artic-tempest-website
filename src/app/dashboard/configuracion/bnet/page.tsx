import { supabaseAdmin } from "@/shared/auth/auth-options";
import { SettingsBnetClient } from "@/domains/settings/components/settings-bnet";
import { getGuildCredentials } from "@/shared/auth/credentials";
import React from "react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/shared/auth/auth-options";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

export const runtime = "nodejs";

async function getBnetData() {
  const { count: memberCount } = await supabaseAdmin
    .from("guild_members")
    .select("*", { count: "exact", head: true });

  const { data: lastSynced } = await supabaseAdmin
    .from("guild_members")
    .select("synced_at")
    .order("synced_at", { ascending: false })
    .limit(1)
    .single();

  const { data: guild } = await supabaseAdmin
    .from("guilds_managed")
    .select("guild_id")
    .limit(1)
    .single();

  const creds = await getGuildCredentials();
  const bnetConfigured = !!creds.bnet_client_id && !!creds.bnet_client_secret;

  return {
    memberCount: memberCount ?? 0,
    lastSync: lastSynced?.synced_at ?? null,
    bnetConfigured,
    hasGuild: !!guild,
  };
}

export default async function SettingsBnetPage() {
  const session = await getServerSession(authOptions);
  const roleLevel = session?.user?.roleLevel ?? "invitado";
  const { canEdit } = await getAppPermission(roleLevel, "settings-bnet");

  if (!canEdit) {
    return <Forbidden />;
  }

  const data = await getBnetData();
  return <SettingsBnetClient {...data} />;
}
