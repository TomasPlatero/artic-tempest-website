import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { RolesClient, DiscordRoleMapping } from "@/components/roles/roles-client"

export const runtime = "nodejs"

async function getRoleMappings(): Promise<DiscordRoleMapping[]> {
    const { data } = await sb
        .from("discord_role_mappings")
        .select("id, discord_role_id, role_name, app_role")
        .order("created_at", { ascending: false })

    return data ?? []
}

export default async function RolesPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    // Only GM can manage roles
    if (session.user?.roleLevel !== "gm") {
        redirect("/dashboard")
    }

    const mappings = await getRoleMappings()

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
                    <div>
                        <h1 className="text-2xl font-bold">Roles y Permisos</h1>
                        <p className="text-sm text-muted-foreground">
                            Mapea los roles de tu servidor de Discord a niveles de acceso en el GuildBoard. Solo modificable por el GM.
                        </p>
                    </div>
                    <RolesClient initialMappings={mappings} />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
