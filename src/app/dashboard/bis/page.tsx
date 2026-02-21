// src/app/dashboard/bis/page.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { BisClient, BisItem } from "@/components/bis/bis-client"

export const runtime = "nodejs"

async function getWishlist(profileId: string): Promise<BisItem[]> {
    // First, get the linked guild member for this profile
    const { data: member } = await sb
        .from("guild_members")
        .select("id")
        .eq("profile_id", profileId)
        .limit(1)
        .single()

    if (!member) return []

    const { data } = await sb
        .from("bis_wishlist")
        .select("id, item_name, slot, priority")
        .eq("member_id", member.id)
        .order("priority", { ascending: true })

    return data ?? []
}

export default async function BisPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    const wishlist = await getWishlist(session.user.id)

    const style = {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    return (
        <SidebarProvider style={style}>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
                    <BisClient initialWishlist={wishlist} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
