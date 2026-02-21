// src/app/dashboard/page.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { IconUsersGroup } from "@tabler/icons-react"

export const runtime = "nodejs"

async function getDashboardData() {
  // Get guild metrics base
  const { data: guild } = await sb
    .from("guilds_managed")
    .select("name, region, realm")
    .limit(1)
    .single()

  const { count: rosterCount } = await sb
    .from("guild_members")
    .select("*", { count: "exact", head: true })
    // Simple filter simulating those tracked in "Team raiders"
    .lte("rank", 4)

  const { data: upcomingEvents } = await sb
    .from("guild_events")
    .select("id, title, destination, event_date")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(5)

  // Just picking the absolute next one
  const nextRaid = upcomingEvents?.[0] || null

  return {
    guildName: guild?.name ?? "Sin hermandad",
    realm: guild?.realm ?? "—",
    region: guild?.region ?? "eu",
    rosterCount: rosterCount ?? 0,
    nextRaid,
    upcomingEvents: upcomingEvents || []
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/")
  }

  const roleLevel = session.user?.roleLevel ?? "raider"
  const dashboardData = await getDashboardData()

  const style = {
    "--sidebar-width": "calc(var(--spacing) * 72)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties

  return (
    <SidebarProvider style={style}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col py-6 max-w-7xl mx-auto w-full px-4 gap-6">
          <DashboardClient data={dashboardData} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
