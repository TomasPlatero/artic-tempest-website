import { SettingsRolesClient } from "@/components/settings/settings-roles";
import { supabaseAdmin } from "@/infrastructure/auth/auth-options";
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import React from "react"

export const runtime = "nodejs";

export default async function SettingsRolesPage() {
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
