// src/app/dashboard/settings/page.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { SettingsClient } from "@/components/settings/settings-client"

export const runtime = "nodejs"

async function getSettingsData() {
    // Guild info
    const { data: guild } = await sb
        .from("guilds_managed")
        .select("name, realm, region, icon_url")
        .limit(1)
        .single()

    // Member count
    const { count: memberCount } = await sb
        .from("guild_members")
        .select("*", { count: "exact", head: true })

    // Last sync
    const { data: lastSynced } = await sb
        .from("guild_members")
        .select("synced_at")
        .order("synced_at", { ascending: false })
        .limit(1)
        .single()

    // Battle.net config status
    const bnetConfigured = !!(process.env.BNET_CLIENT_ID && process.env.BNET_CLIENT_SECRET)

    return {
        guild: guild ? { name: guild.name, realm: guild.realm, region: guild.region, iconUrl: guild.icon_url } : null,
        memberCount: memberCount ?? 0,
        lastSync: lastSynced?.synced_at ?? null,
        bnetConfigured,
    }
}

export default async function SettingsPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    // Only GM can access settings
    const role = session.user?.roleLevel
    if (role !== "gm") {
        redirect("/dashboard")
    }

    const data = await getSettingsData()

    const style = {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    return (
        <SidebarProvider style={style}>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
                        <div>
                            <h1 className="text-2xl font-bold">Ajustes</h1>
                            <p className="text-sm text-muted-foreground">
                                Configuración del GuildBoard — solo accesible para el Guild Master
                            </p>
                        </div>
                        <SettingsClient {...data} />
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
