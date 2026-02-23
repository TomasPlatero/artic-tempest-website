import Link from "next/link"
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { IconSettings, IconDeviceGamepad, IconUsers, IconApi } from "@tabler/icons-react"

export default function SettingsHubPage() {
    const categories = [
        {
            title: "Configuración del Dashboard",
            description: "Información de la hermandad, logotipo y visibilidad de rangos de World of Warcraft.",
            icon: IconSettings,
            href: "/dashboard/settings/general",
            color: "text-blue-500",
            bg: "bg-blue-500/10"
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
            title: "Roles y Accesos",
            description: "Mapeo y visualización de permisos (GM, Oficiales, Raiders) del servidor de Discord vinculado.",
            icon: IconUsers,
            href: "/dashboard/settings/roles",
            color: "text-green-500",
            bg: "bg-green-500/10"
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

    return (
        <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div>
                <h1 className="text-2xl font-bold">Ajustes</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Panel de control centralizado — solo accesible para el Guild Master
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 mt-4">
                {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                        <Link href={category.href} key={category.href} className="transition-all hover:scale-[1.02]">
                            <Card className="h-full hover:border-primary/50 cursor-pointer">
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <div className={`p-3 rounded-lg ${category.bg} ${category.color}`}>
                                        <Icon className="w-8 h-8" />
                                    </div>
                                    <div className="flex flex-col">
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
        </div>
    )
}
