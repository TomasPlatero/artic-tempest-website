// src/app/dashboard/bis/page.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"
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
    role: string | null
    bis_dps_gain: number | null
    bis_pct_gain: string | null
    spec_name: string
}

async function getBisData(userId: string) {
    // Step 1: Get this user's bnet character names
    const { data: bnetChars } = await supabaseAdmin.from("bnet_characters")
        .select("name")
        .eq("user_id", userId)

    const charNames = (bnetChars || []).map((c: any) => c.name)

    if (charNames.length === 0) {
        return { eligibleMembers: [] as EligibleMember[] }
    }

    // 2. Fetch visible ranks with fallback
    let { data: rawRanks, error: ranksError } = await supabaseAdmin.from("guild_ranks")
        .select("rank, is_visible")

    // Fallback if table doesn't exist or cache is stale
    if (ranksError && (ranksError.code === 'PGRST204' || ranksError.message.includes("schema cache"))) {
        const { data: fallbackRanks } = await supabaseAdmin.from("guild_rank_visibility")
            .select("rank_id, is_visible")

        if (fallbackRanks) {
            rawRanks = fallbackRanks.map(r => ({
                rank: (r as any).rank_id,
                is_visible: r.is_visible
            }))
        }
    }

    // Simplified visibility logic matching Roster app behavior: 
    // Default to true for all ranks unless explicitly set to false in the database.
    const visibilityMap: Record<number, boolean> = {}
    for (let i = 0; i <= 9; i++) visibilityMap[i] = true
    rawRanks?.forEach(r => {
        visibilityMap[Number(r.rank)] = r.is_visible
    })

    const { data: members } = await supabaseAdmin.from("guild_members")
        .select("id, character_name, realm_slug, class_id, rank, role, bis_dps_gain, bis_pct_gain, spec_name")
        .in("character_name", charNames)
        .order("rank", { ascending: true })

    const filteredMembers = (members || []).filter(m => visibilityMap[Number(m.rank)] !== false)

    return {
        eligibleMembers: filteredMembers as EligibleMember[],
    }
}

export default async function BisPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    const userId = session.user.id
    const roleLevel = session.user?.roleLevel ?? "member"
    const { canView, canEdit } = await getAppPermission(roleLevel, 'bis')

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
                    <BisClient eligibleMembers={eligibleMembers} canEdit={canEdit} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
