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

interface BnetCharacter {
  id: string
  name: string
  realm: string
  class_id: number
  level: number
}


async function getDashboardData(userId: string | undefined) {
  // Get guild metrics base
  const { data: guild } = await sb
    .from("guilds_managed")
    .select("name, region, realm, faction")
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

  // User specific data
  let myCharacters: BnetCharacter[] = []
  let isBnetLinked = false

  if (userId) {
    const { data: profile } = await sb
      .from("profiles")
      .select("battlenet_battletag")
      .eq("user_id", userId)
      .single()

    isBnetLinked = !!profile?.battlenet_battletag

    if (isBnetLinked) {
      const { data: chars } = await sb
        .from("bnet_characters")
        .select("id, name, realm, class_id, level")
        .eq("user_id", userId)
        .order("level", { ascending: false })
        .limit(5)
      myCharacters = chars || []
    }
  }

  return {
    guildName: guild?.name ?? "Sin hermandad",
    realm: guild?.realm ?? "—",
    region: guild?.region ?? "eu",
    faction: guild?.faction ?? "horde",
    rosterCount: rosterCount ?? 0,
    nextRaid,
    upcomingEvents: upcomingEvents || [],
    myCharacters,
    isBnetLinked
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/")
  }

  const roleLevel = session.user?.roleLevel ?? "raider"
  const dashboardData = await getDashboardData(session.user?.id)

  const style = {
    "--sidebar-width": "calc(var(--spacing) * 64)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties

  return (
    <SidebarProvider style={style}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col py-6 max-w-7xl mx-auto w-full px-4 gap-6">
          <DashboardClient data={dashboardData} roleLevel={roleLevel} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
