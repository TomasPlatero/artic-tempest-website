// src/app/dashboard/roster/page.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"
import { getAppPermission } from "@/shared/auth/permissions"

import { AppSidebar } from "@/shared/layout/app-sidebar"
import { SiteHeader } from "@/shared/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/shared/components/sidebar"
import { RosterClient } from "@/domains/roster/components/roster-client"
import { SyncRosterButton } from "@/shared/components/sync-roster-button"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function getRoster() {
    const { data } = await supabaseAdmin.from("guild_members")
        .select("id, character_name, realm_slug, realm_name, class_id, race_id, level, rank, synced_at, note, role")
        .order("rank", { ascending: true })
        .order("character_name", { ascending: true })

    // Fetch rank configurations
    let { data: rawRanks, error: ranksError } = await supabaseAdmin.from("guild_ranks")
        .select("rank, name, is_visible, color") as { data: any[] | null, error: any }

    // Handle missing color column gracefully
    if (ranksError && (ranksError.code === 'PGRST204' || ranksError.message.toLowerCase().includes("color") || ranksError.message.toLowerCase().includes("schema cache"))) {
        console.warn("[ROSTER PAGE] 'color' column missing, retrying select without it...");
        const { data: retryRanks } = await supabaseAdmin.from("guild_ranks")
            .select("rank, name, is_visible")
        rawRanks = retryRanks
    }

    if (ranksError && !rawRanks) {
        console.error("[ROSTER PAGE] Error fetching ranks:", ranksError)
    }

    console.log("[ROSTER PAGE] Loaded ranks count:", rawRanks?.length || 0)

    const visibilityMap: Record<number, boolean> = {}
    const rankColors: (string | null)[] = []
    const rankNames: string[] = []
    const defaultNames = ["Guild Master", "Officer", "Officer Alt", "Raid Leader", "Artic Raider", "Raider", "Trial", "Social", "Alt", "Member"]

    const maxRank = 9
    for (let i = 0; i <= maxRank; i++) {
        const found = rawRanks?.find(v => v.rank === i)
        // Default to true if not found in DB yet
        visibilityMap[i] = found ? found.is_visible : true
        rankNames[i] = found?.name || defaultNames[i] || `Rank ${i}`
        rankColors[i] = found?.color || null
    }

    // Fetch Game Constants (Classes, Role Mappings)
    const { data: constants } = await supabaseAdmin.from("game_constants")
        .select("category, key, value, metadata")

    const classNames: Record<number, string> = {}
    const classColors: Record<number, string> = {}
    const classRoleMapping: Record<number, string> = {}

    constants?.forEach(c => {
        if (c.category === 'wow_class') {
            classNames[Number(c.key)] = c.value
            if (c.metadata?.color) classColors[Number(c.key)] = c.metadata.color
        }
        if (c.category === 'class_role') {
            classRoleMapping[Number(c.key)] = c.value
        }
    })

    // Filter members based on visibility
    const filteredRoster = (data ?? []).filter(m => {
        const r = Number(m.rank)
        const isVisible = visibilityMap[r] ?? true
        return isVisible
    })

    console.log("[ROSTER PAGE] Final filtered roster count:", filteredRoster.length)

    return {
        roster: filteredRoster,
        rankNames,
        rankColors,
        classNames,
        classColors,
        classRoleMapping
    }
}

export default async function RosterPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    const roleLevel = session.user?.roleLevel ?? "member"
    const { canView, canEdit } = await getAppPermission(roleLevel, 'roster')

    if (!canView) {
        redirect("/dashboard")
    }

    const { roster, rankNames, rankColors, classNames, classColors, classRoleMapping } = await getRoster()

    const style = {
        "--sidebar-width": "calc(var(--spacing) * 64)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    return (
        <SidebarProvider style={style} suppressHydrationWarning>
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

                    <RosterClient
                        members={roster}
                        canEdit={canEdit}
                        roleLevel={roleLevel}
                        rankNames={rankNames}
                        rankColors={rankColors}
                        classNames={classNames}
                        classColors={classColors}
                        classRoleMapping={classRoleMapping}
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
