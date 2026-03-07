"use client"

import { IconChevronRight } from "@tabler/icons-react"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/common/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"
import { getIconByName } from "@/lib/icon-utils"

export function NavMain({
  items,
  label
}: {
  label?: string
  items: any[]
}) {
  const pathname = usePathname()

  const renderItem = (item: any) => {
    const isExact = pathname === item.url
    const isActive = isExact || (item.url !== '/' && item.url !== '/dashboard' && pathname.startsWith(item.url + '/'))
    const hasChildren = item.children && item.children.length > 0
    const IconComponent = getIconByName(item.icon_name)

    if (hasChildren) {
      return (
        <SidebarMenuItem key={item.id || item.name}>
          <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
            <div className="flex flex-col">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.name} className={cn(
                  isActive ? "text-blue-400 font-bold" : "text-muted-foreground hover:text-white"
                )}>
                  <IconComponent className="size-4" />
                  <span>{item.name}</span>
                  <IconChevronRight className="ml-auto size-3 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.children.map((child: any) => (
                    <SidebarMenuSubItem key={child.id || child.name}>
                      <SidebarMenuSubButton asChild isActive={pathname === child.url}>
                        <a href={child.url}>
                          <span>{child.name}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </SidebarMenuItem>
      )
    }

    return (
      <SidebarMenuItem key={item.id || item.name}>
        <SidebarMenuButton
          tooltip={item.name}
          asChild
          className={cn(
            "relative transition-all duration-200",
            isActive ? "bg-blue-500/10 text-blue-400 font-bold" : "text-muted-foreground hover:text-white"
          )}
        >
          <a href={item.url}>
            <IconComponent className={cn("size-4", isActive && "text-blue-400")} />
            <span>{item.name}</span>
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
  }

  return (
    <SidebarGroup>
      {label && (
        <SidebarGroupLabel className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50 uppercase py-2">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent className="pt-1">
        <SidebarMenu>
          {items.map(renderItem)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
