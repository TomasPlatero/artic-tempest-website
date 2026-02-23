// src/app/dashboard/calendario/page.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { CalendarClient } from "@/components/calendar/calendar-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function getUpcomingEvents() {
    const { data } = await sb
        .from("guild_events")
        .select(`
            id, title, description, event_date, end_date, event_type, destination, difficulty, status, background_url,
            event_signups ( selection_status )
        `)
        .gte("event_date", new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())
        .order("event_date", { ascending: true })

    return data ?? []
}

export default async function CalendarioPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    const events = await getUpcomingEvents()
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
                <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
                    <CalendarClient initialEvents={events} roleLevel={roleLevel} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
