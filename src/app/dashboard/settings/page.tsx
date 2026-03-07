import Link from "next/link"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { IconBell, IconApi, IconBuildingStore, IconDeviceGamepad, IconUsers, IconLayoutCards, IconSearch, IconBrandDiscord, IconBrandTwitch } from "@tabler/icons-react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import React from "react"

import { Forbidden } from "@/components/common/forbidden"
import { getAppPermission } from "@/infrastructure/auth/permissions"
import { getServerSession } from "next-auth"
import { authOptions } from "@/infrastructure/auth/auth-options"

export default async function SettingsHubPage() {
    const session = await getServerSession(authOptions)
    const roleLevel = session?.user?.roleLevel ?? "member"
    const { canView } = await getAppPermission(roleLevel, "settings")

    if (!canView) {
        return (
            <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
                <Forbidden />
            </div>
        )
    }

    const internalSettings = [
        {
            title: "Configuración del Dashboard",
            description: "Información de la hermandad, logotipo y visibilidad de rangos de World of Warcraft.",
            icon: IconBuildingStore,
            href: "/dashboard/settings/general",
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "Personalización del Menú",
            description: "Gestiona los enlaces de la barra lateral, su orden, iconos y permisos de visibilidad por rol.",
            icon: IconLayoutCards,
            href: "/dashboard/settings/menu",
            color: "text-orange-500",
            bg: "bg-orange-500/10"
        },
        {
            title: "Widgets del Dashboard",
            description: "Configura el orden, visibilidad y contenido de los widgets (Banner, Raid, Custom, etc.) de la portada.",
            icon: IconLayoutCards,
            href: "/dashboard/settings/widgets",
            color: "text-cyan-500",
            bg: "bg-cyan-500/10"
        },
        {
            title: "Configuración de Battle.net",
            description: "Sincronización del roster de la banda desde la Armería oficial, tokens API y reseteo.",
            icon: IconDeviceGamepad,
            href: "/dashboard/settings/bnet",
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        },
        {
            title: "Gestión de Cuentas",
            description: "Estado de vinculación Discord/Battle.net, tokens y verificación manual de miembros.",
            icon: IconUsers,
            href: "/dashboard/settings/accounts",
            color: "text-indigo-500",
            bg: "bg-indigo-500/10"
        },
        {
            title: "Roles y Accesos",
            description: "Configuración de permisos (CRUD y visibilidad) para cada rol del sistema.",
            icon: IconLayoutCards,
            href: "/dashboard/settings/roles",
            color: "text-green-500",
            bg: "bg-green-500/10"
        },
        {
            title: "Configuración de Apps",
            description: "Ajustes específicos para cada módulo del dashboard (Roster, Calendario, etc.).",
            icon: IconLayoutCards,
            href: "/dashboard/settings/apps",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        {
            title: "Notificaciones del Sistema",
            description: "Envía comunicados y avisos globales a todos los usuarios de la plataforma.",
            icon: IconBell,
            href: "/dashboard/settings/notifications",
            color: "text-rose-500",
            bg: "bg-rose-500/10"
        },
        {
            title: "Documentación API",
            description: "Información técnica sobre los endpoints del sistema (estilo Swagger) para consultas externas.",
            icon: IconApi,
            href: "/dashboard/settings/api",
            color: "text-purple-500",
            bg: "bg-purple-500/10"
        },
    ]

    const publicSettings = [
        {
            title: "Bot de Discord",
            description: "Vinculación de la App, gestión de Slash Commands y sincronización de comandos.",
            icon: IconBrandDiscord,
            href: "/dashboard/settings/discord",
            color: "text-[#5865F2]",
            bg: "bg-[#5865F2]/10"
        },
        {
            title: "Twitch Streamers",
            description: "Añade a los creadores de contenido de la hermandad para su promoción en la web.",
            icon: IconBrandTwitch,
            href: "/dashboard/settings/streamers",
            color: "text-purple-400",
            bg: "bg-purple-400/10"
        },
        {
            title: "Reclutamiento",
            description: "Gestiona las vacantes de clase, prioridades y el formulario de aplicación público.",
            icon: IconSearch,
            href: "/dashboard/settings/recruitment",
            color: "text-blue-400",
            bg: "bg-blue-400/10"
        },
    ]

    const renderCards = (items: typeof internalSettings) => (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 w-full">
            {items.map((category) => {
                const Icon = category.icon;
                return (
                    <Link href={category.href} key={category.href} className="transition-all hover:scale-[1.02]">
                        <Card className="h-full hover:border-primary/50 cursor-pointer overflow-hidden border-border/40 bg-card/40 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center gap-4 py-4 px-5">
                                <div className={`p-2.5 rounded-xl ${category.bg} ${category.color} shrink-0 shadow-sm border border-white/5`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <CardTitle className="text-lg">{category.title}</CardTitle>
                                    <CardDescription className="mt-1.5 leading-snug">
                                        {category.description}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                );
            })}
        </div>
    )

    return (
        <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
            <div>
                <h1 className="text-2xl font-bold">Ajustes</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Panel de control centralizado — accesible para el Guild Master y Oficiales
                </p>
            </div>

            <div className="flex flex-col gap-8 mt-4">
                <section>
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-4">Gestión Interna</h2>
                    {renderCards(internalSettings)}
                </section>

                <section>
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-4">Parte Pública</h2>
                    {renderCards(publicSettings)}
                </section>
            </div>
        </div>
    )
}
