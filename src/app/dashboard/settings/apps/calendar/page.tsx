import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"
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
    const { data: guildData } = await supabaseAdmin.from("guilds_managed").select("guild_id").limit(1).single()

    let initialSchedule: any[] = []
    if (guildData) {
        const { data } = await supabaseAdmin.from("guild_raid_schedule")
            .select("*")
            .eq("guild_id", guildData.guild_id)
            .order("day_of_week", { ascending: true })
        if (data) initialSchedule = data
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8 w-full max-w-full pb-20">
            <div className="flex items-center gap-4 mb-4">
                <Link href="/dashboard/settings/apps">
                    <Button variant="outline" size="icon" className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl">
                        <IconArrowLeft className="size-6" />
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
