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
} from "@/shared/components/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible"
import { cn } from "@/shared/tailwind/tailwind-utils"
import { getIconByName } from "@/shared/lib/icon-utils"

export function NavMain({
  items,
  label,
  activeUrl
}: {
  label?: string
  items: any[]
  activeUrl?: string
}) {
  const pathname = usePathname()

  const renderItem = (item: any) => {
    const checkActive = (navItem: any): boolean => {
      const urlToMatch = activeUrl || pathname
      if (navItem.url) {
        if (navItem.url === "/dashboard") return urlToMatch === "/dashboard"
        if (urlToMatch === navItem.url || urlToMatch?.startsWith(navItem.url + '/')) return true
      }
      return navItem.children?.some((child: any) => checkActive(child)) || false
    }
    const isActive = checkActive(item)
    const hasChildren = item.children && item.children.length > 0
    const IconComponent = getIconByName(item.icon_name)

    if (hasChildren) {
      return (
        <SidebarMenuItem key={item.id || item.name}>
          <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
            <div className="flex flex-col">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton 
                  id={item.element_id}
                  tooltip={item.name} 
                  className={cn(
                    "transition-all duration-300 h-10 rounded-xl",
                    isActive 
                      ? "bg-blue-500/[0.08] text-white font-semibold border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.05)]" 
                      : "text-muted-foreground hover:text-white hover:bg-white/[0.03] hover:border hover:border-white/[0.05] active:bg-white/10",
                    item.css_class
                  )}>
                  <IconComponent className={cn(
                    "size-4.5 transition-transform duration-300 group-hover/collapsible:scale-110",
                    isActive && "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]"
                  )} />
                  <span className="ml-3 tracking-wide text-[13.5px]">{item.name}</span>
                  <IconChevronRight className="ml-auto size-3.5 opacity-40 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90" />
                  {isActive && (
                    <>
                      <div className="absolute left-0 top-2.5 bottom-2.5 w-[2px] bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,1)]" />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.05] to-transparent pointer-events-none" />
                    </>
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="border-l border-white/5 ml-4.5 pl-4 gap-1.5 py-1">
                  {item.children.map((child: any) => (
                    <SidebarMenuSubItem key={child.id || child.name}>
                      <SidebarMenuSubButton 
                        id={child.element_id}
                        asChild 
                        className={cn(
                          "transition-all duration-200 rounded-lg h-8.5",
                          (activeUrl ? child.url === activeUrl : pathname === child.url) 
                            ? "text-blue-400 font-semibold bg-blue-500/[0.05]" 
                            : "text-muted-foreground/70 hover:text-white hover:bg-white/[0.03]",
                          child.css_class
                        )}
                        isActive={activeUrl ? child.url === activeUrl : pathname === child.url}
                      >
                        <a href={child.url}>
                          <span className="text-[13px] tracking-wide">{child.name}</span>
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
          id={item.element_id}
          tooltip={item.name}
          asChild
          className={cn(
            "relative transition-all duration-300 group/nav-item overflow-hidden rounded-xl h-10",
            isActive 
              ? "bg-blue-500/[0.08] text-white font-semibold border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] active:scale-[0.98]" 
              : "text-muted-foreground hover:text-white hover:bg-white/[0.03] hover:border hover:border-white/[0.05] active:bg-white/10 active:scale-[0.98]",
            item.css_class
          )}
        >
          <a href={item.url} className="flex items-center w-full px-3">
            <IconComponent className={cn(
              "size-4.5 transition-all duration-300",
              isActive ? "text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.6)]" : "group-hover/nav-item:scale-110 group-hover/nav-item:text-white"
            )} />
            <span className="ml-3 tracking-wide text-[13.5px]">{item.name}</span>
            {item.badge !== undefined && item.badge !== null && item.badge !== 0 && (
              <span className="ml-auto flex min-w-4.5 h-4.5 px-1.5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white border border-blue-400/20 shadow-[0_0_10px_rgba(37,99,235,0.3)] animate-in fade-in zoom-in duration-500">
                {item.badge}
              </span>
            )}
            {isActive && (
              <>
                <div className="absolute left-0 top-2.5 bottom-2.5 w-[2px] bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,1)]" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.05] to-transparent pointer-events-none" />
              </>
            )}
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarGroup>
      {label && (
        <SidebarGroupLabel className="text-[10px] font-black tracking-[0.25em] text-muted-foreground/30 uppercase pt-6 pb-2 px-4 select-none">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(renderItem)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
