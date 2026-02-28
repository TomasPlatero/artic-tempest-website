"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    IconUser,
    IconCalendar,
    IconCheck,
    IconX,
    IconExternalLink,
    IconTrendingUp,
    IconSword,
    IconShield,
    IconHeartHandshake,
    IconLoader2,
    IconBrandDiscord
} from "@tabler/icons-react"
import Image from "next/image"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { supabase } from "@/infrastructure/supabase/client"
import { fetchCharacterRIO } from "@/infrastructure/raiderio/raiderio-client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

type Props = {
    application: any
    answers: any[]
    classConstants: any[]
    initialRioData?: any
}

const statusConfig: Record<string, { label: string, color: string }> = {
    pending: { label: "Nuevo", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    reviewing: { label: "En Revisión", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    interview: { label: "Charla Pendiente", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    accepted: { label: "Aceptado", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    rejected: { label: "Rechazado", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" }
}

const RAID_CONFIG: Record<string, { name: string, tier: number }> = {
    // Midnight (Tier 35)
    'voidspire': { name: 'Voidspire', tier: 35 },
    'dreamrift': { name: 'Dreamrift', tier: 35 },
    'march-on-queldanas': { name: 'March on Quel\'Danas', tier: 35 },
    // TWW (Tier 34 & 33)
    'manaforge-omega': { name: 'Manaforge Omega', tier: 34 },
    'liberation-of-undermine': { name: 'Lib. of Undermine', tier: 34 },
    'blackrock-depths': { name: 'Blackrock Depths', tier: 34 },
    'nerubar-palace': { name: 'Nerub-ar Palace', tier: 33 },
    // Dragonflight
    'amirdrassil-the-dreams-hope': { name: "Amirdrassil", tier: 31 },
    'aberrus-the-shadowed-crucible': { name: "Aberrus", tier: 30 },
    'vault-of-the-incarnates': { name: "Vault", tier: 29 },
    // Shadowlands
    'sepulcher-of-the-first-ones': { name: "Sepulcher", tier: 28 },
    'sanctum-of-domination': { name: "Sanctum", tier: 27 },
    'castle-nathria': { name: "Castle Nathria", tier: 26 },
    // BFA
    'nyalotha-the-waking-city': { name: "Ny'alotha", tier: 25 },
    'the-eternal-palace': { name: "Eternal Palace", tier: 24 },
    'crucible-of-storms': { name: "Crucible", tier: 23 },
    'battle-of-dazaralor': { name: "Dazar'alor", tier: 23 },
    'uldir': { name: "Uldir", tier: 22 }
}

export function RecruitmentDetailClient({ application, answers, classConstants, initialRioData }: Props) {
    const router = useRouter()

    // Initial season detection
    const getInitialSeason = (data: any) => {
        if (!data?.mythic_plus_scores_by_season) return ""
        const seasons = data.mythic_plus_scores_by_season
        const active = seasons.find((s: any) => s.scores?.all > 0) || seasons[0]
        return active?.season || ""
    }

    const [selectedSeason, setSelectedSeason] = useState<string>("")
    const [rioData, setRioData] = useState<any>(initialRioData)
    const [loadingRio, setLoadingRio] = useState(!initialRioData)
    const [isUpdating, setIsUpdating] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(application.status)
    const [syncedChar, setSyncedChar] = useState<any>(null)

    // Set initial season once we have data
    useEffect(() => {
        if (rioData && !selectedSeason) {
            setSelectedSeason(getInitialSeason(rioData))
        }
    }, [rioData, selectedSeason])

    const classMap = new Map()
    classConstants.forEach((c: any) => classMap.set(Number(c.key), { name: c.value, color: c.metadata?.color }))
    const cls = classMap.get(application.character_class)

    useEffect(() => {
        async function getExternalData() {
            // If we have initial data and it matches the current character, skip fetching
            if (initialRioData &&
                initialRioData.name?.toLowerCase() === application.character_name.toLowerCase() &&
                initialRioData.realm?.toLowerCase().replace(/\s+/g, '-') === application.character_realm.toLowerCase().replace(/\s+/g, '-')) {
                setLoadingRio(false)
                if (initialRioData.mythic_plus_scores_by_season) {
                    const seasons = initialRioData.mythic_plus_scores_by_season
                    const activeSeason = seasons.find((s: any) => s.scores?.all > 0) || seasons[0]
                    if (activeSeason) setSelectedSeason(activeSeason.season)
                }
                return
            }

            setLoadingRio(true)
            try {
                const [rio, synced] = await Promise.all([
                    fetchCharacterRIO(application.character_name, application.character_realm),
                    supabase
                        .from("bnet_characters")
                        .select("spec")
                        .eq("name", application.character_name)
                        .eq("realm", application.character_realm)
                        .single()
                        .then(({ data }) => data)
                ])

                setRioData(rio)
                setSyncedChar(synced)
                setLoadingRio(false)

                if (rio?.mythic_plus_scores_by_season) {
                    const seasons = rio.mythic_plus_scores_by_season
                    const activeSeason = seasons.find((s: any) => s.scores?.all > 0) || seasons[0]
                    if (activeSeason) setSelectedSeason(activeSeason.season)
                }

                if (application.character_spec === "Unknown") {
                    const betterSpec = synced?.spec || rio?.active_spec_name
                    if (betterSpec && betterSpec !== "Unknown") {
                        console.log("[Client] Found better spec:", betterSpec)
                        await supabase
                            .from("recruitment_applications")
                            .update({ character_spec: betterSpec })
                            .eq("id", application.id)
                    }
                }
            } catch (error) {
                console.error("Error fetching external data:", error)
                setLoadingRio(false)
            }
        }
        getExternalData()
    }, [application, initialRioData])

    const handleUpdateStatus = async (val: string) => {
        setCurrentStatus(val)
        setIsUpdating(true)
        try {
            const { error } = await supabase
                .from("recruitment_applications")
                .update({ status: val, updated_at: new Date().toISOString() })
                .eq("id", application.id)

            if (error) throw error
            toast.success(`Estado actualizado a: ${statusConfig[val].label}`)
            router.refresh()
        } catch (error) {
            toast.error("Error al actualizar estado")
        } finally {
            setIsUpdating(false)
        }
    }

    const currentSeasonData = rioData?.mythic_plus_scores_by_season?.find((s: any) => s.season === selectedSeason)
    const mPlusScore = currentSeasonData?.scores?.all || 0

    // Debug
    if (rioData) {
        console.log("RIO Data state:", {
            name: rioData.name,
            seasonsCount: rioData.mythic_plus_scores_by_season?.length,
            selectedSeason,
            mPlusScore
        })
    }

    // Season Grouping Logic
    const rawSeasons = rioData?.mythic_plus_scores_by_season || []
    // Remove duplicates if RIO returns the same season for 'current' and 'season-xxx'
    const uniqueSeasons = Array.from(new Set(rawSeasons.map((s: any) => s.season)))
        .map(id => rawSeasons.find((s: any) => s.season === id))

    const groupedSeasons = uniqueSeasons.reduce((acc: any, s: any) => {
        let expansion = "Otros"
        const sid = s.season.toLowerCase()
        if (sid.includes("mn")) expansion = "Midnight"
        else if (sid.includes("tww")) expansion = "The War Within"
        else if (sid.includes("dragonflight") || sid.includes("df-")) expansion = "Dragonflight"
        else if (sid.includes("shadowlands") || sid.includes("sl-")) expansion = "Shadowlands"
        else if (sid.includes("bfa")) expansion = "Battle for Azeroth"
        else if (sid.includes("legion")) expansion = "Legion"

        if (!acc[expansion]) acc[expansion] = []
        acc[expansion].push(s)
        return acc
    }, {}) || {}

    const expansionOrder = ["Midnight", "The War Within", "Dragonflight", "Shadowlands", "Battle for Azeroth", "Legion", "Otros"]

    const getSeasonLabel = (id: string) => {
        const s = id.toLowerCase()
        if (s.includes('mn')) return `MN S${s.split('-').pop()}`
        if (s.includes('tww')) return `TWW S${s.split('-').pop()}`
        if (s.includes('df')) return `DF S${s.split('-').pop()}`
        if (s.includes('sl')) return `SL S${s.split('-').pop()}`
        return id.replace("season-", "").split('-').map(w => w.toUpperCase()).join(' ')
    }

    const raids = rioData?.raid_progression ? Object.entries(rioData.raid_progression) : []

    // Improved Raid Selector based on Expansion/Season ID
    const getRaidForSeason = (seasonId: string) => {
        const sid = seasonId.toLowerCase()
        let matchingRaids: [string, any][] = []

        if (sid.includes("mn") || sid.includes("midnight")) {
            matchingRaids = raids.filter(([k]) => k.includes("voidspire") || k.includes("dreamrift") || k.includes("queldanas"))
        } else if (sid.includes("tww") || sid.includes("war-within")) {
            matchingRaids = raids.filter(([k]) =>
                k.includes("manaforge") || k.includes("nerubar") || k.includes("undermine") || k.includes("blackrock") || k.includes("liberation")
            )
        } else if (sid.includes("df") || sid.includes("dragonflight")) {
            matchingRaids = raids.filter(([k]) => k.includes("amirdrassil") || k.includes("aberrus") || k.includes("vault"))
        } else if (sid.includes("sl") || sid.includes("shadowlands")) {
            matchingRaids = raids.filter(([k]) => k.includes("sepulcher") || k.includes("sanctum") || k.includes("nathria"))
        } else if (sid.includes("bfa")) {
            matchingRaids = raids.filter(([k]) => k.includes("nyalotha") || k.includes("palace") || k.includes("storms") || k.includes("dazaralor") || k.includes("uldir"))
        }

        // Sort by Tier descending
        return matchingRaids.sort(([k1], [k2]) => {
            const t1 = RAID_CONFIG[k1]?.tier || 0
            const t2 = RAID_CONFIG[k2]?.tier || 0
            return t2 - t1
        })
    }

    const activeRaids = getRaidForSeason(selectedSeason)

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            {/* CLEAN HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex items-center gap-6">
                    <div className="relative size-20 md:size-24 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-blue-500/10">
                        <Image
                            src={`/assets/images/classes/${application.character_class}.jpg`}
                            alt="Clase" fill className="object-cover"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
                                {application.character_name}
                            </h2>
                            <Badge variant="outline" className={`uppercase font-bold ${statusConfig[currentStatus].color}`}>
                                {statusConfig[currentStatus].label}
                            </Badge>
                        </div>
                        <p className="text-lg font-medium" style={{ color: cls?.color }}>
                            {application.character_spec === "Unknown" ? (syncedChar?.spec || rioData?.active_spec_name || "Unknown") : application.character_spec} {cls?.name}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            {application.character_realm} • {new Date(application.created_at).toLocaleDateString("es-ES")}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-64">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500 ml-2">Cambiar Estado</Label>
                    <Select value={currentStatus} onValueChange={handleUpdateStatus} disabled={isUpdating}>
                        <SelectTrigger className="bg-zinc-950/50 border-white/10 h-10 rounded-xl focus:ring-blue-500/50">
                            <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/10 text-white">
                            {Object.entries(statusConfig).map(([key, cfg]) => (
                                <SelectItem key={key} value={key} className="focus:bg-white/5 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <div className={`size-2 rounded-full ${key === 'pending' ? 'bg-blue-500' : key === 'reviewing' ? 'bg-purple-500' : key === 'interview' ? 'bg-amber-500' : key === 'accepted' ? 'bg-emerald-500' : key === 'rejected' ? 'bg-rose-500' : 'bg-zinc-500'}`} />
                                        {cfg.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* 1. TOP SUMMARY: EXPANSION SELECTOR + SCORE */}
            <Card className="bg-card/20 border-border/20 overflow-hidden backdrop-blur-xl border-t-2 border-t-blue-500/50">
                <CardHeader className="py-4 px-6 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2">
                        <IconTrendingUp className="size-4" /> Trayectoria y Rendimiento
                    </CardTitle>

                    {!loadingRio && rioData?.mythic_plus_scores_by_season && (
                        <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                            <SelectTrigger className="w-full sm:w-72 h-9 bg-zinc-900/80 border-white/10 text-[10px] uppercase font-black tracking-widest hover:border-blue-500/30 transition-colors">
                                <SelectValue placeholder="Seleccionar Temporada / Tier" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-white/10 max-h-[400px]">
                                {expansionOrder.map(exp => groupedSeasons[exp] && (
                                    <div key={exp} className="px-1 py-1">
                                        <div className="px-3 py-1.5 text-[9px] font-black text-blue-500/70 uppercase tracking-[0.2em] bg-white/[0.02] rounded-md mb-1">{exp}</div>
                                        {groupedSeasons[exp].map((s: any) => (
                                            <SelectItem key={s.season} value={s.season} className="text-[10px] uppercase font-bold py-2 focus:bg-blue-500/10">
                                                {getSeasonLabel(s.season)}
                                            </SelectItem>
                                        ))}
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </CardHeader>
                <CardContent className="p-6">
                    {loadingRio ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <IconLoader2 className="size-10 animate-spin text-blue-500" />
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Consultando historial de la API...</span>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* Score and Main Info */}
                            <div className="flex flex-col lg:flex-row gap-8 items-center">
                                <div className="flex flex-col items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-3xl p-8 min-w-[220px] text-center shadow-xl shadow-blue-500/5 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-50" />
                                    <span className="relative text-[10px] uppercase font-black text-blue-400 tracking-[0.2em] mb-2">Score de Temporada</span>
                                    <span className="relative text-6xl font-black text-white tabular-nums tracking-tighter">
                                        {mPlusScore.toFixed(0)}
                                    </span>
                                    <div className="relative mt-4 flex items-center gap-2">
                                        <Badge className="bg-blue-500 text-white font-black text-[9px] px-2 py-1 uppercase">Verificado RIO</Badge>
                                    </div>
                                </div>

                                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
                                        <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Espec. Principal</span>
                                        <div className="flex items-center gap-1.5 text-white">
                                            {application.character_spec.toLowerCase().includes('tank') ||
                                                application.character_spec.toLowerCase().includes('protection') ||
                                                application.character_spec.toLowerCase().includes('blood') ||
                                                application.character_spec.toLowerCase().includes('guardian') ?
                                                <IconShield className="size-4 text-blue-400" /> : <IconSword className="size-4 text-rose-400" />}
                                            <span className="text-sm font-black uppercase">
                                                {application.character_spec !== "Unknown" ? application.character_spec : (rioData?.active_spec_name || "PENDIENTE")}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
                                        <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Expansión</span>
                                        <span className="text-xs font-black text-white uppercase">{selectedSeason.includes('tww') ? 'TWW' : selectedSeason.includes('df') ? 'DF' : selectedSeason.includes('mn') ? 'Midnight' : 'Otros'}</span>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-emerald-500/5 transition-colors">
                                        <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Status</span>
                                        <span className="text-xs font-black text-emerald-400 uppercase">Activo</span>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
                                        <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">iLvl</span>
                                        <span className="text-xs font-black text-white">Próx. Sinc.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Raid Progression Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <IconSword className="size-4 text-rose-500" />
                                    <h4 className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em]">Progreso en Bandas por Tier</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {activeRaids.map(([key, data]: [string, any], i: number) => (
                                        <div key={i} className="bg-zinc-950/60 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group shadow-xl">
                                            <div className="p-4 bg-white/[0.03] border-b border-white/5 flex flex-col gap-1">
                                                <Badge variant="outline" className="w-fit text-[8px] font-black border-blue-500/30 text-blue-400 uppercase tracking-tighter">Tier {RAID_CONFIG[key]?.tier || '??'}</Badge>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[11px] font-black uppercase text-zinc-100 group-hover:text-blue-400 transition-colors truncate pr-2">
                                                        {RAID_CONFIG[key]?.name || key.split('-').join(' ')}
                                                    </span>
                                                    <span className="text-[10px] font-black text-rose-500">{data.summary}</span>
                                                </div>
                                            </div>
                                            <div className="px-4 py-4 space-y-4">
                                                {/* Mythic */}
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] font-black text-zinc-500 tracking-wider">MÍTICO</span>
                                                        <span className="text-[11px] font-black text-orange-400">{data.mythic_bosses_killed}/{data.total_bosses}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/[0.03] rounded-full">
                                                        <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full shadow-[0_0_8px_rgba(251,146,60,0.3)]" style={{ width: `${(data.mythic_bosses_killed / data.total_bosses) * 100}%` }} />
                                                    </div>
                                                </div>

                                                {/* Heroic */}
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[9px] font-black text-zinc-500 tracking-wider">HEROICO</span>
                                                        <span className="text-[11px] font-black text-purple-400">{data.heroic_bosses_killed}/{data.total_bosses}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/[0.03] rounded-full">
                                                        <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full" style={{ width: `${(data.heroic_bosses_killed / data.total_bosses) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {activeRaids.length === 0 && (
                                        <div className="col-span-full py-12 text-center bg-white/[0.01] rounded-3xl border border-dashed border-white/10">
                                            <div className="flex flex-col items-center gap-2">
                                                <IconX className="size-6 text-zinc-700" />
                                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Sin registros de banda en este tier</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Service Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/5">
                                <a href={`https://raider.io/characters/eu/${application.character_realm}/${application.character_name}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 hover:border-orange-500/30 transition-all group">
                                    <Image src="/assets/images/icons/raiderio.png" alt="RIO" width={28} height={28} className="object-contain group-hover:scale-110 transition-transform" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Raider.io</span>
                                        <span className="text-[8px] font-bold text-orange-400/70 uppercase">Perfil Completo</span>
                                    </div>
                                </a>
                                <a href={`https://www.warcraftlogs.com/character/eu/${application.character_realm}/${application.character_name}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group">
                                    <Image src="/assets/images/icons/wcl.png" alt="WCL" width={28} height={28} className="object-contain group-hover:scale-110 transition-transform" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">WarcraftLogs</span>
                                        <span className="text-[8px] font-bold text-blue-400/70 uppercase">Logs y Rankings</span>
                                    </div>
                                </a>
                                <a href={`https://worldofwarcraft.blizzard.com/es-es/character/eu/${application.character_realm}/${application.character_name}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/20 transition-all group">
                                    <Image src="/assets/images/icons/armory.png" alt="Armory" width={28} height={28} className="object-contain invert opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Armory</span>
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase">Perfil Oficial</span>
                                    </div>
                                </a>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 2. APPLICATION FORM ANSWERS (FULL WIDTH, COMPACT) */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <IconHeartHandshake className="size-5 text-blue-500" />
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">Respuestas del Formulario</h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {answers.sort((a, b) => a.recruitment_questions.order_index - b.recruitment_questions.order_index).map((ans: any, idx: number) => (
                        <Card key={idx} className="bg-card/20 border-border/10 overflow-hidden hover:bg-card/30 transition-colors">
                            <CardContent className="p-4">
                                <Label className="text-blue-400/80 font-black mb-1.5 block text-[10px] uppercase tracking-[0.2em]">
                                    {ans.recruitment_questions.label}
                                </Label>
                                <div className="text-sm text-zinc-200 leading-snug whitespace-pre-wrap">
                                    {ans.answer_text}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {answers.length === 0 && (
                        <div className="col-span-full p-10 text-center text-muted-foreground border border-dashed border-border/20 rounded-2xl">
                            No hay respuestas registradas.
                        </div>
                    )}
                </div>
            </div>

            {/* 3. INTERNAL NOTES (AT THE VERY BOTTOM) */}
            <div className="space-y-4 border-t border-white/5 pt-8">
                <div className="flex items-center gap-3 px-2">
                    <IconShield className="size-5 text-purple-500" />
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">Notas Internas de Oficiales</h3>
                </div>
                <Card className="bg-purple-500/5 border-purple-500/10 overflow-hidden">
                    <CardContent className="p-0">
                        <textarea
                            className="w-full h-32 bg-transparent border-none p-4 text-sm text-white resize-none outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-purple-500/30"
                            placeholder="Escribe notas privadas para el resto de oficiales sobre este aplicante..."
                            defaultValue={application.internal_notes || ""}
                            onBlur={async (e) => {
                                await supabase.from("recruitment_applications").update({ internal_notes: e.target.value }).eq("id", application.id)
                                toast.success("Nota guardada")
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
