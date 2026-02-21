// src/app/dashboard/estadisticas/page.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { StatsClient } from "@/components/stats/stats-client"

export const runtime = "nodejs"

async function getRoster() {
    const { data } = await sb
        .from("guild_members")
        .select("class_id")

    return data ?? []
}

export default async function EstadisticasPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    const roster = await getRoster()

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
                    <StatsClient members={roster} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
