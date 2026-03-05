import { supabaseAdmin } from "@/infrastructure/auth/auth-options"
import { SettingsRosterClient } from "@/components/settings/settings-roster"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import React from "react"

export const runtime = "nodejs"

async function getRosterSettings() {
    const { data: rawRanks } = await supabaseAdmin
        .from("guild_ranks")
        .select("rank, name, is_visible, app_role, color")
        .order("rank", { ascending: true })

    const defaultNames = ["Guild Master", "Officer", "Officer Alt", "Raid Leader", "Artic Raider", "Raider", "Trial", "Social", "Alt", "Member"]

    const maxRank = 9
    const rankIndices = Array.from({ length: maxRank + 1 }, (_, i) => i)

    const rankVisibility = rankIndices.map(i => {
        const found = rawRanks?.find(v => v.rank === i)
        return found ? found.is_visible : true
    })

    const rankNames = rankIndices.map(i => {
        const found = rawRanks?.find(v => v.rank === i)
        return found?.name || defaultNames[i] || `Rank ${i}`
    })

    const rankRoles = rankIndices.map(i => {
        const found = rawRanks?.find(v => v.rank === i)
        return found?.app_role || 'raider'
    })

    const rankColors = rankIndices.map(i => {
        const found = rawRanks?.find(v => v.rank === i)
        return found?.color || null
    })

    return {
        rankVisibility,
        rankNames,
        rankRoles,
        rankColors
    }
}

export default async function RosterSettingsPage() {
    const data = await getRosterSettings()
    return <SettingsRosterClient {...data} />
}
