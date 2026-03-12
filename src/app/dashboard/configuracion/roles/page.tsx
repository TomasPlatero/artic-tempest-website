import { SettingsRolesClient } from "@/domains/settings/components/settings-roles";
import { supabaseAdmin } from "@/shared/auth/auth-options";
import { AppSidebar } from "@/shared/layout/app-sidebar";
import { SiteHeader } from "@/shared/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/shared/components/sidebar";
import React from "react";

export const runtime = "nodejs";

import { Forbidden } from "@/shared/components/forbidden";
import { getAppPermission } from "@/shared/auth/permissions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/auth/auth-options";

export default async function SettingsRolesPage() {
  const session = await getServerSession(authOptions);
  const roleLevel = session?.user?.roleLevel ?? "member";
  const { canManage } = await getAppPermission(roleLevel, "settings");

  if (!canManage) {
    return (
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
        <Forbidden />
      </div>
    );
  }

  const { data: discordRoles } = await supabaseAdmin
    .from("discord_roles")
    .select("role_id, name, level");

  const { data: permissions } = await supabaseAdmin
    .from("app_permissions")
    .select("*");

  return (
    <SettingsRolesClient
      initialDiscordRoles={discordRoles ?? []}
      initialPermissions={permissions ?? []}
    />
  );
}
