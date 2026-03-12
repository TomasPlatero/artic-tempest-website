"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { SidebarTrigger } from "@/shared/components/sidebar"
import { Skeleton } from "@/shared/ui/skeleton"

export function SiteHeader() {
  const [icons, setIcons] = useState<{ main: string | null; mobile: string | null }>({ main: null, mobile: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGuildInfo() {
      try {
        const res = await fetch("/api/guild/info")
        if (res.ok) {
          const data = await res.json()
          setIcons({
            main: data.icon_url,
            mobile: data.mobile_icon_url
          })
        }
      } catch (error) {
        console.error("Error fetching guild info for header:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchGuildInfo()
  }, [])

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b lg:hidden bg-background/50 backdrop-blur-sm z-50">
      <div className="flex w-full items-center justify-between gap-1 px-4">
        <SidebarTrigger className="-ml-1 size-8" />

        <div className="flex-1 flex justify-center pr-8">
          {loading ? (
            <Skeleton className="h-6 w-32 bg-white/5" />
          ) : (icons.mobile || icons.main) ? (
            <div className="relative h-25 w-48">
              <Image
                src={icons.mobile || icons.main || ""}
                alt="Logo"
                fill
                className="object-contain object-center"
                priority
              />
            </div>
          ) : (
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40 italic">
              Artic Tempest
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
