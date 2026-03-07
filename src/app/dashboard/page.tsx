// src/app/dashboard/page.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { getAppPermission } from "@/infrastructure/auth/permissions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface BnetCharacter {
  id: string
  name: string
  realm: string
  class_id: number
  level: number
}


async function getDashboardData(userId: string | undefined, roleLevel: string) {
  const isOfficer = roleLevel === "gm" || roleLevel === "officer"

  // Get guild metrics base - We try to select everything but handle fails gracefully
  const { data: guild, error: guildError } = await supabaseAdmin.from("guilds_managed")
    .select("name, region, realm, faction, last_bnet_sync, wcl_client_id, wcl_client_secret")
    .maybeSingle()

  if (guildError) {
    console.error("Dashboard: Error fetching guild data (this is likely a missing column last_bnet_sync):", {
      code: (guildError as any).code,
      message: (guildError as any).message,
      details: (guildError as any).details
    })
  }

  const { count: rosterCount } = await supabaseAdmin.from("guild_members")
    .select("*", { count: "exact", head: true })

  const { data: upcomingEvents } = await supabaseAdmin.from("guild_events")
    .select("id, title, destination, event_date")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(5)

  // Just picking the absolute next one
  const nextRaid = upcomingEvents?.[0] || null

  // User specific data
  let myCharacters: BnetCharacter[] = []
  let isBnetLinked = false
  let myBisSelections: any[] = []
  let recruitmentApplications: any[] = []
  let recentLogs: any[] = []

  if (userId) {
    const { data: profile } = await supabaseAdmin.from("profiles")
      .select("user_id, battlenet_battletag")
      .eq("user_id", userId)
      .single()

    isBnetLinked = !!profile?.battlenet_battletag

    if (isBnetLinked) {
      const { data: chars } = await supabaseAdmin.from("bnet_characters")
        .select("id, name, realm, realm_slug, class_id, level")
        .eq("user_id", userId)
        .order("level", { ascending: false })
      myCharacters = (chars || []).slice(0, 5)

      // Fetch BiS selections by linking character names/realms to guild_members
      if (chars && chars.length > 0) {
        // Find if any of our bnet characters are in the guild roster
        const names = chars.map(c => c.name)
        const realms = chars.map(c => c.realm_slug)

        const { data: members } = await supabaseAdmin.from("guild_members")
          .select("id, profile_id")
          .in("character_name", names)
          .in("realm_slug", realms)

        if (members && members.length > 0) {
          const memberIds = members.map(m => m.id)

          // Fetch BiS selections for all characters found in the guild
          const { data: bis } = await supabaseAdmin.from("bis_selections")
            .select("item_name, item_icon, slot, boss_name, ilvl")
            .in("member_id", memberIds)
            .order("created_at", { ascending: false })
            .limit(5)
          myBisSelections = bis || []

          // Proactive sync: If the member doesn't have a profile_id, link it now
          for (const m of members) {
            if (!m.profile_id) {
              await supabaseAdmin.from("guild_members")
                .update({ profile_id: userId })
                .eq("id", m.id)
            }
          }
        }
      }
    }
  }

  // Fetch Recruitment Applications for Officers
  if (isOfficer) {
    const { data: apps, count: pendingCount } = await supabaseAdmin.from("recruitment_applications")
      .select("character_name, character_spec, character_class, created_at, status", { count: "exact" })
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(3)
    recruitmentApplications = apps || []
      // Add the pending count to recruitment data
      ; (recruitmentApplications as any).pendingCount = pendingCount || 0
  }

  // Fetch WarcraftLogs (Recent Reports)
  if (guild?.wcl_client_id && guild?.wcl_client_secret) {
    try {
      const authString = Buffer.from(`${guild.wcl_client_id}:${guild.wcl_client_secret}`).toString("base64")
      const tokenRes = await fetch("https://www.warcraftlogs.com/oauth/token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authString}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials",
        next: { revalidate: 3600 }
      })

      if (tokenRes.ok) {
        const { access_token } = await tokenRes.json()
        const query = `
          query {
            reportData {
              reports(guildID: 743623, limit: 5) {
                data {
                  code
                  title
                  startTime
                  zone { name }
                }
              }
            }
          }`

        const gqlRes = await fetch("https://www.warcraftlogs.com/api/v2/client", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${access_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ query }),
          next: { revalidate: 300 }
        })

        if (gqlRes.ok) {
          const wclData = await gqlRes.json()
          recentLogs = wclData.data?.reportData?.reports?.data || []
        }
      }
    } catch (e) {
      console.error("Dashboard: Error fetching WCL logs:", e)
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
    isBnetLinked,
    myBisSelections,
    recruitmentApplications,
    recentLogs,
    roleLevel,
    blocks: [] // Placeholder, will fetch below
  }
}

async function getDashboardBlocks(roleLevel: string) {
  const { data: blocks } = await supabaseAdmin
    .from("dashboard_blocks")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true })

  if (!blocks) return []

  const filtered = []
  for (const block of blocks) {
    // 1. Filter by roleLevel
    if (block.role_levels && block.role_levels.length > 0) {
      if (!block.role_levels.includes(roleLevel)) continue
    }

    // 2. Filter by App Permission Matrix
    if (block.app_id) {
      const perm = await getAppPermission(roleLevel, block.app_id)
      if (!perm.canView) continue
    }

    filtered.push(block)
  }

  return filtered
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

  const dashboardData = await getDashboardData(session.user?.id, roleLevel)
  const blocks = await getDashboardBlocks(roleLevel)

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
          <DashboardClient data={dashboardData} blocks={blocks} roleLevel={roleLevel} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
