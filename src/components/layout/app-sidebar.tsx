"use client"

import * as React from "react"
import Image from "next/image"
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconSettings,
  IconUsers,
  IconCalendarEvent,
  IconListCheck,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav/nav-main"
import { NavSecondary } from "@/components/nav/nav-secondary";
import { NavUser } from "@/components/nav/nav-user"
import { useSession } from "next-auth/react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/common/sidebar"

const data = {
  navMain: [
    {
      title: "Inicio",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Roster",
      url: "/dashboard/roster",
      icon: IconUsers,
      appId: "roster",
    },
    {
      title: "Estadísticas",
      url: "/dashboard/estadisticas",
      icon: IconChartBar,
      appId: "stats",
    },

    {
      title: "Calendario",
      url: "/dashboard/calendario",
      icon: IconCalendarEvent,
      appId: "calendar",
    },
    {
      title: "Lista de Deseos de BiS",
      url: "/dashboard/bis",
      icon: IconListCheck,
      appId: "bis",
    },
  ],
  navSecondary: [
    {
      title: "Ajustes",
      url: "/dashboard/settings",
      icon: IconSettings,
      roles: ["gm", "officer"]
    },
    {
      title: "Ayuda",
      url: "#",
      icon: IconHelp,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const roleLevel = session?.user?.roleLevel ?? "member"
  const [iconUrl, setIconUrl] = React.useState<string | null>(null)
  const [permissions, setPermissions] = React.useState<any[]>([])

  React.useEffect(() => {
    fetch("/api/guild/permissions")
      .then(res => res.json())
      .then(data => setPermissions(data))
      .catch(err => console.error("Failed to fetch permissions:", err))
  }, [])

  const hasViewPermission = (appId: string) => {
    if (roleLevel === 'gm') return true
    const p = permissions.find(p => p.role_level === roleLevel && p.app_id === appId)
    if (!p) {
      // Fallbacks
      if (roleLevel === 'officer') return true
      if (roleLevel === 'raider') return true
      return false
    }
    return p.can_view
  }

  const filteredMain = data.navMain.filter(item => {
    if ((item as any).appId) return hasViewPermission((item as any).appId)
    return true
  })

  const filteredSecondary = data.navSecondary.filter(item => {
    if (!(item as any).roles) return true
    return (item as any).roles.includes(roleLevel)
  })

  React.useEffect(() => {
    fetch("/api/guild/info")
      .then(res => res.json())
      .then(data => {
        if (data?.icon_url) {
          setIconUrl(data.icon_url)
        }
      })
      .catch(err => console.error("Failed to fetch guild icon:", err))
  }, [])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
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
                <span className="text-base font-semibold truncate">Artic Tempest</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredMain} />
        <NavSecondary items={filteredSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
