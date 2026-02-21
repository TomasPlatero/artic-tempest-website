import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"

import { fetchGuildProgression, RaiderIoGuildProfile } from "@/infrastructure/raiderio/raiderio-client"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export const runtime = "nodejs"

async function getProgressionData() {
    const { data: guild } = await sb
        .from("guilds_managed")
        .select("name, realm, region")
        .limit(1)
        .single()

    if (!guild) return null

    // fetch from Raider.io API
    const rioData = await fetchGuildProgression(guild.realm, guild.name, guild.region)
    return rioData
}

export default async function ProgresoPage() {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    const rioData = await getProgressionData()

    const style = {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    // Define the raids we care about tracking (latest ones first)
    const raidKeys = [
        { key: "nerubar-palace", name: "Nerub-ar Palace" },
        { key: "liberation-of-undermine", name: "Liberation of Undermine" },
    ]

    return (
        <SidebarProvider style={style}>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-4 md:p-6 gap-6">
                    <div>
                        <h1 className="text-2xl font-bold">Progreso de Banda</h1>
                        <p className="text-sm text-muted-foreground">
                            Datos obtenidos de Raider.io
                            {rioData && (
                                <a
                                    href={rioData.profile_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-1 underline hover:text-foreground"
                                >
                                    (Ver Perfil)
                                </a>
                            )}
                        </p>
                    </div>

                    {!rioData ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                                <p>No se encontraron datos de progreso en Raider.io.</p>
                                <p className="text-sm mt-2">
                                    Asegúrate de tener una hermandad configurada con el nombre y realm exactos en la tabla <code className="bg-muted px-1 rounded">guilds_managed</code>.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {raidKeys.map(({ key, name }) => {
                                const raid = rioData.raid_progression[key]
                                if (!raid) return null // Raid not found in their progression data

                                const total = raid.total_bosses

                                // Calculate which difficulty is the highest progressed
                                let currentDifficulty = "Normal"
                                let currentKills = raid.normal_bosses_killed
                                let badgeColor = "bg-green-500/10 text-green-500 border-green-500/20"

                                if (raid.mythic_bosses_killed > 0) {
                                    currentDifficulty = "Mítico"
                                    currentKills = raid.mythic_bosses_killed
                                    badgeColor = "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                } else if (raid.heroic_bosses_killed > 0) {
                                    currentDifficulty = "Heroico"
                                    currentKills = raid.heroic_bosses_killed
                                    badgeColor = "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                } else if (raid.normal_bosses_killed === 0) {
                                    currentDifficulty = "Sin Empezar"
                                    badgeColor = "bg-muted text-muted-foreground border-muted-foreground/20"
                                }

                                const progressPercent = total > 0 ? (currentKills / total) * 100 : 0

                                return (
                                    <Card key={key} className="flex flex-col">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg">{name}</CardTitle>
                                                <Badge variant="outline" className={badgeColor}>
                                                    {currentDifficulty}
                                                </Badge>
                                            </div>
                                            <CardDescription>{raid.summary}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="mt-auto">
                                            <div className="space-y-3">
                                                {/* Summary Progress Bar */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium">
                                                            {currentKills} / {total} Bosses
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {Math.round(progressPercent)}%
                                                        </span>
                                                    </div>
                                                    <Progress value={progressPercent} className="h-2" />
                                                </div>

                                                {/* Detailed breakdown */}
                                                <div className="pt-2 grid grid-cols-3 text-xs text-center border-t border-border mt-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-muted-foreground">Normal</span>
                                                        <span className="font-semibold">{raid.normal_bosses_killed}/{total}</span>
                                                    </div>
                                                    <div className="flex flex-col border-x border-border">
                                                        <span className="text-muted-foreground">Heroico</span>
                                                        <span className="font-semibold">{raid.heroic_bosses_killed}/{total}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-muted-foreground">Mítico</span>
                                                        <span className="font-semibold">{raid.mythic_bosses_killed}/{total}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
