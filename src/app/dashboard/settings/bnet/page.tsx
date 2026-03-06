import { supabaseAdmin } from "@/infrastructure/auth/auth-options"
import { SettingsBnetClient } from "@/components/settings/settings-bnet"
import { getGuildCredentials } from "@/infrastructure/auth/credentials"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import React from "react"

export const runtime = "nodejs"

async function getBnetData() {
    const { count: memberCount } = await supabaseAdmin
        .from("guild_members")
        .select("*", { count: "exact", head: true })

    const { data: lastSynced } = await supabaseAdmin
        .from("guild_members")
        .select("synced_at")
        .order("synced_at", { ascending: false })
        .limit(1)
        .single()

    const { data: guild } = await supabaseAdmin
        .from("guilds_managed")
        .select("guild_id")
        .limit(1)
        .single()

    const creds = await getGuildCredentials()
    const bnetConfigured = !!creds.bnet_client_id && !!creds.bnet_client_secret

    return {
        memberCount: memberCount ?? 0,
        lastSync: lastSynced?.synced_at ?? null,
        bnetConfigured,
        hasGuild: !!guild,
    }
}

export default async function SettingsBnetPage() {
    const data = await getBnetData()
    return <SettingsBnetClient {...data} />
}
