import { Suspense } from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { PlanificadorCdsClient } from "@/components/planificador-cds/planificador-cds-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/infrastructure/auth/auth-options"
import { getAppPermission } from "@/infrastructure/auth/permissions"
import { redirect } from "next/navigation"

export default async function PlanificadorCdsPage({ searchParams }: { searchParams: Promise<{ event_id?: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session) redirect("/")

    const roleLevel = session.user?.roleLevel ?? "member"
    const { canView } = await getAppPermission(roleLevel, 'planificador-cds')

    if (!canView) {
        redirect("/dashboard")
    }

    const params = await searchParams
    const hasEventId = !!params.event_id
    const style = {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    return (
        <SidebarProvider defaultOpen={!hasEventId} style={style}>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col py-6 mx-auto w-full px-4 gap-6 min-w-0 overflow-hidden lg:px-8">
                    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Cargando planificador...</div>}>
                        <PlanificadorCdsClient />
                    </Suspense>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
