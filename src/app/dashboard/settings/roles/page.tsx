import { SettingsRolesClient } from "@/components/settings/settings-roles";
import { supabaseAdmin } from "@/infrastructure/auth/auth-options";
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import React from "react"

export const runtime = "nodejs";

import { Forbidden } from "@/components/common/forbidden"
import { getAppPermission } from "@/infrastructure/auth/permissions"
import { getServerSession } from "next-auth"
import { authOptions } from "@/infrastructure/auth/auth-options"

export default async function SettingsRolesPage() {
    const session = await getServerSession(authOptions)
    const roleLevel = session?.user?.roleLevel ?? "member"
    const { canView } = await getAppPermission(roleLevel, "settings")

    if (!canView) {
        return (
            <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
                <Forbidden />
            </div>
        )
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
