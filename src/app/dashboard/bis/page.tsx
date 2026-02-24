// src/app/dashboard/bis/page.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { getAppPermission } from "@/infrastructure/auth/permissions"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { BisClient } from "@/components/bis/bis-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type EligibleMember = {
    id: string
    character_name: string
    realm_slug: string
    class_id: number
    rank: number
}

async function getBisData(userId: string) {
    // Step 1: Get this user's bnet character names
    const { data: bnetChars } = await sb
        .from("bnet_characters")
        .select("name")
        .eq("user_id", userId)

    const charNames = (bnetChars || []).map((c: any) => c.name)

    if (charNames.length === 0) {
        return { eligibleMembers: [] as EligibleMember[] }
    }

    // 2. Fetch visible ranks with fallback
    let { data: rawRanks, error: ranksError } = await sb
        .from("guild_ranks")
        .select("rank, is_visible")

    // Fallback if table doesn't exist or cache is stale
    if (ranksError && (ranksError.code === 'PGRST204' || ranksError.message.includes("schema cache"))) {
        const { data: fallbackRanks } = await sb
            .from("guild_rank_visibility")
            .select("rank_id, is_visible")

        if (fallbackRanks) {
            rawRanks = fallbackRanks.map(r => ({
                rank: (r as any).rank_id,
                is_visible: r.is_visible
            }))
        }
    }

    const visibleRankIds = (rawRanks || [])
        .filter(r => r.is_visible)
        .map(r => Number(r.rank))

    let query = sb
        .from("guild_members")
        .select("id, character_name, realm_slug, class_id, rank")
        .in("character_name", charNames)

    if (visibleRankIds.length > 0) {
        query = query.in("rank", visibleRankIds)
    } else if (rawRanks && rawRanks.length > 0) {
        // Ranks are configured but NONE are visible (edge case)
        return { eligibleMembers: [] }
    } else {
        // Fallback for empty config
        query = query.lte("rank", 4)
    }

    const { data: members } = await query.order("rank", { ascending: true })

    return {
        eligibleMembers: (members || []) as EligibleMember[],
    }
}

export default async function BisPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    const userId = session.user.id
    const roleLevel = session.user?.roleLevel ?? "member"
    const { canView } = await getAppPermission(roleLevel, 'bis')

    if (!canView) {
        redirect("/dashboard")
    }

    const { eligibleMembers } = await getBisData(userId)

    const style = {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    return (
        <SidebarProvider style={style}>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
                    <BisClient eligibleMembers={eligibleMembers} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
