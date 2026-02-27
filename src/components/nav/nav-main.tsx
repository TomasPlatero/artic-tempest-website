"use client"

import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/common/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    badge?: string | number
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild className="relative">
                <a href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {item.badge !== undefined && item.badge !== null && item.badge !== 0 && (
                    <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-black text-blue-400 border border-blue-500/20">
                      {item.badge}
                    </span>
                  )}
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
