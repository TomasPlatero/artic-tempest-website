"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconTimeline, IconSettings, IconClock, IconArrowLeft, IconClipboardText, IconCopy, IconCheck, IconTrash } from "@tabler/icons-react"
import { useSearchParams } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"

import { MIDNIGHT_RAIDS } from "@/infrastructure/constants/raids"
import { BOSS_TIMELINES } from "@/infrastructure/constants/cd-planner"

export type CooldownDefinition = {
    id: string
    name: string
    icon: string
    duration: number
    class_id: number
    ability_type: 'RAID' | 'EXTERNAL' | 'PERSONAL' | 'UTILITY'
    allowed_specs: number[] | null
    color: string
}

export function PlanificadorCdsClient() {
    const searchParams = useSearchParams()
    const eventIdParam = searchParams.get("event_id")
    const bossParam = searchParams.get("boss")
    const initialTabParam = searchParams.get("tab") // selection, planner, mrt

    const [mounted, setMounted] = useState(false)
    const [activeTab, setActiveTab] = useState("selection")
    const [selectedRaid, setSelectedRaid] = useState(MIDNIGHT_RAIDS[0])
    const [selectedBoss, setSelectedBoss] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [copySuccess, setCopySuccess] = useState(false)

    // Recent Events State
    const [recentEvents, setRecentEvents] = useState<any[]>([])
    const [currentEvent, setCurrentEvent] = useState<any>(null)
    const [bossSummaries, setBossSummaries] = useState<any[]>([])

    // Viserio Timeline State
    const [assignments, setAssignments] = useState<{ id: string, member_id: string, cooldown_id: string, time_seconds: number }[]>([])
    const TOTAL_FIGHT_SECONDS = 480 // 8 minutes

    // Interactive Timeline State
    const [hoverTime, setHoverTime] = useState<number | null>(null)
    const [selectedTime, setSelectedTime] = useState<number | null>(null)
    const [draggingAssignment, setDraggingAssignment] = useState<{ id: string, memberId: string, cooldownId: string, startTime: number, currentX: number } | null>(null)
    const [wasDragging, setWasDragging] = useState(false)
    const [timelineRef, setTimelineRef] = useState<HTMLDivElement | null>(null)

    // Roster State (Members with CDs)
    const [healers, setHealers] = useState<any[]>([])
    const [eventSignups, setEventSignups] = useState<any[]>([])
    const [cooldownDefinitions, setCooldownDefinitions] = useState<CooldownDefinition[]>([])

    const isPast = useMemo(() => {
        if (!currentEvent?.end_date) return false
        return new Date(currentEvent.end_date) < new Date()
    }, [currentEvent?.end_date])


    const fetchEventData = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/guild/events/${id}`)
            if (!res.ok) throw new Error("Failed to fetch event data")
            const event = await res.json()
            setCurrentEvent(event)

            // Find the raid that matches the event destination
            // The destination might be the raid name or ID
            const matchingRaid = MIDNIGHT_RAIDS.find(r => r.name === event.destination || r.id === event.destination)
            if (matchingRaid) {
                setSelectedRaid(matchingRaid)

                // If boss is specified in URL, use it. Otherwise, auto-select the first boss of the raid.
                if (bossParam) {
                    setSelectedBoss(bossParam)
                    setActiveTab(initialTabParam || "planner")
                } else {
                    const firstBoss = matchingRaid.bosses[0]
                    if (firstBoss) {
                        setSelectedBoss(firstBoss)
                        setActiveTab(initialTabParam || "planner")
                    }
                }
            }
        } catch (error) {
            console.error("fetchEventData error:", error)
        }
    }, [bossParam, initialTabParam])

    const fetchCooldownDefinitions = useCallback(async () => {
        try {
            const res = await fetch('/api/cd-planner/cooldowns')
            if (!res.ok) throw new Error("Failed to fetch cooldown definitions")
            const data = await res.json()
            setCooldownDefinitions(data)
        } catch (error) {
            console.error("fetchCooldownDefinitions error:", error)
        }
    }, [])

    const fetchRecentEvents = useCallback(async () => {
        try {
            const res = await fetch('/api/guild/events/list')
            if (!res.ok) throw new Error("Failed to fetch recent events")
            const data = await res.json()
            setRecentEvents(data.slice(0, 5)) // Take only the last 5
        } catch (error) {
            console.error("fetchRecentEvents error:", error)
        }
    }, [])

    const fetchBossSummaries = useCallback(async () => {
        try {
            const res = await fetch('/api/cd-planner/boss-summaries')
            if (!res.ok) throw new Error("Failed to fetch boss summaries")
            const data = await res.json()
            setBossSummaries(data)
        } catch (error) {
            console.error("fetchBossSummaries error:", error)
        }
    }, [])

    const fetchEventRoster = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/guild/events/${id}/selected-roster`)
            if (!res.ok) throw new Error("Failed to fetch roster")
            const data = await res.json()
            setEventSignups(data)

            // Map event signups to members with CDs (we do this dynamically now in useEffect, but we can set default here)
            const mapped = data.map((s: any) => {
                const info = s.guild_members;
                if (!info) return null;
                return {
                    id: s.member_id,
                    character_name: info.character_name || "Unknown",
                    class_id: info.class_id || 0,
                    spec_id: info.spec_id || 0,
                    avatar: null,
                    selected_bosses: s.selected_bosses || []
                };
            }).filter((h: any) => h !== null);

            setHealers(mapped);
            console.log(`Event ${id} members with CDs fetched:`, mapped.length);
        } catch (error) {
            console.error("fetchEventRoster error:", error)
        }
    }, [])

    const fetchAssignments = useCallback(async (eventId: string, bossName: string) => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/cd-planner/assignments?event_id=${eventId}&boss_name=${encodeURIComponent(bossName)}`)
            if (!res.ok) throw new Error("Failed to fetch assignments")
            const data = await res.json()
            setAssignments(data)
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Initialize
    useEffect(() => {
        setMounted(true)
        fetchCooldownDefinitions()
        if (eventIdParam) {
            fetchEventData(eventIdParam)
            fetchEventRoster(eventIdParam)
        } else {
            fetchRecentEvents()
            fetchBossSummaries()
            // Default mock roster if no event specified
            setHealers([
                { id: "mock-1", character_name: "Averzian", class_id: 2 },
                { id: "mock-2", character_name: "Vorasius", class_id: 13 },
                { id: "mock-3", character_name: "Salhadaar", class_id: 7 },
                { id: "mock-4", character_name: "Vaelgor", class_id: 5 },
                { id: "mock-5", character_name: "Vanguardia", class_id: 10 },
                { id: "mock-6", character_name: "Belo'ren", class_id: 7 },
                { id: "mock-7", character_name: "Crown", class_id: 11 },
                { id: "mock-8", character_name: "Chimaerus", class_id: 2 },
            ])
        }

        if (bossParam) {
            setSelectedBoss(bossParam)
            setActiveTab(initialTabParam || "planner")
        }
    }, [eventIdParam, bossParam, initialTabParam, fetchCooldownDefinitions, fetchEventData, fetchEventRoster, fetchRecentEvents, fetchBossSummaries])

    // Load assignments when boss changes
    useEffect(() => {
        if (eventIdParam && selectedBoss) {
            fetchAssignments(eventIdParam, selectedBoss)
        }
    }, [eventIdParam, selectedBoss, fetchAssignments])

    // Update healers when boss or event changes
    useEffect(() => {
        if (!currentEvent || eventSignups.length === 0) return;

        const isGeneralRoster = !currentEvent.selected_bosses || currentEvent.selected_bosses.length === 0;

        const mapped = eventSignups.map((s: any) => {
            const info = s.guild_members;
            if (!info) return null;
            return {
                id: s.member_id,
                character_name: info.character_name || "Unknown",
                class_id: info.class_id || 0,
                spec_id: info.spec_id || 0,
                avatar: null,
                selected_bosses: s.selected_bosses || []
            };
        }).filter((h: any) => h !== null);

        const filtered = mapped.filter((h: any) => {
            if (isGeneralRoster) return true;
            return h.selected_bosses.includes(selectedBoss);
        });

        setHealers(filtered);
    }, [selectedBoss, currentEvent, eventSignups])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = Math.floor(seconds % 60)
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    const handleAssignCooldown = async (memberId: string, cooldownId: string, timeSeconds: number, existingId?: string) => {
        // Optimistic update
        const tempId = existingId || `temp-${Math.random().toString(36).substr(2, 9)}`
        const newAssign = { id: tempId, member_id: memberId, cooldown_id: cooldownId, time_seconds: timeSeconds }

        if (existingId) {
            setAssignments(prev => prev.map(a => a.id === existingId ? newAssign : a))
        } else {
            setAssignments(prev => [...prev, newAssign])
        }

        if (eventIdParam && selectedBoss) {
            try {
                const res = await fetch("/api/cd-planner/assignments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: existingId && !existingId.startsWith("temp") ? existingId : undefined,
                        event_id: eventIdParam,
                        boss_name: selectedBoss,
                        member_id: memberId,
                        cooldown_id: cooldownId,
                        time_seconds: timeSeconds
                    })
                })
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Save error");
                }
                const saved = await res.json()
                setAssignments(prev => prev.map(a => a.id === tempId ? saved : a))
            } catch (error: any) {
                console.error("handleAssignCooldown failure:", error.message)
                if (existingId) {
                    // Revert if update fails (might need to fetch original state if we want perfection)
                    fetchAssignments(eventIdParam, selectedBoss)
                } else {
                    setAssignments(prev => prev.filter(a => a.id !== tempId))
                }
            }
        }
    }

    const handleTimelineMouseMove = (e: React.MouseEvent) => {
        if (!timelineRef) return
        const rect = timelineRef.getBoundingClientRect()
        const mouseX = e.clientX - rect.left - 200 // Account for sidebar
        if (mouseX < 0) {
            setHoverTime(null)
            return
        }

        const percentage = Math.max(0, Math.min(1, mouseX / (rect.width - 200)))
        const time = Math.round(percentage * TOTAL_FIGHT_SECONDS)
        setHoverTime(time)

        if (draggingAssignment) {
            setDraggingAssignment(prev => prev ? { ...prev, currentX: e.clientX } : null)
            if (!wasDragging) setWasDragging(true)

            // Real-time optimistic update of assignments to show drag movement
            setAssignments(prev => prev.map(a =>
                a.id === draggingAssignment.id ? { ...a, time_seconds: time } : a
            ))
        }
    }

    const handleTimelineMouseLeave = () => {
        setHoverTime(null)
        if (!draggingAssignment) return
    }

    const handleAssignmentMouseDown = (e: React.MouseEvent, assign: any) => {
        e.stopPropagation()
        // Prevent default browser dragging behavior (ghost images)
        if (e.button !== 0) return // Only left click

        setDraggingAssignment({
            id: assign.id,
            memberId: assign.member_id,
            cooldownId: assign.cooldown_id,
            startTime: assign.time_seconds,
            currentX: e.clientX
        })
    }

    const handleTimelineMouseUp = (e: React.MouseEvent) => {
        if (draggingAssignment && hoverTime !== null) {
            handleAssignCooldown(
                draggingAssignment.memberId,
                draggingAssignment.cooldownId,
                hoverTime,
                draggingAssignment.id
            )
            // Use setTimeout to ensure the click event has time to fire and be ignored
            setTimeout(() => setWasDragging(false), 50)
        } else {
            if (!wasDragging && hoverTime !== null) {
                setSelectedTime(hoverTime)
            }
            setWasDragging(false)
        }
        setDraggingAssignment(null)
    }

    const handleDeleteAssignment = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const previous = [...assignments]
        setAssignments(prev => prev.filter(a => a.id !== id))

        if (eventIdParam && !id.startsWith("temp") && id.length > 20) {
            try {
                const res = await fetch(`/api/cd-planner/assignments?id=${id}`, { method: "DELETE" })
                if (!res.ok) throw new Error("Delete error")
            } catch (error) {
                console.error(error)
                setAssignments(previous)
            }
        }
    }

    // Note Generation (MRT Format)
    const generateMRTNote = () => {
        if (assignments.length === 0) return "No hay CD's asignados aún."

        let note = `[color=cfffd000]Nota de CD's: ${selectedBoss}[/color]\n`

        // Sort assignments by time
        const sorted = [...assignments].sort((a, b) => a.time_seconds - b.time_seconds)

        sorted.forEach((a: any) => {
            const healer = healers.find((h: any) => h.id === a.member_id)
            const cd = cooldownDefinitions.find((c: any) => c.id === a.cooldown_id)
            if (healer && cd) {
                note += `{time:${formatTime(a.time_seconds)}} ${healer.character_name} - ${cd.name}\n`
            }
        })
        return note
    }

    const handleCopyNote = () => {
        navigator.clipboard.writeText(generateMRTNote())
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
    }

    const renderBossCard = (boss: string, idx: number, parentRaid: any) => {
        const isGeneralRoster = !currentEvent?.selected_bosses || currentEvent.selected_bosses.length === 0;
        const isBossEnabled = isGeneralRoster || (currentEvent?.selected_bosses || []).includes(boss);

        return (
            <div key={boss} className="flex flex-col gap-3">
                <Card className={cn(
                    "border-border/40 overflow-hidden relative h-44 rounded-xl shadow-2xl border flex flex-col transition-all duration-300",
                    isBossEnabled ? "bg-[#121217]/90 group/boss hover:border-blue-500/30" : "bg-[#121217]/40 grayscale opacity-60"
                )}>
                    <div
                        className={cn(
                            "absolute inset-x-0 top-0 h-32 bg-cover bg-center transition-all duration-500",
                            isBossEnabled ? "opacity-20 group-hover/boss:opacity-40 grayscale group-hover/boss:grayscale-0" : "opacity-10 grayscale"
                        )}
                        style={{ backgroundImage: `url(${parentRaid.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/60 to-transparent pointer-events-none" />

                    {/* Disabled overlay */}
                    {!isBossEnabled && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-red-500/80 font-black uppercase text-sm tracking-widest border border-red-500/20 px-3 py-1 rounded bg-red-950/40">No hay roster</span>
                            </div>
                        </div>
                    )}

                    <CardHeader className="relative z-10 pl-5 pt-3 pb-0">
                        <h3 className={cn("text-[17px] font-black uppercase tracking-tight truncate", isBossEnabled ? "text-white/90 group-hover:text-white transition-colors" : "text-white/40")}>
                            {boss}
                        </h3>
                        <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] mt-1 truncate">
                            {parentRaid.name}
                        </span>
                    </CardHeader>

                    <CardContent className="relative z-10 px-5 pt-5 pb-6 mt-auto flex gap-2">
                        <Button
                            variant="secondary"
                            disabled={!isBossEnabled}
                            className="flex-1 h-9 text-[9px] font-black px-2 bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest shadow-xl backdrop-blur-md"
                            onClick={() => {
                                setSelectedBoss(boss);
                                setActiveTab("planner");
                            }}
                        >
                            Asignar CD&apos;s
                        </Button>
                        <Button
                            variant="secondary"
                            disabled={!isBossEnabled}
                            className="flex-1 h-9 text-[9px] font-black px-2 bg-amber-600/10 text-amber-500 border border-amber-500/20 hover:bg-amber-600 hover:text-white transition-all uppercase tracking-widest shadow-xl backdrop-blur-md"
                            onClick={() => {
                                setSelectedBoss(boss);
                                setActiveTab("mrt");
                            }}
                        >
                            Nota MRT
                        </Button>
                    </CardContent>
                </Card>

                {/* Boss Planning Details Card (Viserio Style) */}
                <div className="bg-[#121217]/60 border border-border/20 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Planificaciones</span>
                        <span className="text-[9px] font-bold text-blue-400/60 uppercase tracking-tighter">Historial</span>
                    </div>

                    {bossSummaries.filter(s => s.boss_name === boss).length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {bossSummaries.filter(s => s.boss_name === boss).slice(0, 3).map((ev) => (
                                <div
                                    key={ev.id}
                                    className="group/plan flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded-lg hover:border-blue-500/30 cursor-pointer transition-all"
                                    onClick={() => {
                                        window.location.href = `/dashboard/planificador-cds?event_id=${ev.id}&boss=${encodeURIComponent(boss)}`;
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-white/80 group-hover/plan:text-white">{boss}</span>
                                        <span className="text-[9px] text-muted-foreground/50 font-bold uppercase overflow-hidden text-ellipsis whitespace-nowrap max-w-[140px]">
                                            {new Date(ev.event_date).toLocaleDateString("es-ES", { day: '2-digit', month: 'short' })} • {ev.difficulty}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            <div className="size-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[8px] font-black text-blue-400" title={`${ev.assignment_count} asignaciones`}>
                                                {ev.assignment_count}
                                            </div>
                                        </div>
                                        <IconTimeline className="size-3.5 text-muted-foreground/40 group-hover/plan:text-blue-400 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-4 bg-black/20 rounded-lg border border-dashed border-white/5">
                            <IconTimeline className="size-5 text-muted-foreground/30 mb-2" />
                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Sin registros</span>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (!mounted) return null

    return (
        <div className="flex flex-col gap-4">
            {/* Header Main Card */}
            <Card className="bg-[#0a0a0f]/80 border border-border/40 rounded-xl p-6 shadow-2xl relative overflow-hidden group/header h-32 flex items-center">
                {selectedRaid.image && (
                    <div
                        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-700 opacity-10 group-hover/header:opacity-20 scale-105 group-hover/header:scale-100"
                        style={{
                            backgroundImage: `url(${selectedRaid.image})`
                        }}
                    />
                )}
                <div className="flex items-center gap-6 relative z-10">
                    <div className="size-16 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-lg backdrop-blur-sm">
                        <IconTimeline className="size-8 text-blue-400" stroke={1.5} />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-[28px] font-black uppercase tracking-tight text-white mb-1">Planificador de CD&apos;s</h1>
                        <p className="text-[10px] font-bold text-blue-400/80 uppercase tracking-[0.3em] font-mono">Midnight Expansion • Coord. de Hermandad</p>
                    </div>
                </div>
            </Card>

            {/* Active Event Information */}
            {eventIdParam && currentEvent && (
                <div className="mb-2">
                    <div className="bg-blue-600/5 border border-blue-500/20 rounded-xl p-4 backdrop-blur-md flex items-center justify-between group/event-banner hover:border-blue-500/40 transition-all duration-300">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Evento Activo</span>
                                    {isPast && (
                                        <span className="bg-amber-500/10 text-amber-500 text-[9px] px-1.5 py-0.5 rounded border border-amber-500/20 font-black uppercase tracking-tighter animate-pulse">
                                            Finalizado
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-lg font-black text-white/90 uppercase tracking-tight">{currentEvent.destination}</h2>
                            </div>
                            <div className="h-10 w-px bg-border/20" />
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-0.5">Fecha</span>
                                    <span className="text-sm font-bold text-white/80">{new Date(currentEvent.event_date).toLocaleDateString("es-ES", { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-0.5">Dificultad</span>
                                    <span className="text-sm font-bold text-amber-400/80 uppercase">{currentEvent.difficulty}</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white hover:bg-white/5 gap-2"
                            onClick={() => window.location.href = '/dashboard/planificador-cds'}
                        >
                            <IconArrowLeft className="size-4" />
                            Cambiar Evento
                        </Button>
                    </div>
                </div>
            )}

            {/* Raid Selection Sub-Menu Card - Only show in selection tab */}
            {activeTab === "selection" && (
                <div className="relative group/tabs">
                    <Card className="bg-[#121217]/50 border border-border/40 rounded-xl px-2 shadow-xl relative overflow-hidden backdrop-blur-sm">
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1 no-scrollbar flex-nowrap touch-pan-x">
                            {MIDNIGHT_RAIDS.map(raid => (
                                <button
                                    key={raid.id}
                                    onClick={() => {
                                        setSelectedRaid(raid)
                                        setActiveTab("selection")
                                    }}
                                    className={`flex-1 min-w-[max-content] px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 relative rounded-lg shrink-0 ${selectedRaid.id === raid.id
                                        ? "text-blue-400 bg-blue-500/5 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] border border-blue-500/10"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                                        }`}
                                >
                                    <span className="relative z-10">{raid.name}</span>
                                    {selectedRaid.id === raid.id && (
                                        <div className="absolute inset-x-2 bottom-1 h-0.5 bg-blue-500/50 rounded-full blur-[0.5px]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </Card>
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#121217] to-transparent pointer-events-none opacity-0 group-hover/tabs:opacity-100 transition-opacity" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#121217] to-transparent pointer-events-none opacity-0 group-hover/tabs:opacity-100 transition-opacity" />
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                <TabsList className="hidden">
                    <TabsTrigger value="selection">Selection</TabsTrigger>
                    <TabsTrigger value="planner">Planner</TabsTrigger>
                    <TabsTrigger value="mrt">MRT Note</TabsTrigger>
                </TabsList>

                <TabsContent value="selection" className="m-0">
                    {selectedRaid.id === "Todas las Raids" ? (
                        <div className="flex flex-col gap-10">
                            {MIDNIGHT_RAIDS.filter((r) => r.id !== "Todas las Raids").map((subRaid) => (
                                <div key={subRaid.id} className="flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-4 w-1 bg-primary/40 rounded-full" />
                                        <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-white/60">
                                            {subRaid.name}
                                        </h3>
                                        <div className="h-px flex-1 bg-border/10" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {subRaid.bosses.map((boss, idx) => renderBossCard(boss, idx, subRaid))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {selectedRaid.bosses.map((boss, idx) => renderBossCard(boss, idx, selectedRaid))}
                        </div>
                    )}

                    {/* Recent Events Panel */}
                    {!eventIdParam && recentEvents.length > 0 && (
                        <div className="mt-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px flex-1 bg-border/20" />
                                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 whitespace-nowrap">Eventos Recientes</h2>
                                <div className="h-px flex-1 bg-border/20" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {recentEvents.map((ev) => (
                                    <Card
                                        key={ev.id}
                                        className="bg-[#121217]/40 border-border/20 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group/event shadow-lg rounded-xl overflow-hidden"
                                        onClick={() => {
                                            // Simulate navigation by setting the params logically
                                            // In a real app, we might want to update the URL with router.push
                                            window.location.href = `/dashboard/planificador-cds?event_id=${ev.id}`;
                                        }}
                                    >
                                        <CardContent className="p-4 pb-10">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{ev.destination}</span>
                                                <span className="text-[12px] font-bold text-white/90 truncate">{new Date(ev.event_date).toLocaleDateString("es-ES", { day: '2-digit', month: 'short' })} - {ev.difficulty}</span>
                                            </div>
                                            <div className="mt-4 opacity-0 group-hover/event:opacity-100 transition-opacity flex justify-end">
                                                <IconTimeline className="size-4 text-blue-400" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="planner" className="m-0">
                    <Card className="bg-[#121217] border-border/50 overflow-hidden shadow-2xl rounded-xl">
                        <div className="flex border-b border-border/40 bg-muted/5 items-center justify-between px-6 h-16">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground h-9 gap-2"
                                    onClick={() => setActiveTab("selection")}
                                >
                                    <IconArrowLeft className="size-4" />
                                    Volver a Bosses
                                </Button>
                                <div className="h-4 w-px bg-border/40 mx-2" />
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase text-blue-400 tracking-wider truncate max-w-[250px]">{selectedBoss}</span>
                                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">Planificador de Banda</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 px-4 py-2 bg-background/50 rounded-lg border border-border/10 cursor-help" title="Duración estimada del encuentro para la planificación">
                                    <IconClock className="size-3.5 text-muted-foreground" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">0:00 - {formatTime(TOTAL_FIGHT_SECONDS)}</span>
                                </div>
                            </div>
                        </div>

                        <div
                            className="p-0 overflow-x-auto select-none bg-[#0a0a0f] relative no-scrollbar scrollbar-hide"
                            ref={setTimelineRef}
                            onMouseMove={handleTimelineMouseMove}
                            onMouseLeave={handleTimelineMouseLeave}
                            onMouseUp={handleTimelineMouseUp}
                        >
                            <div className="min-w-[1400px] flex flex-col relative pb-10">
                                <div className="h-6 flex relative border-b border-border/10 sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-md">
                                    <div className="w-[200px] border-r border-border/20 shrink-0 sticky left-0 z-40 bg-[#0a0a0f]/90" />
                                    <div className="flex-1 relative">
                                        {[...Array(16)].map((_, i) => {
                                            const timeMarker = (TOTAL_FIGHT_SECONDS / 16) * i;
                                            return (
                                                <div key={i} className="absolute inset-y-0 w-px bg-white/5" style={{ left: `${(timeMarker / TOTAL_FIGHT_SECONDS) * 100}%` }}>
                                                    <span className="absolute top-1 -left-3 text-[9px] font-bold text-muted-foreground/60">{formatTime(timeMarker)}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Full-Height Indicator Lines */}
                                <div className="absolute inset-0 pointer-events-none z-40 ml-[200px]">
                                    {hoverTime !== null && (
                                        <div
                                            className="absolute inset-y-0 w-px bg-white/20 pointer-events-none"
                                            style={{ left: `${(hoverTime / TOTAL_FIGHT_SECONDS) * 100}%` }}
                                        >
                                            <div className="sticky top-0 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-lg border border-blue-400/30 z-50">
                                                {formatTime(hoverTime)}
                                            </div>
                                        </div>
                                    )}

                                    {selectedTime !== null && (
                                        <div
                                            className="absolute inset-y-0 w-px bg-blue-500 pointer-events-none shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                                            style={{ left: `${(selectedTime / TOTAL_FIGHT_SECONDS) * 100}%` }}
                                        >
                                            <div className="sticky top-0 -translate-x-1/2 bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-md border border-blue-400/30">
                                                {formatTime(selectedTime)}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="h-28 border-b border-border/10 flex relative group/bosstrack hover:bg-white/[0.01] transition-colors">
                                    <div className="w-[200px] border-r border-border/20 p-4 flex flex-col justify-center gap-2 shrink-0 bg-[#0d0d12] backdrop-blur-xl z-20 sticky left-0">
                                        <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Línea de Tiempo</span>
                                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Habilidades Boss</span>
                                    </div>
                                    <div className="flex-1 relative overflow-hidden bg-grid-white/[0.01]">
                                        {[...Array(16)].map((_, i) => (
                                            <div key={i} className="absolute inset-y-0 w-px bg-white/[0.02] pointer-events-none" style={{ left: `${((TOTAL_FIGHT_SECONDS / 16) * i) / TOTAL_FIGHT_SECONDS * 100}%` }} />
                                        ))}

                                        {(BOSS_TIMELINES[selectedBoss] || []).map((ability, i) => (
                                            <div
                                                key={`boss-${i}`}
                                                className="absolute top-8 w-[100px] h-7 bg-red-950/40 border border-red-500/40 rounded flex items-center px-2 text-[9px] font-bold text-red-200 shadow-lg justify-start gap-1 overflow-hidden"
                                                style={{ left: `${(ability.time / TOTAL_FIGHT_SECONDS) * 100}%` }}
                                                title={`${formatTime(ability.time)} - ${ability.name}`}
                                            >
                                                <div className="w-1 h-full bg-red-500/80 absolute left-0" />
                                                <span className="ml-1 truncate">{formatTime(ability.time)} {ability.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col border-t border-border/10">
                                    {healers.length === 0 ? (
                                        <div className="h-40 flex items-center justify-center text-muted-foreground text-sm uppercase tracking-widest font-black opacity-50">
                                            No hay healers seleccionados en el roster
                                        </div>
                                    ) : (
                                        healers.map((h: any, hIndex: number) => {
                                            const hCooldowns = cooldownDefinitions.filter((c: CooldownDefinition) => {
                                                if (c.class_id !== h.class_id) return false;
                                                if (!c.allowed_specs) return true;
                                                return c.allowed_specs.includes(h.spec_id);
                                            })
                                            if (hCooldowns.length === 0) return null;

                                            const classColor = hCooldowns[0]?.color || '#ffffff'

                                            return (
                                                <div key={hIndex} className="flex border-b border-border/10">
                                                    <div className="w-[200px] border-r border-border/20 shrink-0 flex items-stretch bg-[#0d0d12] sticky left-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
                                                        <div className="w-9 flex flex-col items-center justify-center py-4 border-r border-border/10 bg-black/20 overflow-hidden h-full"
                                                            style={{ borderLeftWidth: '3px', borderLeftColor: classColor }}>
                                                            <span className="text-[10px] font-black uppercase tracking-wider -rotate-90 whitespace-nowrap" style={{ color: classColor }}>
                                                                {h.character_name}
                                                            </span>
                                                        </div>

                                                        <div className="flex-1 flex flex-col bg-black/40">
                                                            {hCooldowns.map(cd => (
                                                                <div key={cd.id} className="h-[48px] flex items-center justify-between pl-3 pr-2 group/cdname hover:bg-white/[0.02] transition-colors border-b border-border/5 last:border-0">
                                                                    <span className="text-[10px] font-bold text-white/80 truncate pr-2 group-hover/cdname:text-white transition-colors">{cd.name}</span>
                                                                    <Image src={cd.icon} alt={cd.name} width={18} height={18} className="rounded shadow-sm opacity-90 mix-blend-screen" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 flex flex-col relative bg-grid-white/[0.01]">
                                                        <div className="absolute inset-0 pointer-events-none">
                                                            {[...Array(16)].map((_, i) => (
                                                                <div key={`grid-${i}`} className="absolute inset-y-0 w-px bg-white/[0.02]" style={{ left: `${((TOTAL_FIGHT_SECONDS / 16) * i) / TOTAL_FIGHT_SECONDS * 100}%` }} />
                                                            ))}
                                                        </div>

                                                        {hCooldowns.map((cd: any) => {
                                                            const rowAssignments = assignments.filter((a: any) => a.member_id === h.id && a.cooldown_id === cd.id)

                                                            return (
                                                                <div
                                                                    key={`track-${cd.id}`}
                                                                    className="h-[48px] relative cursor-crosshair hover:bg-white/[0.03] transition-colors group/track border-b border-border/5 last:border-0"
                                                                    onClick={(e) => {
                                                                        if (isLoading || wasDragging) return;
                                                                        const rect = e.currentTarget.getBoundingClientRect()
                                                                        const clickX = e.clientX - rect.left
                                                                        const percentage = Math.max(0, clickX / rect.width)
                                                                        const timeClicked = Math.round(percentage * TOTAL_FIGHT_SECONDS)
                                                                        handleAssignCooldown(h.id, cd.id, timeClicked)
                                                                    }}
                                                                >
                                                                    {rowAssignments.map((assign: any) => (
                                                                        <div
                                                                            key={assign.id}
                                                                            className={cn(
                                                                                "absolute top-1 bottom-1 w-[120px] rounded border shadow-lg flex items-center pr-2 gap-2 overflow-hidden transition-all z-20 group/assign",
                                                                                draggingAssignment?.id === assign.id ? "opacity-50 cursor-grabbing scale-95 ring-2 ring-white/20" : "hover:brightness-125 cursor-grab active:cursor-grabbing"
                                                                            )}
                                                                            style={{
                                                                                left: `${(assign.time_seconds / TOTAL_FIGHT_SECONDS) * 100}%`,
                                                                                backgroundColor: `${cd.color}20`,
                                                                                borderColor: `${cd.color}40`,
                                                                                borderLeftWidth: '3px',
                                                                                borderLeftColor: cd.color
                                                                            }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onMouseDown={(e) => handleAssignmentMouseDown(e, assign)}
                                                                            onDragStart={(e) => e.preventDefault()}
                                                                        >
                                                                            <Image src={cd.icon} alt={cd.name} width={32} height={32} className="h-full w-auto object-cover opacity-90 pointer-events-none" />
                                                                            <div className="flex flex-col min-w-0">
                                                                                <span className="text-[9px] font-black uppercase text-white truncate drop-shadow-md leading-tight" style={{ color: cd.color }}>{h.character_name}</span>
                                                                                <span className="text-[8px] font-black text-white/60 drop-shadow-md leading-tight">{formatTime(assign.time_seconds)}</span>
                                                                            </div>

                                                                            <button
                                                                                className="ml-auto opacity-0 group-hover/assign:opacity-100 text-red-400 hover:text-red-300 flex-shrink-0"
                                                                                onClick={(e) => handleDeleteAssignment(assign.id, e)}
                                                                            >
                                                                                <IconTrash className="size-3" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="mrt" className="m-0">
                    <Card className="bg-[#121217] border-border/50 overflow-hidden shadow-2xl rounded-xl">
                        <div className="flex border-b border-border/40 bg-muted/5 items-center justify-between px-6 h-16">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground h-9 gap-2"
                                    onClick={() => setActiveTab("selection")}
                                >
                                    <IconArrowLeft className="size-4" />
                                    Volver a Bosses
                                </Button>
                                <div className="h-4 w-px bg-border/40 mx-2" />
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase text-amber-500 tracking-wider truncate max-w-[250px]">{selectedBoss} - Nota MRT</span>
                                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">Generador de Notas</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleCopyNote}
                                    className={cn(
                                        "h-9 px-4 text-[10px] font-black uppercase tracking-widest transition-all",
                                        copySuccess ? "bg-emerald-600 hover:bg-emerald-500" : "bg-amber-600 hover:bg-amber-500"
                                    )}
                                >
                                    {copySuccess ? (
                                        <>
                                            <IconCheck className="size-4 mr-2" />
                                            Copiado!
                                        </>
                                    ) : (
                                        <>
                                            <IconCopy className="size-4 mr-2" />
                                            Copiar Nota
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="p-8 bg-[#0a0a0f]">
                            <div className="max-w-3xl mx-auto">
                                <div className="mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                            <IconClipboardText className="size-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black uppercase tracking-widest text-white">Method Raid Tools Note</h4>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Copia este texto y pégalo en el MRT ingame</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <textarea
                                        readOnly
                                        className="w-full h-[400px] bg-black/60 border border-border/20 rounded-xl p-6 font-mono text-sm text-amber-500/90 focus:outline-none focus:border-amber-500/40 transition-all resize-none shadow-inner"
                                        value={generateMRTNote()}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    )
}
