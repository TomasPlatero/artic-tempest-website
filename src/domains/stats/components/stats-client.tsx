"use client"

import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Progress } from "@/shared/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { IconChartBar, IconTrophy, IconSwords, IconSearch, IconCrown, IconUser } from "@tabler/icons-react"
import { Input } from "@/shared/ui/input"
import Image from "next/image"
import { cn } from "@/shared/tailwind/tailwind-utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/dialog"
import { IconCheck, IconX, IconExternalLink } from "@tabler/icons-react"

export function StatsClient({ members, rioData, classColors = {} }: { members: any[], rioData?: any, classColors?: Record<number, string> }) {
    const searchParams = useSearchParams()
    const [isMounted, setIsMounted] = useState(false)
    const [activeTab, setActiveTab] = useState("progreso")

    useEffect(() => {
        setIsMounted(true)
        const tab = searchParams.get("tab")
        if (tab === "logs") {
            setActiveTab("wcl")
        } else if (tab === "armeria" || tab === "inspector") {
            setActiveTab("inspector")
        } else if (tab === "progreso") {
            setActiveTab("progreso")
        }
    }, [searchParams])



    const raidKeys = useMemo(() => {
        if (!rioData || !rioData.raid_progression) return []

        return Object.keys(rioData.raid_progression).map((key) => {
            const name = key.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
            return { key, name }
        })
    }, [rioData])

    const [wclReports, setWclReports] = useState<any[]>([])
    const [isLoadingWcl, setIsLoadingWcl] = useState(true)
    const [wclError, setWclError] = useState<string | null>(null)
    const [wclSearchQuery, setWclSearchQuery] = useState("")

    const [selectedWclReport, setSelectedWclReport] = useState<any>(null)
    const [wclReportDetails, setWclReportDetails] = useState<any>(null)
    const [isFetchingWclDetail, setIsFetchingWclDetail] = useState(false)
    const [wclModalTab, setWclModalTab] = useState<'sumario' | 'intentos'>('sumario')
    const [wclZoneFilter, setWclZoneFilter] = useState<string>("all")
    const [wclTagFilter, setWclTagFilter] = useState<string>("all")
    const [wclTags, setWclTags] = useState<{ id: number, name: string }[]>([])

    // WCL Zone IDs grouped by expansion/season
    const WCL_ZONES = [
        {
            group: "Midnight", zones: [
                { id: "46", name: "Todas las Raids (VS/DR/MQD)" },
            ]
        },
        {
            group: "The War Within", zones: [
                { id: "44", name: "Forja de Maná Omega" },
                { id: "42", name: "Liberación de Minahonda" },
                { id: "38", name: "Palacio Nerub'ar" },
                { id: "40", name: "Blackrock Depths" },
            ]
        },
    ]

    const handleViewWclReport = async (report: any) => {
        setSelectedWclReport(report)
        setIsFetchingWclDetail(true)
        try {
            const res = await fetch(`/api/wcl?code=${report.code}`)
            const data = await res.json()
            if (data?.reportData?.report) {
                setWclReportDetails(data.reportData.report)
            }
        } catch (e) {
            console.error("Error fetching WCL details:", e)
        } finally {
            setIsFetchingWclDetail(false)
        }
    }

    const filteredWclReports = useMemo(() => {
        return wclReports.filter(report => {
            // Filter out empty logs (no combat segments)
            if (report.segments === 0) return false
            // Text search filter
            return report.title.toLowerCase().includes(wclSearchQuery.toLowerCase()) ||
                report.zone?.name?.toLowerCase().includes(wclSearchQuery.toLowerCase())
        })
    }, [wclReports, wclSearchQuery])

    // Fetch guild tags once
    useEffect(() => {
        async function fetchTags() {
            try {
                const res = await fetch('/api/wcl?action=tags')
                const data = await res.json()
                if (data?.guildData?.guild?.tags) {
                    setWclTags(data.guildData.guild.tags)
                }
            } catch (e) {
                console.error('Error fetching WCL tags:', e)
            }
        }
        fetchTags()
    }, [])

    // Fetch WCL reports (re-fetches when zone or tag filter changes)
    useEffect(() => {
        async function fetchWCL() {
            setIsLoadingWcl(true)
            try {
                const zoneParam = wclZoneFilter !== 'all' ? `&zoneID=${wclZoneFilter}` : ''
                const tagParam = wclTagFilter !== 'all' ? `&guildTagID=${wclTagFilter}` : ''
                const res = await fetch(`/api/wcl?t=${Date.now()}${zoneParam}${tagParam}`)
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
    }, [wclZoneFilter, wclTagFilter])

    const [searchQuery, setSearchQuery] = useState("")
    const [topMembers, setTopMembers] = useState<any[]>([])
    const [isLoadingTop, setIsLoadingTop] = useState(true)

    // Filter members based on search
    const filteredMembers = useMemo(() => {
        return members
            .filter(m => m.character_name.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => a.character_name.localeCompare(b.character_name))
    }, [members, searchQuery])

    const [selectedMember, setSelectedMember] = useState<any>(null)
    const [characterData, setCharacterData] = useState<any>(null)
    const [isInspecting, setIsInspecting] = useState(false)
    const [inspectError, setInspectError] = useState<string | null>(null)

    // Load Top 3 members by Score
    useEffect(() => {
        async function fetchTopMembers() {
            setIsLoadingTop(true)
            try {
                // Fetch scores for all members (limited to keep it fast, or first N)
                const membersToFetch = members.slice(0, 15) // Limit to top 15 for ranking lookup
                const scores = await Promise.all(membersToFetch.map(async (m) => {
                    try {
                        const res = await fetch(`https://raider.io/api/v1/characters/profile?region=eu&realm=${m.realm_slug}&name=${m.character_name}&fields=mythic_plus_scores_by_season:current`)
                        if (!res.ok) return null
                        const data = await res.json()
                        return {
                            ...m,
                            score: data.mythic_plus_scores_by_season?.[0]?.scores?.all || 0,
                            color: data.mythic_plus_scores_by_season?.[0]?.segments?.all?.color || '#ffffff'
                        }
                    } catch { return null }
                }))

                const sorted = (scores.filter(Boolean) as any[])
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 3)

                setTopMembers(sorted)
            } catch (err) {
                console.error("Error fetching top members:", err)
            } finally {
                setIsLoadingTop(false)
            }
        }
        if (members.length > 0) fetchTopMembers()
    }, [members])

    const handleInspectMember = async (m: any) => {
        setSelectedMember(m)
        setIsInspecting(true)
        setInspectError(null)
        try {
            const realm = (m.realm_slug || m.character_realm || 'zuljin').toLowerCase().trim().replace(/\s+/g, '-')
            const seasons = ['current', 'previous', 'season-tww-1', 'season-df-4', 'season-df-3', 'season-df-2', 'season-df-1']
            const seasonField = `mythic_plus_scores_by_season:${seasons.join(':')}`
            const url = `https://raider.io/api/v1/characters/profile?region=eu&realm=${realm}&name=${encodeURIComponent(m.character_name.trim())}&fields=${seasonField},mythic_plus_best_runs`
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

    if (!isMounted) return null

    return (
        <div className="flex flex-col gap-6 px-4 lg:px-6">
            <div>
                <h1 className="text-2xl font-bold">Estadísticas y Progreso</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Vista combinada del avance de la hermandad y datos individuales del Roster.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4 w-full justify-start overflow-x-auto h-auto min-h-10 bg-muted/20 p-1 flex-nowrap scrollbar-none">
                    <TabsTrigger value="progreso" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 text-[10px] sm:text-xs py-2">
                        <IconTrophy className="size-3.5" /> Progreso
                    </TabsTrigger>
                    <TabsTrigger value="wcl" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 text-[10px] sm:text-xs py-2">
                        <IconSwords className="size-3.5" /> Logs
                    </TabsTrigger>
                    <TabsTrigger value="inspector" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 text-[10px] sm:text-xs py-2">
                        <IconChartBar className="size-3.5" /> Armería
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
                <TabsContent value="wcl" className="space-y-6 animate-in fade-in-50 mb-10">
                    <Card className="border-border/40 shadow-sm bg-card/60 pt-0 overflow-hidden">
                        <CardHeader className="border-b bg-muted/20 pb-6 pt-6">
                            <div className="flex flex-col items-center justify-center gap-4 md:gap-5">
                                <div className="space-y-1 text-center flex flex-col items-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <CardTitle className="text-base md:text-lg">Rendimiento en WarcraftLogs</CardTitle>
                                    </div>
                                    <CardDescription className="text-[10px] md:text-xs max-w-[280px] md:max-w-none">
                                        Accede a los últimos reportes y análisis de combate de la hermandad.
                                    </CardDescription>
                                </div>
                                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-3 w-full md:w-auto">
                                    <a
                                        href="https://www.warcraftlogs.com/guild/id/743623"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
                                    >
                                        <IconSwords className="size-4" />
                                        Perfil de Hermandad
                                    </a>
                                    <div className="grid grid-cols-2 md:flex md:items-center gap-2 w-full md:w-auto">
                                        <Select value={wclZoneFilter} onValueChange={setWclZoneFilter}>
                                            <SelectTrigger className="h-9 w-full md:w-auto md:min-w-[180px] bg-background/50 border-border/40 text-[10px] md:text-xs">
                                                <SelectValue placeholder="Raid / Zona" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas las zonas</SelectItem>
                                                {WCL_ZONES.map((group) => (
                                                    <div key={group.group}>
                                                        <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{group.group}</div>
                                                        {group.zones.map((z) => (
                                                            <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                                                        ))}
                                                    </div>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {wclTags.length > 0 ? (
                                            <Select value={wclTagFilter} onValueChange={setWclTagFilter}>
                                                <SelectTrigger className="h-9 w-full md:w-auto md:min-w-[110px] bg-background/50 border-border/40 text-[10px] md:text-xs">
                                                    <SelectValue placeholder="Tag" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos los Tags</SelectItem>
                                                    {wclTags.map((tag) => (
                                                        <SelectItem key={tag.id} value={String(tag.id)}>{tag.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="h-9 px-3 rounded-md bg-background/50 border border-border/40 flex items-center justify-center text-[10px] text-muted-foreground/40 md:hidden">
                                                Sin Tags
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative w-full md:w-48">
                                        <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar reporte..."
                                            className="pl-9 h-9 bg-background/50 border-border/40 text-[10px] md:text-xs"
                                            value={wclSearchQuery}
                                            onChange={(e) => setWclSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 min-h-[400px]">
                            {isLoadingWcl ? (
                                <div className="flex flex-col w-full h-full min-h-[300px] items-center justify-center text-sm text-muted-foreground gap-4 animate-pulse">
                                    <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                    Cargando reportes de WCL...
                                </div>
                            ) : wclError ? (
                                <div className="flex w-full h-full min-h-[300px] items-center justify-center text-sm text-red-500/80 bg-red-500/5 rounded-xl border border-red-500/10 p-8 text-center flex-col gap-2">
                                    <IconUser className="size-10 opacity-20" />
                                    {wclError}
                                </div>
                            ) : filteredWclReports.length === 0 ? (
                                <div className="flex flex-col w-full h-full min-h-[300px] items-center justify-center text-sm text-muted-foreground gap-2">
                                    <IconSearch className="size-10 opacity-10" />
                                    <p className="italic">No se encontraron reportes{wclSearchQuery && ` para "${wclSearchQuery}"`}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col divide-y divide-border/10">
                                    {filteredWclReports.map((report: any) => (
                                        <div
                                            key={report.code}
                                            onClick={() => handleViewWclReport(report)}
                                            className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-4 py-4 md:py-3 cursor-pointer hover:bg-blue-500/5 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <IconSwords className="size-4 text-muted-foreground/30 group-hover:text-blue-500/60 transition-colors shrink-0" />
                                                <span className="font-bold text-sm group-hover:text-blue-400 transition-colors truncate">
                                                    {report.title}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3 pl-7 md:pl-0">
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <Badge variant="secondary" className="bg-background/80 text-[9px] md:text-[10px] font-bold text-muted-foreground/80 py-0 px-1.5 whitespace-nowrap">
                                                        {report.zone?.name || "Desconocido"}
                                                    </Badge>
                                                    {report.guildTag?.name && (
                                                        <Badge variant="outline" className="text-[9px] md:text-[10px] font-bold py-0 px-1.5 border-blue-500/30 text-blue-400/80 whitespace-nowrap">
                                                            {report.guildTag.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-[9px] md:text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider w-auto md:w-20 text-right">
                                                    {new Date(report.startTime).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* WCL REPORT MODAL */}
                    <Dialog open={!!selectedWclReport} onOpenChange={(open) => !open && setSelectedWclReport(null)}>
                        <DialogContent className="max-w-[95vw] sm:max-w-[95vw] bg-[#0a0a0c] border-border/40 max-h-[85vh] flex flex-col p-0 overflow-hidden">
                            <DialogHeader className="p-6 pb-4 border-b border-border/10 bg-blue-500/5">
                                <div className="flex items-center justify-between pr-4">
                                    <div>
                                        <DialogTitle className="text-xl font-black text-blue-400 capitalize">
                                            {selectedWclReport?.title}
                                        </DialogTitle>
                                        <DialogDescription className="text-xs mt-1">
                                            {selectedWclReport?.zone?.name} • {selectedWclReport && new Date(selectedWclReport.startTime).toLocaleDateString()}{wclReportDetails?.owner?.name && <> • Creado por <span className="text-blue-400/70 font-bold">{wclReportDetails.owner.name}</span></>}
                                        </DialogDescription>
                                    </div>
                                    {selectedWclReport && (
                                        <a
                                            href={`https://www.warcraftlogs.com/reports/${selectedWclReport.code}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-2 transition-all"
                                        >
                                            <IconExternalLink className="size-3" />
                                            LOG COMPLETO
                                        </a>
                                    )}
                                </div>
                            </DialogHeader>

                            {/* TAB BAR */}
                            <div className="flex border-b border-border/10 px-6">
                                <button
                                    onClick={() => setWclModalTab('sumario')}
                                    className={cn(
                                        'px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 -mb-px',
                                        wclModalTab === 'sumario' ? 'text-blue-400 border-blue-500' : 'text-muted-foreground/50 border-transparent hover:text-muted-foreground'
                                    )}
                                >Sumario</button>
                                <button
                                    onClick={() => setWclModalTab('intentos')}
                                    className={cn(
                                        'px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 -mb-px',
                                        wclModalTab === 'intentos' ? 'text-blue-400 border-blue-500' : 'text-muted-foreground/50 border-transparent hover:text-muted-foreground'
                                    )}
                                >Intentos</button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                                {isFetchingWclDetail ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-4 animate-pulse">
                                        <div className="size-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Analizando combates...</p>
                                    </div>
                                ) : wclReportDetails ? (
                                    <div className="space-y-6">
                                        {wclModalTab === 'sumario' && (<>
                                            {/* GROUP COMPOSITION */}
                                            {wclReportDetails.playerDetails?.data?.playerDetails && (() => {
                                                const pd = wclReportDetails.playerDetails.data.playerDetails
                                                const tanks = pd.tanks || []
                                                const healersList = pd.healers || []
                                                const dpsList = pd.dps || []
                                                if (tanks.length === 0 && healersList.length === 0 && dpsList.length === 0) return null
                                                return (
                                                    <div className="rounded-lg border border-border/10 bg-background/30 p-4">
                                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-3">Composición del grupo</h3>
                                                        <div className="flex flex-col gap-2">
                                                            {tanks.length > 0 && (
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/60 w-16 shrink-0">Tanks:</span>
                                                                    {tanks.map((p: any) => (
                                                                        <Badge key={p.name} variant="outline" className="text-[10px] font-bold py-0 px-1.5 border-blue-500/20 text-blue-300/70">{p.name}</Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {healersList.length > 0 && (
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60 w-16 shrink-0">Healers:</span>
                                                                    {healersList.map((p: any) => (
                                                                        <Badge key={p.name} variant="outline" className="text-[10px] font-bold py-0 px-1.5 border-emerald-500/20 text-emerald-300/70">{p.name}</Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {dpsList.length > 0 && (
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400/60 w-16 shrink-0">DPS:</span>
                                                                    {dpsList.map((p: any) => (
                                                                        <Badge key={p.name} variant="outline" className="text-[10px] font-bold py-0 px-1.5 border-red-500/20 text-red-300/70">{p.name}</Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })()}

                                            {/* DAMAGE & HEALING TABLES */}
                                            {(wclReportDetails.damageDone?.data?.entries?.length > 0 || wclReportDetails.healingDone?.data?.entries?.length > 0) && (() => {
                                                const fmt = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(2) + 'm' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toFixed(0)
                                                const duration = (wclReportDetails.damageDone?.data?.totalTime || wclReportDetails.healingDone?.data?.totalTime || (wclReportDetails.endTime - wclReportDetails.startTime)) / 1000
                                                const dmgSorted = [...(wclReportDetails.damageDone?.data?.entries || [])].sort((a: any, b: any) => b.total - a.total)
                                                const healSorted = [...(wclReportDetails.healingDone?.data?.entries || [])].sort((a: any, b: any) => b.total - a.total)
                                                const classColors: Record<string, string> = {
                                                    'DeathKnight': '#C41E3A', 'DemonHunter': '#A330C9', 'Druid': '#FF7C0A',
                                                    'Evoker': '#33937F', 'Hunter': '#AAD372', 'Mage': '#3FC7EB',
                                                    'Monk': '#00FF98', 'Paladin': '#F48CBA', 'Priest': '#FFFFFF',
                                                    'Rogue': '#FFF468', 'Shaman': '#0070DD', 'Warlock': '#8788EE',
                                                    'Warrior': '#C69B6D'
                                                }
                                                const getColor = (type: string) => classColors[type] || '#888888'

                                                const renderTable = (entries: any[], label: string, icon: React.ReactNode, metricLabel: string) => (
                                                    <div>
                                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-3 flex items-center gap-2">
                                                            {icon} {label}
                                                        </h3>
                                                        <div className="rounded-lg border border-border/10 overflow-hidden">
                                                            <div className="grid grid-cols-[1fr_90px_80px] text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 px-3 py-1.5 border-b border-border/10 bg-muted/5">
                                                                <span>Nombre</span><span className="text-right">Amount</span><span className="text-right">{metricLabel}</span>
                                                            </div>
                                                            {entries.slice(0, 15).map((entry: any, i: number) => {
                                                                const maxTotal = entries[0]?.total || 1
                                                                const pct = (entry.total / maxTotal) * 100
                                                                const color = getColor(entry.type)
                                                                return (
                                                                    <div key={i} className="relative grid grid-cols-[1fr_90px_80px] items-center px-3 py-1.5 text-xs">
                                                                        <div className="absolute inset-0 opacity-15" style={{ width: `${pct}%`, backgroundColor: color }} />
                                                                        <span className="relative font-bold truncate" style={{ color }}>{entry.name}</span>
                                                                        <span className="relative text-right text-[10px] font-bold text-muted-foreground/60 tabular-nums">{fmt(entry.total)}</span>
                                                                        <span className="relative text-right text-[10px] font-black text-muted-foreground/80 tabular-nums">{fmt(entry.total / duration)}</span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )

                                                return (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {dmgSorted.length > 0 && renderTable(dmgSorted, 'Daño hecho por fuente', <IconSwords className="size-3.5" />, 'DPS')}
                                                        {healSorted.length > 0 && renderTable(healSorted, 'Sanación hecha por fuente', <IconTrophy className="size-3.5" />, 'HPS')}
                                                    </div>
                                                )
                                            })()}
                                        </>)}

                                        {wclModalTab === 'intentos' && (
                                            <div className="grid grid-cols-1 gap-2">
                                                {wclReportDetails.fights && wclReportDetails.fights.length > 0 ? (
                                                    wclReportDetails.fights.map((fight: any, i: number) => (
                                                        <a
                                                            href={`https://www.warcraftlogs.com/reports/${selectedWclReport?.code}#fight=${fight.id}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            key={i}
                                                            className="flex items-center justify-between p-3 rounded-lg border border-border/10 bg-background/40 group hover:border-blue-500/30 hover:bg-blue-500/[0.03] transition-all"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "size-6 rounded-md flex items-center justify-center text-[10px] font-black",
                                                                    fight.kill ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                                                                )}>
                                                                    {fight.kill ? <IconCheck className="size-3.5" /> : <IconX className="size-3.5" />}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-bold group-hover:text-blue-400 transition-colors">{fight.name}</span>
                                                                        <IconExternalLink className="size-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                                                                    </div>
                                                                    <span className="text-[10px] uppercase font-black text-muted-foreground/50 tracking-tighter">
                                                                        {fight.difficulty === 3 ? "Normal" : fight.difficulty === 4 ? "Heroico" : fight.difficulty === 5 ? "Mítico" : "Buscador"}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-4">
                                                                {!fight.kill && (
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">Mejor Intento</span>
                                                                        <span className="text-xs font-black text-red-400/80">{(fight.fightPercentage / 100).toFixed(1)}%</span>
                                                                    </div>
                                                                )}
                                                                {fight.kill && (
                                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-black uppercase">Derrotado</Badge>
                                                                )}
                                                            </div>
                                                        </a>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 text-xs text-muted-foreground italic">No se encontraron combates registrados.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-sm text-red-400">Error al cargar el sumario.</div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* --- PESTAÑA: INSPECTOR M+ --- */}
                <TabsContent value="inspector" className="space-y-6 animate-in fade-in-50 mb-10">

                    {/* TOP 3 RANKING CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {isLoadingTop ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i} className="bg-card/40 border-border/20 animate-pulse h-32 flex items-center justify-center">
                                    <div className="text-xs text-muted-foreground">Cargando ranking...</div>
                                </Card>
                            ))
                        ) : topMembers.length > 0 ? (
                            topMembers.map((m, i) => (
                                <Card
                                    key={m.id}
                                    className={cn(
                                        "bg-gradient-to-br from-card to-background border-border/40 overflow-hidden group cursor-pointer hover:border-primary/50 transition-all",
                                        i === 0 ? "border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : ""
                                    )}
                                    onClick={() => handleInspectMember(m)}
                                >
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className={cn(
                                            "size-12 rounded-full flex items-center justify-center shrink-0 border-2",
                                            i === 0 ? "border-amber-500 bg-amber-500/10" :
                                                i === 1 ? "border-slate-400 bg-slate-400/10" :
                                                    "border-amber-700 bg-amber-700/10"
                                        )}>
                                            {i === 0 ? <IconCrown className="size-6 text-amber-500" /> : <span className="font-bold">{i + 1}</span>}
                                        </div>
                                        <div className="min-w-0">
                                            <div
                                                className={cn("font-bold text-lg truncate", !classColors[m.class_id]?.startsWith('#') && classColors[m.class_id])}
                                                style={classColors[m.class_id]?.startsWith('#') ? { color: classColors[m.class_id] } : {}}
                                            >
                                                {m.character_name}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-black" style={{ color: m.color }}>{Math.round(m.score)}</span>
                                                <Badge variant="outline" className="text-[9px] uppercase tracking-tighter py-0 px-1 opacity-60">
                                                    Best in Guild
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : null}
                    </div>

                    <div className="grid gap-6 md:grid-cols-12 items-start">
                        {/* Member Roster List */}
                        <Card className="md:col-span-4 lg:col-span-3 border-border/40 shadow-sm bg-card/60 flex flex-col max-h-[700px] pt-0 overflow-hidden">
                            <CardHeader className="pt-4 border-b bg-muted/20 pb-3 space-y-3">
                                <div className="flex flex-col gap-1 text-center items-center">
                                    <CardTitle className="text-base text-foreground/80">Roster</CardTitle>
                                    <CardDescription className="text-xs">
                                        Busca e inspecciona un jugador
                                    </CardDescription>
                                </div>
                                <div className="relative">
                                    <IconSearch className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar personaje..."
                                        className="pl-9 h-9 bg-background/50 border-border/40 text-xs"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
                                <div className="flex flex-col">
                                    {filteredMembers.length > 0 ? filteredMembers.map((m) => (
                                        <button
                                            key={m.id || m.character_name}
                                            onClick={() => handleInspectMember(m)}
                                            className={`flex items-center gap-3 px-4 py-3 text-left border-b border-border/20 hover:bg-muted/50 transition-all group ${selectedMember?.character_name === m.character_name ? "bg-primary/10 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                                                }`}
                                        >
                                            <div className="size-8 rounded-full border border-border/40 flex items-center justify-center bg-muted/30 group-hover:bg-primary/20 transition-colors shrink-0">
                                                <Image
                                                    src={`/assets/images/classes/${m.class_id}.jpg`}
                                                    alt=""
                                                    width={24}
                                                    height={24}
                                                    className="rounded-full"
                                                />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span
                                                    className={cn("font-bold text-sm truncate", !classColors[m.class_id ?? 0]?.startsWith('#') && classColors[m.class_id ?? 0])}
                                                    style={classColors[m.class_id ?? 0]?.startsWith('#') ? { color: classColors[m.class_id ?? 0] } : {}}
                                                >
                                                    {m.character_name}
                                                </span>
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground/60">{m.role || m.character_realm}</span>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="p-8 text-center text-xs text-muted-foreground italic">
                                            No se encontraron miembros
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Inspector Details View */}
                        <Card className="md:col-span-8 lg:col-span-9 border-border/40 shadow-sm bg-card/60 flex flex-col min-h-[500px] pt-0 overflow-hidden">
                            <CardHeader className="pt-4 pb-4 border-b bg-muted/20">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
                                    <div className="flex flex-col items-center md:items-start">
                                        <CardTitle className="text-lg text-foreground/80 flex items-center justify-center md:justify-start gap-2">
                                            {selectedMember ? selectedMember.character_name : "Armería"}
                                            {selectedMember && <Badge variant="outline" className="text-xs ml-2 opacity-70 border-border/50">{selectedMember.character_realm}</Badge>}
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                            {!selectedMember && "Selecciona un jugador del panel izquierdo"}
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
