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
    const { data: visibleRanks, error: vrError } = await sb
        .from("guild_ranks")
        .select("rank")
        .eq("is_visible", true)

    const visibleRankIds = (visibleRanks || []).map(r => r.rank)

    let query = sb.from("guild_members").select("*")
    if (visibleRankIds.length > 0) {
        query = query.in("rank", visibleRankIds)
    }

    const { data: plannableMembers } = await query.order("rank", { ascending: true })

    return {
        event,
        signups: signups || [],
        plannableMembers: plannableMembers || []
    }
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    const userId = session.user.id
    const roleLevel = session.user?.roleLevel ?? "member"
    const { canView, canEdit } = await getAppPermission(roleLevel, 'calendar')

    if (!canView) {
        redirect("/dashboard")
    }

    const details = await getEventDetails(params.id)

    if (!details) {
        notFound()
    }

    const { data: profile } = await sb
        .from("profiles")
        .select("id, character_name, character_realm")
        .eq("user_id", session.user.id)
        .single()

    const { data: currentMember } = profile ? await sb
        .from("guild_members")
        .select("id")
        .eq("character_name", profile.character_name)
        .eq("realm_slug", profile.character_realm)
        .single() : { data: null }

    const style = {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    return (
        <SidebarProvider style={style}>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-4 md:p-6 bg-[#16161a]">
                    <RaidEditorClient
                        initialRaid={details.event}
                        initialSignups={details.signups}
                        plannableMembers={details.plannableMembers}
                        isReadOnly={!canEdit}
                        currentMemberId={userId}
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
