import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { redirect } from "next/navigation"
import { ScheduleFormClient } from "@/components/calendar/schedule-form-client"
import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import React from "react"

export const dynamic = "force-dynamic"

export default async function CalendarSettingsPage() {
    const session = await getServerSession(authOptions)
    if (!session) redirect("/")

    const roleLevel = session.user?.roleLevel
    if (roleLevel !== "gm" && roleLevel !== "officer") {
        redirect("/dashboard/calendario")
    }

    // Server-side fetch current schedule
    const { data: guildData } = await sb.from("guilds_managed").select("guild_id").limit(1).single()

    let initialSchedule: any[] = []
    if (guildData) {
        const { data } = await sb
            .from("guild_raid_schedule")
            .select("*")
            .eq("guild_id", guildData.guild_id)
            .order("day_of_week", { ascending: true })
        if (data) initialSchedule = data
    }

    return (
        <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 pb-20">
            <div className="flex items-center gap-4 mb-4">
                <Link href="/dashboard/settings/apps">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/40">
                        <IconArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Ajustes de Calendario</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configura los días y horas de raids recurrentes.
                    </p>
                </div>
            </div>

            <div className="w-full max-w-full">
                <ScheduleFormClient initialSchedule={initialSchedule} />
            </div>
        </div>
    )
}
