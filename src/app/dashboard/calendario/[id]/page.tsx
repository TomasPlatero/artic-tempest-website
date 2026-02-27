// src/app/dashboard/calendario/[id]/page.tsx
import type React from "react"
import { redirect, notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { getAppPermission } from "@/infrastructure/auth/permissions"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { RaidEditorClient } from "@/components/calendar/raid-editor-client"

export const runtime = "nodejs"

async function getEventDetails(eventId: string) {
    // 1. Fetch event
    const { data: event, error: eventErr } = await sb
        .from("guild_events")
        .select("*")
        .eq("id", eventId)
        .single()

    if (eventErr || !event) return null

    // 2. Fetch signups joining with members
    const { data: signups } = await sb
        .from("event_signups")
        .select("*, guild_members(*)")
        .eq("event_id", eventId)

    // 3. Fetch plannable members (those with visible ranks)
    let { data: rawRanks, error: ranksError } = await sb
        .from("guild_ranks")
        .select("rank, name, is_visible, color") as { data: any[] | null, error: any }

    // Handle missing color column gracefully
    if (ranksError && (ranksError.code === 'PGRST204' || ranksError.message.toLowerCase().includes("color") || ranksError.message.toLowerCase().includes("schema cache"))) {
        const { data: retryRanks } = await sb
            .from("guild_ranks")
            .select("rank, name, is_visible")
        rawRanks = retryRanks
    }

    const rankIndices = Array.from({ length: 10 }, (_, i) => i)
    const rankColors = rankIndices.map(i => {
        const found = rawRanks?.find(v => v.rank === i)
        return found?.color || null
    })

    const visibleRankIds = (rawRanks || [])
        .filter(r => r.is_visible)
        .map(r => r.rank)

    const { data: plannableMembers } = await sb
        .from("guild_members")
        .select("*")
        .in("rank", visibleRankIds)
        .order("rank", { ascending: true })

    // 4. Fetch game constants
    const { data: constants } = await sb
        .from("game_constants")
        .select("category, key, value, metadata")

    // Process constants
    const classRoles: Record<number, string> = {}
    const raids: any[] = []
    const buffs: any[] = [
        { category: "Buffs / Debuffs", items: [] },
        { category: "Utilidad", items: [] }
    ]

    constants?.forEach(c => {
        if (c.category === 'class_role') {
            classRoles[Number(c.key)] = c.value
        }
        if (c.category === 'wow_raid') {
            raids.push({
                id: c.key,
                name: c.value,
                background: c.metadata?.background,
                bosses: c.metadata?.bosses || []
            })
        }
        if (c.category === 'wow_buff') {
            const item = { id: c.key, name: c.value, classId: c.metadata?.classId }
            if (c.metadata?.type === 'buff') buffs[0].items.push(item)
            else buffs[1].items.push(item)
        }
    })

    return {
        event,
        signups: signups || [],
        plannableMembers: plannableMembers || [],
        rankColors,
        classRoles,
        raids,
        buffs
    }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session) {
        redirect("/")
    }

    const roleLevel = session.user?.roleLevel ?? "member"
    const { canView, canEdit } = await getAppPermission(roleLevel, 'calendar')

    if (!canView) {
        redirect("/dashboard")
    }

    const details = await getEventDetails(id)

    if (!details) {
        notFound()
    }

    const { data: currentMember } = await sb
        .from("guild_members")
        .select("id")
        .eq("profile_id", session.user.id)
        .single()

    const style = {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    return (
        <SidebarProvider style={style} suppressHydrationWarning>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-4 md:p-6">
                    <RaidEditorClient
                        initialRaid={details.event}
                        initialSignups={details.signups}
                        plannableMembers={details.plannableMembers}
                        rankColors={details.rankColors}
                        classRoles={details.classRoles}
                        raids={details.raids}
                        buffs={details.buffs}
                        isReadOnly={true}
                        currentMemberId={currentMember?.id}
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
