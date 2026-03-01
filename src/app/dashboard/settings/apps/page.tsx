import Link from "next/link"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
            description: "Gestión de visibilidad y acceso a las listas de equipo óptimo.",
            icon: IconId,
            href: "/dashboard/settings/apps/bis",
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            disabled: true
        },
        {
            title: "Planificador de CD's",
            description: "Gestión de tiempos de sanación y configuración de notas para MRT.",
            icon: IconStethoscope,
            href: "/dashboard/settings/apps/planificador-cds",
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            disabled: true
        },
    ]

    return (
        <div className="flex flex-col gap-8 p-6 md:p-10 pb-32 w-full max-w-full">
            <div className="flex items-center gap-6">
                <Link href="/dashboard/settings">
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5 border-white/10 shadow-xl transition-all">
                        <IconArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Configuración de Apps</h1>
                    <p className="text-sm text-white/40 font-medium mt-1 tracking-wide">
                        Ajustes específicos para cada módulo del Dashboard
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4 w-full">
                {apps.map((app) => {
                    const Icon = app.icon;
                    return app.disabled ? (
                        <Card key={app.href} className="opacity-40 cursor-not-allowed border-dashed bg-zinc-950/20 rounded-[2rem] border-white/5 relative overflow-hidden group/disabled grayscale">
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
                            <CardHeader className="flex flex-row items-center gap-6 p-8 relative z-10">
                                <div className={`p-4 rounded-2xl ${app.bg} ${app.color} shrink-0 border border-white/5 shadow-xl`}>
                                    <Icon className="w-8 h-8" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <div className="flex items-center gap-3">
                                        <CardTitle className="text-xl font-black uppercase tracking-tight">{app.title}</CardTitle>
                                        <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 uppercase font-black text-white/30 tracking-[0.2em]">Próximamente</span>
                                    </div>
                                    <CardDescription className="mt-2 leading-relaxed text-sm font-medium">
                                        {app.description}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    ) : (
                        <Link href={app.href} key={app.href} className="group/card transition-all duration-500 hover:-translate-y-2">
                            <Card className="h-full relative overflow-hidden bg-zinc-950/40 border-white/[0.08] backdrop-blur-3xl rounded-[2rem] shadow-2xl ring-1 ring-white/5 group-hover/card:ring-primary/30 group-hover/card:border-primary/20 transition-all duration-500">
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover/card:scale-x-100 transition-transform duration-700 origin-center rounded-full blur-[1px]" />
                                <CardHeader className="flex flex-row items-center gap-6 p-8">
                                    <div className={`p-4 rounded-2xl ${app.bg} ${app.color} shrink-0 shadow-2xl border border-white/10 group-hover/card:scale-110 group-hover/card:rotate-3 transition-all duration-500`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <CardTitle className="text-xl font-black uppercase tracking-tight text-white group-hover/card:text-primary transition-colors duration-500">{app.title}</CardTitle>
                                        <CardDescription className="mt-2 leading-relaxed text-sm font-medium text-white/40 group-hover/card:text-white/60 transition-colors duration-500">
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
