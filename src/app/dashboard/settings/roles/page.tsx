import { SettingsRolesClient } from "@/components/settings/settings-roles";
import { sb } from "@/infrastructure/auth/auth-options";
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import React from "react"

export const runtime = "nodejs";

export default async function SettingsRolesPage() {
    const { data: profiles, error } = await sb
        .from("profiles")
        .select("user_id, discord_username, discord_avatar, role_level")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching profiles:", error);
    }

    const { data: discordRoles } = await sb
        .from("discord_roles")
        .select("role_id, name, level");

    const { data: permissions } = await sb
        .from("app_permissions")
        .select("*");

    return (
        <SettingsRolesClient
            initialProfiles={profiles ?? []}
            initialDiscordRoles={discordRoles ?? []}
            initialPermissions={permissions ?? []}
        />
    );
}
