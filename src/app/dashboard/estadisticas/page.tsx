// src/app/dashboard/estadisticas/page.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { StatsClient } from "@/components/stats/stats-client"
import { fetchGuildProgression } from "@/infrastructure/raiderio/raiderio-client"

export const runtime = "nodejs"

async function getProgressionData() {
    const { data: guild } = await sb
        .from("guilds_managed")
        .select("name, realm, region")
        .limit(1)
        .single()

    if (!guild) return null

    // fetch from Raider.io API
    const rioData = await fetchGuildProgression(guild.realm, guild.name, guild.region)
    return rioData
}

async function getRoster() {
    const { data } = await sb
        .from("guild_members")
        .select("id, character_name, realm_slug, class_id, role")
        .order("character_name", { ascending: true })

    return (data ?? []).map(m => ({
        ...m,
        character_realm: m.realm_slug,
    }))
}

import { getAppPermission } from "@/infrastructure/auth/permissions"

export default async function EstadisticasPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    const roleLevel = session.user?.roleLevel ?? "member"
    const { canView } = await getAppPermission(roleLevel, 'stats')

    if (!canView) {
        redirect("/dashboard")
    }

    const roster = await getRoster()
    const rioData = await getProgressionData()

    const style = {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    return (
        <SidebarProvider style={style}>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col py-6 gap-6">
                    <StatsClient members={roster} rioData={rioData} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
