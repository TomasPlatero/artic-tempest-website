import Link from "next/link"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconArrowLeft, IconUsers, IconCalendar, IconChartBar, IconId } from "@tabler/icons-react"

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
    ]

    return (
        <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
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

            <div className="grid gap-4 md:grid-cols-2 mt-4">
                {apps.map((app) => {
                    const Icon = app.icon;
                    return app.disabled ? (
                        <Card key={app.href} className="opacity-60 cursor-not-allowed border-dashed">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className={`p-3 rounded-lg ${app.bg} ${app.color}`}>
                                    <Icon className="w-8 h-8" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg">{app.title}</CardTitle>
                                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/50 uppercase font-bold text-muted-foreground tracking-wider">Próximamente</span>
                                    </div>
                                    <CardDescription className="mt-1.5 leading-snug">
                                        {app.description}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    ) : (
                        <Link href={app.href} key={app.href} className="transition-all hover:scale-[1.02]">
                            <Card className="h-full hover:border-primary/50 cursor-pointer">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <div className={`p-3 rounded-lg ${app.bg} ${app.color}`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <div className="flex flex-col">
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
