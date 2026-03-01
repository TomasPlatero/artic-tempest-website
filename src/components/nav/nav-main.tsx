"use client"

import { type Icon, IconChevronRight } from "@tabler/icons-react"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from "@/components/common/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"

export function NavMain({
  items,
  label
}: {
  label?: string
  items: {
    title: string
    url: string
    icon?: Icon
    badge?: string | number
  }[]
}) {
  const pathname = usePathname()

  const content = (
    <SidebarMenu>
      {items.map((item) => {
        const isExact = pathname === item.url
        const isDashboard = item.url === '/dashboard'
        const isHome = item.url === '/'
        const isSettings = item.url === '/dashboard/settings'
        const isBis = item.url === '/dashboard/bis'

        const isActive = isExact || (!isHome && !isDashboard && !isSettings && !isBis && pathname.startsWith(item.url + '/'))

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              asChild
              className={cn(
                "relative transition-all duration-200",
                isActive ? "bg-blue-500/10 text-blue-400 font-bold" : "text-muted-foreground hover:text-white"
              )}
            >
              <a href={item.url}>
                {item.icon && <item.icon className={cn("size-4", isActive && "text-blue-400")} />}
                <span>{item.title}</span>
                {item.badge !== undefined && item.badge !== null && item.badge !== 0 && (
                  <span className="ml-auto flex min-w-5 h-5 px-1.5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white border border-blue-400/20 shadow-[0_0_12px_rgba(37,99,235,0.4)] animate-in fade-in zoom-in duration-300">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                )}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )

  const isCollapsible = label === "ZONA RAIDER" || label === "ADMINISTRACIÓN"

  if (isCollapsible) {
    return (
      <Collapsible defaultOpen className="group/collapsible">
        <SidebarGroup>
          <SidebarGroupLabel asChild>
            <CollapsibleTrigger className="flex w-full items-center text-[10px] font-black tracking-[0.2em] text-muted-foreground/50 hover:text-blue-400 transition-colors uppercase py-2">
              {label}
              <IconChevronRight className="ml-auto size-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent className="pt-1">
              {content}
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    )
  }

  return (
    <SidebarGroup>
      {label && (
        <SidebarGroupLabel className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50 uppercase py-2">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent className="pt-1">
        {content}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
