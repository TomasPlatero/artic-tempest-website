import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/infrastructure/auth/auth-options"
import { getAppPermission } from "@/infrastructure/auth/permissions"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { BisAdminClient } from "@/components/bis/bis-admin-client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Download } from "lucide-react"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function BisAdminPage() {
    const session = await getServerSession(authOptions)
    if (!session) redirect("/")

    const roleLevel = session.user?.roleLevel ?? "member"
    const { canEdit } = await getAppPermission(roleLevel, 'bis')

    // Only allow if they can edit (Officers/GM)
    if (!canEdit) redirect("/dashboard/bis")

    const style = {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    return (
        <SidebarProvider style={style}>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-4 md:p-6 gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Lista de Deseos</h1>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1 opacity-60">Panel de Oficiales</p>
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2 uppercase font-bold tracking-widest text-[10px] border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:text-emerald-500 transition-all active:scale-95"
                        >
                            <Link href="/dashboard/settings/apps/bis/export">
                                <Download className="w-3.5 h-3.5" />
                                Exportar para Addon
                            </Link>
                        </Button>
                    </div>
                    <BisAdminClient />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
