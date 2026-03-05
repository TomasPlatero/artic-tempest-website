import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { RecruitmentListClient } from "@/components/recruitment/recruitment-list-client"
import React from "react"

export default async function RecruitmentListPage() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        redirect("/dashboard")
    }

    // Fetch applications
    const { data: applications } = await supabaseAdmin.from("recruitment_applications")
        .select("*")
        .order("created_at", { ascending: false })

    // Fetch class constants for mapping
    const { data: classConstants } = await supabaseAdmin.from("game_constants")
        .select("key, value, metadata")
        .eq("category", "wow_class")

    const style = {
        "--sidebar-width": "calc(var(--spacing) * 64)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    return (
        <SidebarProvider style={style}>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col py-6 gap-6 px-4 lg:px-6">
                    <div>
                        <h1 className="text-2xl font-bold">Gestión de Reclutamiento</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Revisa y gestiona las solicitudes de ingreso a la hermandad.
                        </p>
                    </div>

                    <RecruitmentListClient
                        initialApplications={applications || []}
                        classConstants={classConstants || []}
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
