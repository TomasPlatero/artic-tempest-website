import Link from "next/link"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconArrowLeft, IconUsers, IconCalendar, IconChartBar, IconId, IconStethoscope } from "@tabler/icons-react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import React from "react"

export default function AppsSettingsHubPage() {
    const apps = [
        {
            title: "Gestión de Roster",
            description: "Configura qué rangos son visibles en la lista pública de la hermandad.",
            icon: IconUsers,
            href: "/dashboard/settings/apps/roster",
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "Calendario de Eventos",
            description: "Ajustes de visibilidad y comportamiento del calendario de banda.",
            icon: IconCalendar,
            href: "/dashboard/settings/apps/calendar",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            title: "Estadísticas y Logs",
            description: "Configuración de la integración con WarcraftLogs y visualización de datos.",
            icon: IconChartBar,
            href: "/dashboard/settings/apps/stats",
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            disabled: true
        },
        {
            title: "BiS List (Best in Slot)",
            description: "Gestión de listas BiS e importación de botín desde Wowhead.",
            icon: IconId,
            href: "/dashboard/settings/apps/bis",
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            title: "Planificador de CD's",
            description: "Gestión de habilidades de raid y configuración de notas para MRT.",
            icon: IconStethoscope,
            href: "/dashboard/settings/apps/planificador-cds",
            color: "text-blue-400",
            bg: "bg-blue-400/10",
        },
    ]

    return (
        <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <IconArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Configuración de Apps</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Ajustes específicos para cada módulo del Dashboard
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4 w-full">
                {apps.map((app) => {
                    const Icon = app.icon;
                    return app.disabled ? (
                        <Card key={app.href} className="h-full overflow-hidden border-border/40 bg-card/20 backdrop-blur-sm opacity-50 cursor-not-allowed border-dashed">
                            <CardHeader className="flex flex-row items-center gap-4 py-4 px-5 grayscale">
                                <div className={`p-2.5 rounded-xl ${app.bg} ${app.color} shrink-0 shadow-sm border border-white/5`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg">{app.title}</CardTitle>
                                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest px-1.5 py-0 h-4">Beta</Badge>
                                    </div>
                                    <CardDescription className="mt-1.5 leading-snug">
                                        {app.description}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    ) : (
                        <Link href={app.href} key={app.href} className="transition-all hover:scale-[1.02]">
                            <Card className="h-full hover:border-primary/50 cursor-pointer overflow-hidden border-border/40 bg-card/40 backdrop-blur-sm">
                                <CardHeader className="flex flex-row items-center gap-4 py-4 px-5">
                                    <div className={`p-2.5 rounded-xl ${app.bg} ${app.color} shrink-0 shadow-sm border border-white/5`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <CardTitle className="text-lg">{app.title}</CardTitle>
                                        <CardDescription className="mt-1.5 leading-snug">
                                            {app.description}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    )
}
