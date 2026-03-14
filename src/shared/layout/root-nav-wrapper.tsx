"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider } from "@/shared/components/sidebar"
import { DashboardTopNav } from "@/shared/layout/dashboard-top-nav"
import { LandingFooter } from "@/domains/landing/components/footer"

export function RootNavWrapper({ 
  children,
  guildInfo 
}: { 
  children: React.ReactNode,
  guildInfo: { name: string, iconUrl: string | null }
}) {
  const pathname = usePathname()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <>{children}</>

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#020203]">
      {/* Global Background Layer */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-60 mix-blend-luminosity pointer-events-none scale-105"
        style={{ backgroundImage: "url('/assets/images/midnight-battle.webp')" }}
      />
      
      {/* Global Overlays */}
      <div className="fixed inset-0 bg-gradient-to-t from-[#020203] via-[#020203]/60 to-transparent pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent)] pointer-events-none" />
      <div className="fixed inset-0 backdrop-blur-[2px] pointer-events-none opacity-50" />

      {/* Global Navigation and Provider */}
      <SidebarProvider className="flex flex-col">
        <DashboardTopNav 
          guildName={guildInfo.name} 
          iconUrl={guildInfo.iconUrl}
        />
        
        {/* Main Content Area - Centered by default */}
        <main className="relative z-10 flex-1 flex flex-col w-full max-w-[1600px] mx-auto min-h-[calc(100vh-80px-300px)] px-4 lg:px-6 py-6 transition-all duration-300">
          {children}
        </main>

        <LandingFooter />
      </SidebarProvider>
    </div>
  )
}
