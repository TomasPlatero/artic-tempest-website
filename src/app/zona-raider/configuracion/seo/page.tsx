import React from "react";
import { Forbidden } from "@/shared/components/forbidden";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { getAppPermission } from "@/shared/auth/permissions";
import { getSeoSettings } from "@/shared/seo/seo-settings";
import { SeoSettingsClient } from "@/domains/settings/components/seo-settings-client";

export const runtime = "nodejs";

export default async function SeoSettingsPage() {
  const session = await getCachedServerSession();
  const roleLevel = session?.user?.roleLevel ?? "invitado";
  const settingsPermission = await getAppPermission(roleLevel, "settings");

  if (!settingsPermission.canView) {
    return <Forbidden />;
  }

  const seoSettings = await getSeoSettings();

  return <SeoSettingsClient initialSettings={seoSettings} canEdit={settingsPermission.canEdit} />;
}
