// src/app/dashboard/estadisticas/page.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { StatsClient } from "@/components/stats/stats-client"
import { fetchGuildProgression } from "@/infrastructure/raiderio/raiderio-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function getProgressionData() {
    const { data: guild } = await supabaseAdmin.from("guilds_managed")
        .select("name, realm, region")
        .limit(1)
        .single()

    if (!guild) return null

    // fetch from Raider.io API
    const rioData = await fetchGuildProgression(guild.realm, guild.name, guild.region)
    return rioData
}

async function getRoster() {
    const { data: members } = await supabaseAdmin.from("guild_members")
        .select("id, character_name, realm_slug, class_id, role, rank")
        .order("character_name", { ascending: true })

    // Try guild_ranks first
    let { data: rawRanks, error: ranksError } = await supabaseAdmin.from("guild_ranks")
        .select("rank, is_visible")

    // Fallback if table doesn't exist, cache is stale, OR it's empty
    const shouldFallback = (ranksError && (ranksError.code === 'PGRST204' || ranksError.message.includes("schema cache")))
        || (!ranksError && (!rawRanks || rawRanks.length === 0));

    if (shouldFallback) {
        const { data: fallbackRanks } = await supabaseAdmin.from("guild_rank_visibility")
            .select("rank_id, is_visible")

        if (fallbackRanks && fallbackRanks.length > 0) {
            rawRanks = fallbackRanks.map(r => ({
                rank: (r as any).rank_id ?? (r as any).rank,
                is_visible: r.is_visible
            }))
        }
    }

    // Build a map of rank visibility from the database
    const visibilityMap: Record<number, boolean> = {}
    rawRanks?.forEach(r => {
        visibilityMap[r.rank] = r.is_visible
    })

    // Filter members based on the visibility map (default to true if not configured)
    const filteredRoster = (members ?? []).filter(m => {
        const rankValue = Number(m.rank);
        const isVisible = visibilityMap[rankValue] ?? true;
        return isVisible;
    })

    return filteredRoster.map(m => ({
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

    // Fetch class colors
    const { data: colorConstants } = await supabaseAdmin.from("game_constants")
        .select("key, value")
        .eq("category", "wow_class_color")

    const classColors: Record<number, string> = {}
    colorConstants?.forEach(c => {
        classColors[Number(c.key)] = c.value
    })

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
                    <StatsClient members={roster} rioData={rioData} classColors={classColors} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
