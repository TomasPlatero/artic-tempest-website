"use client"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { PlanificadorCdsClient } from "@/components/planificador-cds/planificador-cds-client"

export default function PlanificadorCdsPage() {
    const style = {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    return (
        <SidebarProvider style={style}>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col py-6 max-w-[1600px] mx-auto w-full px-4 gap-6">
                    <PlanificadorCdsClient />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
