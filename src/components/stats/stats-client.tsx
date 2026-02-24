"use client"

import { useMemo, useState, useEffect } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconChartBar, IconTrophy, IconSwords, IconBrandDiscord } from "@tabler/icons-react"

export function StatsClient({ members, rioData }: { members: any[], rioData?: any }) {
    const WOW_CLASSES: Record<number, string> = {
        1: "Guerrero", 2: "Paladín", 3: "Cazador", 4: "Pícaro", 5: "Sacerdote",
        6: "DK", 7: "Chamán", 8: "Mago", 9: "Brujo", 10: "Monje",
        11: "Druida", 12: "DH", 13: "Evocador",
    }

    const WOW_CLASS_COLORS: Record<number, string> = {
        1: "#C69B6D",  // Warrior
        2: "#F48CBA",  // Paladin
        3: "#AAD372",  // Hunter
        4: "#FFF468",  // Rogue
        5: "#FFFFFF",  // Priest
        6: "#C41E3A",  // DK
        7: "#0070DD",  // Shaman
        8: "#3FC7EB",  // Mage
        9: "#8788EE",  // Warlock
        10: "#00FF98", // Monk
        11: "#FF7C0A", // Druid
        12: "#A330C9", // DH
        13: "#33937F", // Evoker
    }



    const raidKeys = useMemo(() => {
        if (!rioData || !rioData.raid_progression) return []

        return Object.keys(rioData.raid_progression).map((key) => {
            let name = key.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
            if (key === "nerubar-palace") name = "Nerub-ar Palace"

            return { key, name }
        })
    }, [rioData])

    const [wclReports, setWclReports] = useState<any[]>([])
    const [isLoadingWcl, setIsLoadingWcl] = useState(true)
    const [wclError, setWclError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchWCL() {
            try {
                const res = await fetch("/api/wcl")
                const data = await res.json()
                if (!res.ok) {
                    throw new Error(data.error || "Error al cargar datos de WCL")
                }
                if (data?.reportData?.reports?.data) {
                    setWclReports(data.reportData.reports.data)
                }
            } catch (err: any) {
                setWclError(err.message)
            } finally {
                setIsLoadingWcl(false)
            }
        }
        fetchWCL()
    }, [])

    const [selectedMember, setSelectedMember] = useState<any>(null)
    const [characterData, setCharacterData] = useState<any>(null)
    const [isInspecting, setIsInspecting] = useState(false)
    const [inspectError, setInspectError] = useState<string | null>(null)

    const handleInspectMember = async (m: any) => {
        setSelectedMember(m)
        setIsInspecting(true)
        setInspectError(null)
        try {
            const url = `https://raider.io/api/v1/characters/profile?region=eu&realm=${m.character_realm}&name=${m.character_name}&fields=mythic_plus_scores_by_season:current,mythic_plus_best_runs`
            const res = await fetch(url)
            const data = await res.json()
            if (!res.ok) {
                if (res.status === 404) throw new Error("Personaje no encontrado (puede que no haya pisado ninguna M+)");
                if (res.status === 400 || res.status === 429) throw new Error(data.message || "Error al conectar con la API de Raider.IO");
                throw new Error("Error desconocido");
            }
            setCharacterData(data)
        } catch (e: any) {
            setInspectError(e.message)
            setCharacterData(null)
        } finally {
            setIsInspecting(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 px-4 lg:px-6">
            <div>
                <h1 className="text-2xl font-bold">Estadísticas y Progreso</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Vista combinada del avance de la hermandad y datos individuales del Roster.
                </p>
            </div>

            <Tabs defaultValue="progreso" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="progreso" className="flex items-center gap-2">
                        <IconTrophy className="size-4" /> Progreso de Banda
                    </TabsTrigger>
                    <TabsTrigger value="wcl" className="flex items-center gap-2">
                        <IconSwords className="size-4" /> Warcraft Logs
                    </TabsTrigger>
                    <TabsTrigger value="inspector" className="flex items-center gap-2">
                        <IconChartBar className="size-4" /> Armería M+
                    </TabsTrigger>
                </TabsList>

                {/* --- PESTAÑA: PROGRESO --- */}
                <TabsContent value="progreso" className="space-y-6 animate-in fade-in-50 mb-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">Progreso Oficial</h2>
                        {rioData && (
                            <a
                                href={rioData.profile_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline text-muted-foreground hover:text-foreground"
                            >
                                (Ver Raider.IO)
                            </a>
                        )}
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
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                            {raidKeys.map(({ key, name }) => {
                                const raid = rioData.raid_progression[key]
                                if (!raid) return null

                                const total = raid.total_bosses
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
                                        <CardHeader className="pb-3 border-b bg-card">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg">{name}</CardTitle>
                                                <Badge variant="outline" className={badgeColor}>
                                                    {currentDifficulty}
                                                </Badge>
                                            </div>
                                            <CardDescription>{raid.summary}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="mt-auto pt-4 bg-muted/5">
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium">
                                                            {currentKills} / {total} Jefes
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {Math.round(progressPercent)}%
                                                        </span>
                                                    </div>
                                                    <Progress value={progressPercent} className="h-2" />
                                                </div>

                                                <div className="pt-2 grid grid-cols-3 text-xs text-center border-t border-border mt-4">
                                                    <div className="flex flex-col p-1">
                                                        <span className="text-muted-foreground">Normal</span>
                                                        <span className="font-semibold">{raid.normal_bosses_killed}/{total}</span>
                                                    </div>
                                                    <div className="flex flex-col p-1 border-x border-border">
                                                        <span className="text-muted-foreground">Heroico</span>
                                                        <span className="font-semibold">{raid.heroic_bosses_killed}/{total}</span>
                                                    </div>
                                                    <div className="flex flex-col p-1">
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
                </TabsContent>

                {/* --- PESTAÑA: WARCRAFT LOGS --- */}
                <TabsContent value="wcl" className="space-y-6 animate-in fade-in-50">
                    <Card>
                        <CardHeader>
                            <CardTitle>Rendimiento en WarcraftLogs</CardTitle>
                            <CardDescription>
                                Accede a los últimos parses y reportes de la hermandad. Próximamente integración nativa con la API de WCL.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 min-h-[200px]">
                            {isLoadingWcl ? (
                                <div className="flex w-full h-full min-h-[150px] items-center justify-center text-sm text-muted-foreground animate-pulse">
                                    Cargando reportes de WCL...
                                </div>
                            ) : wclError ? (
                                <div className="flex w-full h-full min-h-[150px] items-center justify-center text-sm text-red-500/80 bg-red-500/5 rounded-md border border-red-500/10 p-4 text-center">
                                    {wclError}
                                </div>
                            ) : wclReports.length === 0 ? (
                                <div className="flex w-full h-full items-center justify-center text-sm text-muted-foreground">
                                    No hay reportes recientes disponibles.
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {wclReports.map((report: any) => (
                                        <a
                                            key={report.code}
                                            href={`https://www.warcraftlogs.com/reports/${report.code}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block group"
                                        >
                                            <div className="flex flex-col gap-2 p-3 sm:p-4 rounded-lg border border-border/50 bg-muted/10 hover:bg-muted/30 hover:border-border transition-colors">
                                                <div className="font-semibold text-sm group-hover:text-amber-500 transition-colors line-clamp-1">
                                                    {report.title}
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                                    <span className="truncate max-w-[120px]">{report.zone?.name || "Desconocido"}</span>
                                                    <span>{new Date(report.startTime).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- PESTAÑA: INSPECTOR M+ --- */}
                <TabsContent value="inspector" className="space-y-6 animate-in fade-in-50">
                    <div className="grid gap-6 md:grid-cols-12">
                        {/* Member Roster List */}
                        <Card className="md:col-span-4 lg:col-span-3 border-border/40 shadow-sm bg-card/60 flex flex-col max-h-[600px]">
                            <CardHeader className="py-4 border-b bg-muted/20 pb-3">
                                <CardTitle className="text-base text-foreground/80">Roster</CardTitle>
                                <CardDescription className="text-xs">
                                    Selecciona un jugador para inspeccionar
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-y-auto overflow-x-hidden">
                                <div className="flex flex-col">
                                    {members.sort((a, b) => a.character_name.localeCompare(b.character_name)).map((m) => (
                                        <button
                                            key={m.id || m.character_name}
                                            onClick={() => handleInspectMember(m)}
                                            className={`flex items-center gap-3 px-4 py-3 text-left border-b border-border/40 hover:bg-muted/50 transition-colors ${selectedMember?.character_name === m.character_name ? "bg-primary/10 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                                                }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm" style={{ color: WOW_CLASS_COLORS[m.class_id ?? 0] || 'inherit' }}>
                                                    {m.character_name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{m.role || "Desconocido"}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Inspector Details View */}
                        <Card className="md:col-span-8 lg:col-span-9 border-border/40 shadow-sm bg-card/60 flex flex-col min-h-[400px]">
                            <CardHeader className="py-4 border-b bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg text-foreground/80 flex items-center gap-2">
                                            {selectedMember ? selectedMember.character_name : "Armería"}
                                            {selectedMember && <Badge variant="outline" className="text-xs ml-2 opacity-70 border-border/50">{selectedMember.character_realm}</Badge>}
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                            {selectedMember ? "Datos extraídos en vivo de Raider.IO" : "Selecciona un jugador del panel izquierdo"}
                                        </CardDescription>
                                    </div>
                                    {selectedMember && characterData && (
                                        <a href={characterData.profile_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                                            Ver Perfil Completo &rarr;
                                        </a>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {!selectedMember ? (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground gap-2">
                                        <IconChartBar className="size-10 opacity-20" />
                                        <p>Selecciona un miembro para ver su Mythic+ Score</p>
                                    </div>
                                ) : isInspecting ? (
                                    <div className="flex items-center justify-center h-full min-h-[300px] text-muted-foreground animate-pulse">
                                        Consultando Raider.IO...
                                    </div>
                                ) : inspectError ? (
                                    <div className="flex items-center justify-center h-full min-h-[300px] text-red-400">
                                        {inspectError}
                                    </div>
                                ) : characterData ? (
                                    <div className="flex flex-col gap-6 animate-in fade-in-50">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="flex flex-col p-4 rounded-xl bg-muted/20 border border-border/50 items-center justify-center text-center">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">M+ Score</span>
                                                <span className="text-3xl font-bold" style={{ color: characterData.mythic_plus_scores_by_season[0]?.segments?.all?.color || 'inherit' }}>
                                                    {Math.round(characterData.mythic_plus_scores_by_season[0]?.scores?.all || 0)}
                                                </span>
                                            </div>
                                            <div className="flex flex-col p-4 rounded-xl bg-muted/20 border border-border/50 items-center justify-center text-center">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Clase</span>
                                                <span className="text-lg font-semibold">{characterData.class}</span>
                                            </div>
                                            <div className="flex flex-col p-4 rounded-xl bg-muted/20 border border-border/50 items-center justify-center text-center">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Rol Activo</span>
                                                <span className="text-lg font-semibold">{characterData.active_spec_role}</span>
                                            </div>
                                            <div className="flex flex-col p-4 rounded-xl bg-muted/20 border border-border/50 items-center justify-center text-center">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Espec.</span>
                                                <span className="text-lg font-semibold">{characterData.active_spec_name}</span>
                                            </div>
                                        </div>

                                        {characterData.mythic_plus_best_runs && characterData.mythic_plus_best_runs.length > 0 && (
                                            <div className="mt-4">
                                                <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Mejores Míticas Completadas</h3>
                                                <div className="grid md:grid-cols-2 gap-3">
                                                    {characterData.mythic_plus_best_runs.map((run: any, i: number) => (
                                                        <a key={i} href={run.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-colors">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-sm">{run.short_name}</span>
                                                                <span className="text-xs text-muted-foreground">{new Date(run.completed_at).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className={`text-sm font-bold ${run.num_keystone_upgrades > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                                                                    +{run.mythic_level} {run.num_keystone_upgrades > 0 && `(+${run.num_keystone_upgrades})`}
                                                                </span>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
