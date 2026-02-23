import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { redirect } from "next/navigation"
import { ScheduleFormClient } from "@/components/calendar/schedule-form-client"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
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

    const style = {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    return (
        <SidebarProvider style={style}>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-4 md:p-6 gap-6 relative z-10">
                    <div className="max-w-4xl mx-auto w-full">
                        <div className="flex items-center gap-4 mb-8">
                            <Link href="/dashboard/calendario" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                                <IconArrowLeft className="size-6" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold font-serif text-amber-500 drop-shadow-md">Ajustes de Raids Recurrentes</h1>
                                <p className="text-muted-foreground mt-1">
                                    Configura los días y horas semanales. El sistema generará automáticamente los eventos para los próximos 60 días.
                                </p>
                            </div>
                        </div>

                        <ScheduleFormClient initialSchedule={initialSchedule} />
                    </div>
                </div>

                {/* Background elements */}
                <div className="fixed inset-0 z-0 bg-[url('/assets/images/wow-raid-hero.jpg')] bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none" />
                <div className="fixed inset-0 z-0 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
            </SidebarInset>
        </SidebarProvider>
    )
}
