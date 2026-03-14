// src/app/dashboard/calendario/page.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"
import { getAppPermission } from "@/shared/auth/permissions"

import { CalendarClient } from "@/domains/calendar/components/calendar-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function getUpcomingEvents() {
    const { data } = await supabaseAdmin.from("guild_events")
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
    const roleLevel = session.user?.roleLevel ?? "member"
    const { canView, canEdit } = await getAppPermission(roleLevel, 'calendar')

    if (!canView) {
        redirect("/dashboard")
    }


    return (
        <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
            <CalendarClient initialEvents={events} canEdit={canEdit} />
        </div>
    )
}
