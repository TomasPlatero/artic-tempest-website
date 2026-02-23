"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconSearch,
  IconSettings,
  IconUsers,
  IconCalendarEvent,
  IconListCheck,
  IconPlus,
  IconMail,
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
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/common/sidebar"
import { Button } from "@/components/ui/button"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Roster",
      url: "/dashboard/roster",
      icon: IconUsers,
    },
    {
      title: "Estadísticas",
      url: "/dashboard/estadisticas",
      icon: IconChartBar,
    },

    {
      title: "Calendario",
      url: "/dashboard/calendario",
      icon: IconCalendarEvent,
    },
    {
      title: "Lista de Deseos de BiS",
      url: "/dashboard/bis",
      icon: IconListCheck,
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
  const roleLevel = session?.user?.roleLevel ?? "raider"
  const [iconUrl, setIconUrl] = React.useState<string | null>(null)

  const filteredSecondary = data.navSecondary.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(roleLevel)
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
                  <img src={iconUrl} alt="Guild Logo" className="size-5 rounded-full object-cover shrink-0 border border-border/30" />
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
        <NavMain items={data.navMain} />
        <NavSecondary items={filteredSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
