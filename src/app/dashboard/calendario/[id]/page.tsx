// src/app/dashboard/calendario/[id]/page.tsx
import type React from "react"
import { redirect, notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { EventDetailClient } from "@/components/calendar/event-detail-client"

export const runtime = "nodejs"

async function getEventDetails(eventId: string) {
    // Fetch event
    const { data: event, error: eventErr } = await sb
        .from("guild_events")
        .select("*")
        .eq("id", eventId)
        .single()

    if (eventErr || !event) return null

    // Fetch signups joining with members/profiles
    const { data: signups } = await sb
        .from("event_signups")
        .select(`
      member_id,
      role_preference,
      status,
      selection_status,
      comment,
      guild_members!inner(character_name, class_id)
    `)
        .eq("event_id", eventId)

    // Format signups for client
    const formattedSignups = (signups || []).map((s: any) => ({
        member_id: s.member_id,
        character_name: s.guild_members.character_name,
        class_id: s.guild_members.class_id,
        role_preference: s.role_preference,
        status: s.status,
        selection_status: s.selection_status,
        comment: s.comment,
    }))

    return { event, signups: formattedSignups }
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    const roleLevel = session.user?.roleLevel ?? "raider"
    const details = await getEventDetails(params.id)

    if (!details) {
        notFound()
    }

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
                    <EventDetailClient
                        event={details.event}
                        signups={details.signups}
                        roleLevel={roleLevel}
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
