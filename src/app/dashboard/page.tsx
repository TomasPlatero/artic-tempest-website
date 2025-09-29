// src/app/dashboard/page.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/infrastructure/auth/auth-options"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { ChartAreaInteractive } from "@/components/common/chart-area-interactive"
import { DataTable } from "@/components/common/data-table"
import { SectionCards } from "@/components/layout/section-cards"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"

import data from "./data.json"

export const runtime = "nodejs"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect("/login")
  }

  const style = {
    "--sidebar-width": "calc(var(--spacing) * 72)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties

  return (
    <SidebarProvider style={style}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
