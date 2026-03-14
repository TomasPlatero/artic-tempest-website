"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useSession, signIn } from "next-auth/react"
import {
  IconDashboard,
  IconBell,
  IconChevronDown,
  IconMenu2,
  IconUser,
  IconDeviceMobile,
  IconSmartHome,
  IconUsers,
  IconCalendarEvent,
  IconSword,
  IconListCheck,
  IconTimeline,
  IconChartBar,
  IconListSearch,
  IconAdjustments
} from "@tabler/icons-react"
import { cn } from "@/shared/tailwind/tailwind-utils"
import { NavUser } from "@/shared/navigation/nav-user"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/shared/ui/dropdown-menu"
import { Button } from "@/shared/ui/button"
import { supabase } from "@/shared/supabase/client"
import {
  SidebarTrigger
} from "@/shared/components/sidebar"
import { getIconByName } from "@/shared/lib/icon-utils"
import { useIsMobile } from "@/shared/hooks/use-mobile"

export function DashboardTopNav({ guildName, iconUrl }: { guildName: string, iconUrl?: string | null }) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [navItems, setNavItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [mobileIconUrl, setMobileIconUrl] = React.useState<string | null>(null)
  const [version, setVersion] = React.useState<string>("v1.0.0 (dynamic)")
  const isMobile = useIsMobile()

  const fetchData = React.useCallback(async () => {
    try {
      // Fetch dynamic menu from API
      const navRes = await fetch("/api/navigation")
      const navData = await navRes.json()
      if (!navRes.ok) throw new Error(navData.error)
      setNavItems(navData)

      // Fetch guild info for mobile icon
      const guildRes = await fetch("/api/guild/info")
      const guildData = await guildRes.json()
      if (guildRes.ok && guildData.mobile_icon_url) {
        setMobileIconUrl(guildData.mobile_icon_url)
      }
      if (guildRes.ok && guildData.version) {
        setVersion(guildData.version)
      }
      // Fetch notifications
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session?.user?.id)
        .is("read_at", null)

      if (error) throw error
      setUnreadCount(count || 0)
    } catch (error) {
      console.error("Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  React.useEffect(() => {
    if (status === "authenticated") {
      fetchData()
    }
  }, [status, fetchData])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-[#0d0d12]/80 backdrop-blur-3xl">
      <div className="mx-auto max-w-[1600px] h-16 px-4 md:px-6 flex items-center justify-between gap-4 relative">
        {/* Mobile Sidebar Trigger (Left) */}
        {isMobile && (
          <SidebarTrigger className="h-9 w-9 text-zinc-400 hover:text-white hover:bg-white/[0.03] rounded-xl z-20" />
        )}

        <div className={cn(
          "flex items-center flex-1 transition-all duration-300",
          isMobile ? "justify-center absolute inset-x-0" : "gap-4"
        )}>
          {/* Logo & Guild Info */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group transition-all"
          >
            <div className={cn(
              "relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/10 group-hover:border-blue-500/30 transition-all shadow-xl shadow-blue-500/5",
              isMobile ? "h-10 w-auto bg-transparent border-none shadow-none overflow-visible rounded-none" : "size-10"
            )}>
              {isMobile && mobileIconUrl ? (
                <Image src={mobileIconUrl} alt={guildName} width={100} height={40} className="h-full w-auto object-contain" />
              ) : iconUrl ? (
                <Image src={iconUrl} alt={guildName} width={40} height={40} className="size-full object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center">
                  <IconDashboard className="size-5 text-blue-400" />
                </div>
              )}
              {!isMobile && <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />}
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-sm font-black text-white tracking-tight leading-none group-hover:text-blue-400 transition-colors uppercase">
                {guildName}
              </span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none mt-1.5 flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-blue-500 animate-pulse" />
                {version}
              </span>
            </div>
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-1 px-8">
            {navItems
              .filter(item => !item.visibility || item.visibility === 'all' || item.visibility === 'pc-only')
              .map((item) => {
                const checkActive = (navItem: any): boolean => {
                  if (navItem.url) {
                    if (navItem.url === "/dashboard") return pathname === "/dashboard"
                    if (pathname === navItem.url || pathname?.startsWith(navItem.url + '/')) return true
                  }
                  return navItem.children?.some((child: any) => checkActive(child)) || false
                }
                const isActive = checkActive(item)

                const Icon = getIconByName(item.icon_name)
                const hasChildren = item.children && item.children.length > 0
                const customClass = item.css_class || ""
                const elementId = item.element_id || undefined

                // For TopNav: Categories with children become dropdowns
                if (hasChildren) {
                  return (
                    <DropdownMenu key={item.id}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          id={elementId}
                          variant="ghost"
                          className={cn(
                            "h-9 px-4 rounded-xl text-[13px] font-bold gap-2 transition-all",
                            isActive
                              ? "text-blue-400"
                              : "text-zinc-400 hover:text-white hover:bg-white/[0.03]",
                            customClass
                          )}
                        >
                          <Icon className={cn("size-4", isActive ? "text-blue-400" : "text-zinc-500")} />
                          {item.name}
                          <IconChevronDown className="size-3 opacity-40 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56 bg-[#0d0d12]/95 backdrop-blur-2xl border-white/10 p-1.5 rounded-xl shadow-2xl">
                        {item.children.map((child: any) => {
                          const ChildIcon = getIconByName(child.icon_name)
                          return (
                            <DropdownMenuItem key={child.id} asChild className="rounded-lg focus:bg-blue-500/10 focus:text-white cursor-pointer group py-2">
                              <Link href={child.url} id={child.element_id} className={cn("flex items-center gap-3", child.css_class)}>
                                <ChildIcon className="size-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                                <span className="text-[13px] font-medium">{child.name}</span>
                              </Link>
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                }

                // Direct links
                if (item.url) {
                  return (
                    <Link
                      key={item.id}
                      id={elementId}
                      href={item.url}
                      className={cn(
                        "relative h-9 px-4 flex items-center gap-2.5 rounded-xl text-[13px] font-bold transition-all group",
                        isActive
                          ? "text-blue-400"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.03]",
                        customClass
                      )}
                    >
                      <Icon className={cn(
                        "size-4 transition-transform group-hover:scale-110",
                        isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-blue-400"
                      )} />
                      {item.name}
                      {isActive && (
                        <span className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      )}
                    </Link>
                  )
                }

                return null
              })}
          </nav>
        </div>

        {/* Right Section: Actions & User */}
        <div className="flex items-center gap-2 sm:gap-3 z-20">
          {/* Download App CTA - Desktop Only */}
          {!isMobile && (
            <Link href="/api/download/latest-exe" prefetch={false}>
              <Button
                className="h-9 gap-2 px-4 rounded-xl relative group overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-black uppercase tracking-widest text-[10px] border border-blue-400/20 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <IconDeviceMobile className="size-3.5 mr-2 group-hover:scale-110 transition-transform" />
                Descargar App
              </Button>
            </Link>
          )}

          <div className="h-4 w-px bg-white/5 mx-1 hidden sm:block" />

          {/* Notifications - Desktop Only */}
          {!isMobile && (
            <Link href="/dashboard/notificaciones">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 text-zinc-400 hover:text-white hover:bg-white/[0.03] rounded-xl group/bell">
                <IconBell className={cn("size-5 transition-transform group-hover/bell:rotate-12", unreadCount > 0 && "text-blue-400")} />
                {unreadCount > 0 && (
                  <>
                    <div className="absolute top-1.5 right-1.5 size-2 bg-blue-500 rounded-full border-2 border-[#0d0d12] z-10" />
                    <div className="absolute top-1.5 right-1.5 size-2 bg-blue-400 rounded-full animate-ping opacity-75" />
                  </>
                )}
              </Button>
            </Link>
          )}

          <NavUser hideNameOnMobile={isMobile} />
        </div>
      </div>
    </header>
  )
}
