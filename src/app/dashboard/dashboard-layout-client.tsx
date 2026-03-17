"use client"

import * as React from "react"
import { SidebarProvider } from "@/shared/components/sidebar"
import { DashboardTopNav } from "@/shared/layout/dashboard-top-nav"
import { AppSidebar } from "@/shared/layout/app-sidebar"
import { useSession } from "next-auth/react"
import { useIsMobile } from "@/shared/hooks/use-mobile"
import { redirect } from "next/navigation"

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const [guildInfo, setGuildInfo] = React.useState<{ name: string; iconUrl: string | null }>({
    name: "Artic Tempest",
    iconUrl: null
  })

  React.useEffect(() => {
    fetch("/api/guild/info")
      .then(res => res.json())
      .then(data => {
        if (data) {
          setGuildInfo({
            name: data.name || "Artic Tempest",
            iconUrl: data.icon_url || null
          })
        }
      })
      .catch(err => console.error("Failed to fetch guild info:", err))
  }, [])

  const isMobile = useIsMobile()

  if (status === "loading") return null
  if (status === "unauthenticated") {
    redirect("/")
  }

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full bg-[#020203] overflow-hidden">
        {/* Premium Background Layers */}
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-[0.25] pointer-events-none"
          style={{ backgroundImage: 'url("/assets/images/midnight-battle.webp")' }}
        />
        <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#020203] via-[#020203]/40 to-transparent pointer-events-none" />
        <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent)] pointer-events-none hidden desktop:block" />

        {isMobile && <AppSidebar />}
        
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          <DashboardTopNav guildName={guildInfo.name} iconUrl={guildInfo.iconUrl} />
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto max-w-[1600px] w-full px-4 md:px-6 py-6 transition-all duration-500 ease-in-out">
              {children}
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}
