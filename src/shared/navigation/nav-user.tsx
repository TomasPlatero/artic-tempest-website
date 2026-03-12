"use client"

import * as React from "react"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import Link from "next/link"

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
  IconSun,
  IconMoon,
  IconHelp,
  IconWorld
} from "@tabler/icons-react"
import { useTheme } from "next-themes"

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/components/sidebar"

type MePayload = {
  name: string
  avatar: string
  role?: string
}

import { supabase } from "@/shared/supabase/client"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = React.useState<MePayload | null>(null)
  const [unreadCount, setUnreadCount] = React.useState(0)

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        const count = data.filter((n: any) => !n.isRead).length
        setUnreadCount(count)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    }
  }

  React.useEffect(() => {
    let active = true
      ; (async () => {
        try {
          const res = await fetch("/api/me", { credentials: "include", cache: "no-store" })
          if (!res.ok) throw new Error("failed")
          const data: MePayload = await res.json()
          if (active) setUser(data)
        } catch { }
      })()

    fetchNotifications()

    // Real-time subscription
    const channel = supabase
      .channel('nav_user_notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_notifications' },
        () => fetchNotifications()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_notifications_read' },
        () => fetchNotifications()
      )
      .subscribe()

    // Local event listener for instant sync
    const handleLocalUpdate = () => fetchNotifications()
    window.addEventListener('notifications-updated', handleLocalUpdate)

    return () => {
      active = false
      supabase.removeChannel(channel)
      window.removeEventListener('notifications-updated', handleLocalUpdate)
    }
  }, [])

  const handleLogout = async () => {
    toast.info("Sesión cerrada", {
      description: "¡Hasta pronto!",
    })
    await signOut({ callbackUrl: "/" })
  }

  const displayName = user?.name ?? "Usuario"
  const displayAvatar = user?.avatar ?? ""
  const displayRole = user?.role ?? ""

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="relative">
                {unreadCount > 0 && (
                  <div className="absolute -inset-[2px] rounded-lg ring-2 ring-blue-500 ring-offset-2 ring-offset-background animate-pulse z-20 pointer-events-none" />
                )}
                <Avatar className="h-8 w-8 rounded-lg relative z-10 transition-all duration-300">
                  <AvatarImage src={displayAvatar} alt={displayName} />
                  <AvatarFallback className="rounded-lg">
                    {displayName?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="truncate font-semibold">{displayName}</span>
                  {user?.role && (
                    <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest shrink-0">
                      {user.role}
                    </span>
                  )}
                </div>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/cuenta">
                  <IconUserCircle />
                  Cuenta
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/notificaciones" className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <IconNotification className="text-blue-500" />
                    Notificaciones
                  </div>
                  {unreadCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <IconSun className="text-amber-400" /> : <IconMoon className="text-blue-400" />}
                Cambiar tema
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/ayuda">
                  <IconHelp className="text-zinc-400" />
                  Ayuda
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout}>
              <IconLogout />
              Desconectarse
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
