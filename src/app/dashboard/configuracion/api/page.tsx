// src/app/dashboard/configuracion/api/page.tsx
import { SettingsApiClient } from "@/domains/settings/components/settings-api";
import { supabaseAdmin } from "@/shared/auth/auth-options";
import { AppSidebar } from "@/shared/layout/app-sidebar"
import { SiteHeader } from "@/shared/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/shared/components/sidebar"
import React from "react";

export const runtime = "nodejs";

export default async function SettingsApiPage() {
    const { data: guild } = await supabaseAdmin
        .from("guilds_managed")
        .select(`
            wcl_client_id, wcl_client_secret,
            bnet_client_id, bnet_client_secret,
            discord_client_id, discord_client_secret,
            discord_guild_id
        `)
        .limit(1)
        .single();

    return (
        <SettingsApiClient
            wclClientId={guild?.wcl_client_id || ""}
            wclClientSecret={guild?.wcl_client_secret ? "••••••••••••••••" : ""}
            bnetClientId={guild?.bnet_client_id || ""}
            bnetClientSecret={guild?.bnet_client_secret ? "••••••••••••••••" : ""}
            discordClientId={guild?.discord_client_id || ""}
            discordClientSecret={guild?.discord_client_secret ? "••••••••••••••••" : ""}
            discordGuildId={guild?.discord_guild_id || ""}
        />
    );
}
