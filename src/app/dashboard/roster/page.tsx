// src/app/dashboard/roster/page.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { RosterClient } from "@/components/roster/roster-client"
import { SyncRosterButton } from "@/components/common/sync-roster-button"

export const runtime = "nodejs"

async function getRoster() {
    const { data } = await sb
        .from("guild_members")
        .select("id, character_name, realm_slug, realm_name, class_id, race_id, level, rank, synced_at, note")
        .order("rank", { ascending: true })
        .order("character_name", { ascending: true })

    return data ?? []
}

export default async function RosterPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    const roster = await getRoster()
    const roleLevel = session.user?.roleLevel ?? "raider"

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
                    <div className="flex items-center justify-between px-4 lg:px-6">
                        <div>
                            <h1 className="text-2xl font-bold">Gestión de Roster</h1>
                            <p className="text-sm text-muted-foreground">
                                Explora y filtra los miembros actuales de la hermandad ({roster.length} personajes).
                            </p>
                        </div>
                    </div>

                    <RosterClient members={roster} roleLevel={roleLevel} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
