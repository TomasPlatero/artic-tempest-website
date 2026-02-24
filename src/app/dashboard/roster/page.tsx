// src/app/dashboard/roster/page.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { getAppPermission } from "@/infrastructure/auth/permissions"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { RosterClient } from "@/components/roster/roster-client"
import { SyncRosterButton } from "@/components/common/sync-roster-button"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function getRoster() {
    const { data } = await sb
        .from("guild_members")
        .select("id, character_name, realm_slug, realm_name, class_id, race_id, level, rank, synced_at, note, role")
        .order("rank", { ascending: true })
        .order("character_name", { ascending: true })

    // Try guild_ranks first
    let { data: rawRanks, error: ranksError } = await sb
        .from("guild_ranks")
        .select("rank, name, is_visible")

    // Fallback if table doesn't exist, cache is stale, OR it's empty
    const shouldFallback = (ranksError && (ranksError.code === 'PGRST204' || ranksError.message.includes("schema cache")))
        || (!ranksError && (!rawRanks || rawRanks.length === 0));

    if (shouldFallback) {
        console.log("[ROSTER PAGE] Falling back to guild_rank_visibility query (Error or Empty)...");
        const { data: fallbackRanks } = await sb
            .from("guild_rank_visibility")
            .select("rank_id, name, is_visible")

        if (fallbackRanks && fallbackRanks.length > 0) {
            rawRanks = fallbackRanks.map(r => ({
                rank: (r as any).rank_id ?? (r as any).rank,
                name: r.name,
                is_visible: r.is_visible
            }))
        }
    }

    const defaultNames = ["Maestro de Hermandad", "Oficial", "Alter de Oficial", "Raider", "Pruebas", "Social", "Alter", "Iniciado", "Recluta", "Miembro"]

    // Build a map of rank visibility from the database
    const visibilityMap: Record<number, boolean> = {}
    rawRanks?.forEach(r => {
        visibilityMap[r.rank] = r.is_visible
    })

    // Prepare rank names supporting up to 10 ranks (0-9)
    const maxRank = 9
    const rankNames: string[] = []
    for (let i = 0; i <= maxRank; i++) {
        const found = rawRanks?.find(v => v.rank === i)
        rankNames[i] = found?.name || defaultNames[i] || `Rank ${i}`
    }

    // Filter members based on the visibility map (default to true if not configured)
    const filteredRoster = (data ?? []).filter(m => {
        const rankValue = Number(m.rank);
        const isVisible = visibilityMap[rankValue] ?? true;
        return isVisible;
    })

    return { roster: filteredRoster, rankNames }
}

export default async function RosterPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    const roleLevel = session.user?.roleLevel ?? "member"
    const { canView } = await getAppPermission(roleLevel, 'roster')

    if (!canView) {
        redirect("/dashboard")
    }

    const { roster, rankNames } = await getRoster()

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

                    <RosterClient members={roster} roleLevel={roleLevel} rankNames={rankNames} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
