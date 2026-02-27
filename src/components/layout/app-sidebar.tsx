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
  IconStethoscope,
  IconBell,
  IconWorld
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
import { Badge } from "@/components/ui/badge"

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
    {
      title: "Planificador de CD's",
      url: "/dashboard/planificador-cds",
      icon: IconStethoscope,
      appId: "planificador-cds",
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
      title: "Volver a la web",
      url: "/",
      icon: IconWorld,
    },
    {
      title: "Ayuda",
      url: "#",
      icon: IconHelp,
    },
  ],
}

import { supabase } from "@/infrastructure/supabase/client"

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
      // Por defecto, Officer, Raider y Member ven las apps básicas si no hay configuración
      if (['officer', 'raider', 'member'].includes(roleLevel)) return true
      return false
    }
    return p.can_view
  }

  const filteredMain = data.navMain.filter(item => {
    const i = item as any
    if (i.roles && !i.roles.includes(roleLevel)) return false
    if (i.appId) return hasViewPermission(i.appId)
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
                <div className="flex flex-col truncate">
                  <span className="text-base font-semibold leading-none">Artic Tempest</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-blue-500/10 text-blue-400 border-blue-500/20 font-black">v0.6.1 alpha</Badge>
                  </div>
                </div>
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
    </Sidebar >
  )
}
