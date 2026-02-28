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
export const dynamic = "force-dynamic"

interface BnetCharacter {
  id: string
  name: string
  realm: string
  class_id: number
  level: number
}


async function getDashboardData(userId: string | undefined) {
  // Get guild metrics base
  // Get guild metrics base - We try to select everything but handle fails gracefully
  const { data: guild, error: guildError } = await sb
    .from("guilds_managed")
    .select("name, region, realm, faction, last_bnet_sync")
    .maybeSingle()

  if (guildError) {
    console.error("Dashboard: Error fetching guild data (this is likely a missing column last_bnet_sync):", {
      code: (guildError as any).code,
      message: (guildError as any).message,
      details: (guildError as any).details
    })
  }

  const { count: rosterCount } = await sb
    .from("guild_members")
    .select("*", { count: "exact", head: true })

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
    guildName: guild?.name ?? "Artic Tempest",
    realm: guild?.realm ?? "—",
    region: guild?.region ?? "eu",
    faction: guild?.faction ?? "horde",
    rosterCount: rosterCount ?? 0,
    lastBnetSync: guild?.last_bnet_sync ?? null,
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

  const roleLevel = session.user?.roleLevel?.toLowerCase() ?? "raider"
  const isGuest = roleLevel === "invitado"

  if (isGuest) {
    redirect("/mis-personajes")
  }

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
