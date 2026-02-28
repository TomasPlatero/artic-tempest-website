"use client"

import * as React from "react"
import Image from "next/image"
import { NavMain } from "@/components/nav/nav-main"
import { NavUser } from "@/components/nav/nav-user"
import { useSession } from "next-auth/react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/common/sidebar"
import { Badge } from "@/components/ui/badge"
import {
  IconChartBar,
  IconDashboard,
  IconSettings,
  IconUsers,
  IconCalendarEvent,
  IconListCheck,
  IconStethoscope,
  IconWorld,
  IconFileText,
  IconSearch,
  IconRefresh,
  IconListSearch,
  IconAdjustments,
  IconHistory,
  IconShieldCheck,
  IconInnerShadowTop,
  IconBell
} from "@tabler/icons-react"

const navigationData = {
  general: [
    {
      title: "Inicio",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Notificaciones",
      url: "/notificaciones",
      icon: IconBell,
      badgeKey: "notifications",
    },
    {
      title: "Volver a la web",
      url: "/",
      icon: IconWorld,
    },
  ],
  raider: [
    {
      title: "Calendario",
      url: "/dashboard/calendario",
      icon: IconCalendarEvent,
      appId: "calendar",
    },
    {
      title: "Lista de Deseos",
      url: "/dashboard/bis",
      icon: IconListCheck,
      appId: "bis",
    },
    {
      title: "Planificador",
      url: "/dashboard/planificador-cds",
      icon: IconStethoscope,
      appId: "planificador-cds",
    },
    {
      title: "Estadísticas y Logs",
      url: "/dashboard/estadisticas",
      icon: IconChartBar,
      appId: "stats",
    },
  ],
  admin: [
    {
      title: "Reclutamiento",
      url: "/dashboard/settings/recruitment",
      icon: IconListSearch,
      roles: ["gm", "officer"],
      badgeKey: "recruitment",
    },
    {
      title: "Ajustes",
      url: "/dashboard/settings",
      icon: IconAdjustments,
      roles: ["gm", "officer"],
    },
  ],
}

import { supabase } from "@/infrastructure/supabase/client"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const roleLevel = session?.user?.roleLevel ?? "member"
  const [iconUrl, setIconUrl] = React.useState<string | null>(null)
  const [guildName, setGuildName] = React.useState<string>("Artic Tempest")
  const [permissions, setPermissions] = React.useState<any[]>([])
  const [badges, setBadges] = React.useState<Record<string, number>>({
    recruitment: 0,
    calendar: 0,
    notifications: 0
  })

  React.useEffect(() => {
    fetch("/api/guild/permissions")
      .then(res => res.json())
      .then(data => setPermissions(data))
      .catch(err => console.error("Failed to fetch permissions:", err))

    fetch("/api/guild/info")
      .then(res => res.json())
      .then(data => {
        if (data?.icon_url) setIconUrl(data.icon_url)
        if (data?.name) setGuildName(data.name)
      })
      .catch(err => console.error("Failed to fetch guild info:", err))

    // Fetch notifications badge
    const fetchNotifications = () => {
      fetch("/api/notifications")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setBadges(prev => ({ ...prev, notifications: data.filter((n: any) => !n.isRead).length }))
          }
        })
        .catch(err => console.error("Failed to fetch notification badges:", err))
    }

    fetchNotifications()

    // Real-time for notifications
    const notifChannel = supabase
      .channel('sidebar_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_notifications' }, () => fetchNotifications())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_notifications_read', filter: `user_id=eq.${session?.user?.id}` }, () => fetchNotifications())
      .subscribe()

    // Fetch badges
    if (roleLevel === 'gm' || roleLevel === 'officer') {
      supabase
        .from("recruitment_applications")
        .select("id", { count: 'exact', head: true })
        .in("status", ["pending", "reviewing", "interview"])
        .then(({ count }) => {
          setBadges(prev => ({ ...prev, recruitment: count || 0 }))
        })

      // Simple fetch for pending invitations if profile is linked
      if (session?.user?.id) {
        supabase
          .from("event_signups")
          .select("id", { count: 'exact', head: true })
          .eq("status", "invited")
          .then(({ count }) => {
            setBadges(prev => ({ ...prev, calendar: count || 0 }))
          })
      }
      // Real-time subscription for recruitment applications
      const channel = supabase
        .channel('sidebar_recruitment_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'recruitment_applications' },
          () => {
            supabase
              .from("recruitment_applications")
              .select("id", { count: 'exact', head: true })
              .in("status", ["pending", "reviewing", "interview"])
              .then(({ count }) => {
                setBadges(prev => ({ ...prev, recruitment: count || 0 }))
              })
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
        supabase.removeChannel(notifChannel)
      }
    }

    return () => {
      supabase.removeChannel(notifChannel)
    }
  }, [roleLevel, session?.user?.id])

  const hasViewPermission = (appId: string) => {
    if (roleLevel === 'gm') return true
    const p = permissions.find(p => p.role_level === roleLevel && p.app_id === appId)
    if (!p) {
      if (['officer', 'raider', 'member'].includes(roleLevel)) return true
      return false
    }
    return p.can_view
  }

  const filterItems = (items: any[]) => {
    return items.filter(item => {
      if (item.roles && !item.roles.includes(roleLevel)) return false
      if (item.appId && !hasViewPermission(item.appId)) return false
      return true
    }).map(item => ({
      ...item,
      badge: item.badgeKey ? badges[item.badgeKey] : (item.appId === 'calendar' ? badges.calendar : undefined)
    }))
  }

  const filteredGroups = [
    { title: "", items: filterItems(navigationData.general) },
    { title: "ZONA RAIDER", items: filterItems(navigationData.raider) },
    { title: "ADMINISTRACIÓN", items: filterItems(navigationData.admin) },
  ].filter(group => group.items.length > 0)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm h-12">
              <div className="flex items-center gap-2 text-sidebar-foreground">
                {iconUrl ? (
                  <Image src={iconUrl} alt="Guild Logo" width={20} height={20} className="size-5 rounded-full object-cover shrink-0 border border-border/30" />
                ) : (
                  <IconInnerShadowTop className="size-5 shrink-0" />
                )}
                <div className="flex flex-col truncate">
                  <span className="text-base font-semibold leading-none">{guildName}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-blue-500/10 text-blue-400 border-blue-500/20 font-black">v0.9.0 beta</Badge>
                  </div>
                </div>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {filteredGroups.map(group => (
          <NavMain key={group.title} label={group.title} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar >
  )
}
