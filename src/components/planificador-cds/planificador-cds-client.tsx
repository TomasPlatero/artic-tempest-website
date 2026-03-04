"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconTimeline, IconSettings, IconClock, IconArrowLeft, IconClipboardText, IconCopy, IconCheck, IconTrash, IconZoomIn, IconZoomOut, IconZoomReset, IconLayoutList, IconFilter, IconEye, IconEyeOff, IconGripVertical, IconShield, IconPlus, IconSword, IconBow } from "@tabler/icons-react"
import { useSearchParams } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


import { MIDNIGHT_RAIDS } from "@/infrastructure/constants/raids"
import { BOSS_TIMELINES, BOSS_ABILITY_META } from "@/infrastructure/constants/cd-planner"

export type CooldownDefinition = {
    id: string
    name: string
    icon: string
    duration: number
    class_id: number
    ability_type: 'RAID' | 'EXTERNAL' | 'PERSONAL' | 'UTILITY'
    allowed_specs: number[] | null
    color: string
    spell_id?: number
    category?: string
    active_duration?: number
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// ZOOM OVERLAY COMPONENT
// ---------------------------------------------------------------------------------------------------------------------------------------------------------
function TimelineZoomOverlay({
    cooldownId,
    cooldownDefinitions,
    dragTime,
    mouseX,
    mouseY,
    selectedBoss,
    assignments,
    healers
}: {
    cooldownId: string
    cooldownDefinitions: CooldownDefinition[]
    dragTime: number
    mouseX: number
    mouseY: number
    selectedBoss: string
    assignments: any[]
    healers: any[]
}) {
    const WINDOW_SECONDS = 30 // 15s before, 15s after
    const HALF_WINDOW = WINDOW_SECONDS / 2
    const startWindow = Math.max(0, dragTime - HALF_WINDOW)
    const endWindow = startWindow + WINDOW_SECONDS

    const cdDef = cooldownDefinitions.find(c => c.id === cooldownId)
    const bossAbilities = (BOSS_TIMELINES[selectedBoss] || []).filter(b => b.time >= startWindow && b.time <= endWindow)

    // Filter assignments in window (excluding the one being dragged)
    const activeAssignments = assignments.filter(a => {
        return a.time_seconds >= startWindow && a.time_seconds <= endWindow && a.cooldown_id !== cooldownId
    })

    const getLeftPos = (time: number) => {
        const relativeTime = time - startWindow
        return `${(relativeTime / WINDOW_SECONDS) * 100}%`
    }

    return (
        <div
            className="fixed z-[100] pointer-events-none bg-[#0a0a0f] border border-border/40 shadow-2xl rounded-xl w-[600px] overflow-hidden backdrop-blur-md bottom-6 right-6"
        >
            <div className="bg-white/[0.02] border-b border-border/10 p-3 pt-2 pb-2 flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">Previo: —</span>
                <div className="flex flex-col items-center">
                    <span className="text-sm font-black text-white">{Math.floor(dragTime / 60)}:{(dragTime % 60).toString().padStart(2, '0')}</span>
                    <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">{Math.floor(dragTime / 60)}:{(dragTime % 60).toString().padStart(2, '0')}</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">Siguiente: —</span>
            </div>

            <div className="relative p-4 pl-12 pt-6 pb-6 flex flex-col gap-6" style={{ backgroundImage: 'linear-gradient(to right, transparent 49%, rgba(255,255,255,0.1) 49%, rgba(255,255,255,0.1) 51%, transparent 51%)' }}>
                {/* Time markers */}
                <div className="absolute top-1 left-12 right-4 flex justify-between text-[10px] font-bold text-muted-foreground/60">
                    <span>{Math.floor(startWindow / 60)}:{(startWindow % 60).toString().padStart(2, '0')}</span>
                    <span>{Math.floor(endWindow / 60)}:{(endWindow % 60).toString().padStart(2, '0')}</span>
                </div>

                {/* Boss Track */}
                <div className="relative h-8 flex items-center bg-white/[0.02] rounded-md border border-white/[0.05]">
                    <div className="absolute -left-10 w-8 flex items-center justify-center h-full">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase transform -rotate-90">Jefe</span>
                    </div>
                    {bossAbilities.map((b, i) => {
                        const meta = BOSS_ABILITY_META[b.name]
                        return (
                            <div key={`boss-${i}`} className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: getLeftPos(b.time) }}>
                                <span className="text-[10px] font-bold text-white mb-0.5 whitespace-nowrap drop-shadow-md">{Math.floor(b.time / 60)}:{(b.time % 60).toString().padStart(2, '0')}</span>
                                <div className="p-0.5 rounded-sm border" style={{ borderColor: meta?.color || '#fff' }}>
                                    <Image unoptimized src={meta?.icon || 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg'} alt={b.name} width={20} height={20} className="rounded-sm" />
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Player Track (Centered dragged item) */}
                <div className="relative h-12 flex items-center">
                    <div className="absolute -left-10 w-8 flex items-center justify-center h-full">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase transform -rotate-90">Jugador</span>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                        <div
                            className="p-1 rounded bg-black/50 shadow-[0_0_30px_rgba(255,255,0,0.4)] animate-pulse"
                            style={{
                                border: `2px solid ${cdDef?.color || '#fff'}`,
                                boxShadow: `0 0 20px ${cdDef?.color || '#fff'}80`
                            }}
                        >
                            <Image unoptimized src={cdDef?.icon || ''} alt={cdDef?.name || ''} width={32} height={32} className="rounded-sm" />
                        </div>
                    </div>
                </div>

                {/* Friendly Track */}
                <div className="relative h-8 flex items-center bg-white/[0.02] rounded-md border border-white/[0.05]">
                    <div className="absolute -left-10 w-8 flex items-center justify-center h-full">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase transform -rotate-90">Compañeros</span>
                    </div>
                    {activeAssignments.map(a => {
                        const aDef = cooldownDefinitions.find(c => c.id === a.cooldown_id)
                        if (!aDef) return null
                        return (
                            <div key={`friend-${a.id}`} className="absolute top-1/2 -translate-y-1/2" style={{ left: getLeftPos(a.time_seconds) }}>
                                <div className="p-0.5 rounded-sm border opacity-60" style={{ borderColor: aDef.color }}>
                                    <Image unoptimized src={aDef.icon} alt={aDef.name} width={20} height={20} className="rounded-sm" />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
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
    const TOTAL_FIGHT_SECONDS = 555 // 9 minutes 15 seconds

    // Interactive Timeline State
    const [hoverTime, setHoverTime] = useState<number | null>(null)
    const hoverTimeRef = useRef<number | null>(null)
    const hoverLineRef = useRef<HTMLDivElement>(null)
    const hoverBadgeRef = useRef<HTMLDivElement>(null)
    const hoverBadgeContainerRef = useRef<HTMLDivElement>(null)

    const [draggingAssignment, setDraggingAssignment] = useState<{ id: string, memberId: string, cooldownId: string, startTime: number, timeOffset: number } | null>(null)
    const [wasDragging, setWasDragging] = useState(false)
    const [timelineRef, setTimelineRef] = useState<HTMLDivElement | null>(null)
    const [timelineZoom, setTimelineZoom] = useState(1)
    const [condensedView, setCondensedView] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['RAID', 'EXTERNAL', 'PERSONAL', 'UTILITY']))
    const [editingAssignment, setEditingAssignment] = useState<any>(null)
    const [editInputValue, setEditInputValue] = useState("")


    const [floatingTooltip, setFloatingTooltip] = useState<{ visible: boolean; x: number; y: number; time: number }>({ visible: false, x: 0, y: 0, time: 0 });
    const SIDEBAR_WIDTH = 150;

    const FILTER_CATEGORIES = [
        { key: 'RAID', label: 'Raid CDs', color: '#22c55e', description: 'Cooldowns de raid (Tranq, SLT, Revival...)' },
        { key: 'EXTERNAL', label: 'Externals', color: '#3b82f6', description: 'Externals (BoS, Pain Sup, Ironbark...)' },
        { key: 'PERSONAL', label: 'Defensivos', color: '#eab308', description: 'CDs personales y defensivos' },
        { key: 'UTILITY', label: 'Utilidad', color: '#a855f7', description: 'Utilidades (Gateway, Rally, AMZ...)' },
    ] as const

    const toggleFilter = (key: string) => {
        setActiveFilters(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const getRoleSpecs = (classId: number, role: string): number[] | null => {
        // Mapping of class_id to spec_ids by role
        const roleSpecMap: Record<number, Record<string, number[]>> = {
            1: { tank: [73], dps: [71, 72], melee: [71, 72] }, // Warrior
            2: { tank: [66], heal: [65], dps: [70], melee: [70] }, // Paladin
            3: { dps: [253, 254, 255], ranged: [253, 254], melee: [255] }, // Hunter
            4: { dps: [259, 260, 261], melee: [259, 260, 261] }, // Rogue
            5: { heal: [256, 257], dps: [258], ranged: [258] }, // Priest
            6: { tank: [250], dps: [251, 252], melee: [251, 252] }, // Death Knight
            7: { heal: [264], dps: [262, 263], melee: [263], ranged: [262] }, // Shaman
            8: { dps: [62, 63, 64], ranged: [62, 63, 64] }, // Mage
            9: { dps: [265, 266, 267], ranged: [265, 266, 267] }, // Warlock
            10: { tank: [268], heal: [270], dps: [269], melee: [269] }, // Monk
            11: { tank: [104], heal: [105], dps: [102, 103], melee: [103], ranged: [102] }, // Druid
            12: { tank: [581], dps: [577], melee: [577] }, // Demon Hunter
            13: { heal: [1468], dps: [1467, 1473], ranged: [1467, 1473] } // Evoker
        }

        // return mapped specs, or null if all specs are allowed
        return roleSpecMap[classId]?.[role] || null;
    }

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

    const handleUpdateAssignmentTime = async () => {
        if (!editingAssignment || !currentEvent || !selectedBoss) return

        let totalSeconds = 0
        const value = editInputValue.trim()
        if (value.includes(":")) {
            const [m, s] = value.split(":").map(Number)
            totalSeconds = (m || 0) * 60 + (s || 0)
        } else {
            totalSeconds = Number(value)
        }

        if (isNaN(totalSeconds)) {
            setEditingAssignment(null)
            return
        }

        // Optimistic update
        setAssignments(prev => prev.map(a =>
            a.id === editingAssignment.id ? { ...a, time_seconds: totalSeconds } : a
        ))
        setEditingAssignment(null)

        try {
            await fetch('/api/cd-planner/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingAssignment.id,
                    event_id: currentEvent.id,
                    boss_name: selectedBoss,
                    member_id: editingAssignment.member_id,
                    cooldown_id: editingAssignment.cooldown_id,
                    time_seconds: totalSeconds
                })
            })
        } catch (error) {
            console.error("Failed to update assignment time:", error)
        }
    }

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
                    selected_bosses: s.selected_bosses || [],
                    role: s.event_role || "ranged"
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
                selected_bosses: s.selected_bosses || [],
                role: s.event_role || "ranged"
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

    // Native mousemove for buttery smooth hover indicator
    useEffect(() => {
        if (!timelineRef) return
        const el = timelineRef

        const onMove = (e: MouseEvent) => {
            if (draggingAssignment) {
                if (hoverLineRef.current) hoverLineRef.current.style.display = 'none'
                if (hoverBadgeContainerRef.current) hoverBadgeContainerRef.current.style.display = 'none'
                return
            }
            const trackContainer = document.getElementById('timeline-track-container')
            if (!trackContainer) return

            const rect = trackContainer.getBoundingClientRect()
            const mouseX = e.clientX - rect.left

            if (mouseX < 0) {
                if (hoverLineRef.current) hoverLineRef.current.style.display = 'none'
                if (hoverBadgeContainerRef.current) hoverBadgeContainerRef.current.style.display = 'none'
                return
            }
            const percentage = Math.max(0, Math.min(1, mouseX / rect.width))
            if (hoverLineRef.current) {
                hoverLineRef.current.style.display = ''
                hoverLineRef.current.style.transform = `translateX(${mouseX}px)`
            }
            if (hoverBadgeContainerRef.current) {
                hoverBadgeContainerRef.current.style.display = ''
                hoverBadgeContainerRef.current.style.transform = `translateX(${mouseX}px)`
            }
            const t = Math.round(percentage * TOTAL_FIGHT_SECONDS)
            hoverTimeRef.current = t
            setHoverTime(t)
        }

        const onLeave = () => {
            if (hoverLineRef.current) hoverLineRef.current.style.display = 'none'
            if (hoverBadgeContainerRef.current) hoverBadgeContainerRef.current.style.display = 'none'
            hoverTimeRef.current = null
            setHoverTime(null)
            setFloatingTooltip(prev => ({ ...prev, visible: false }));
        }

        el.addEventListener('mousemove', onMove, { passive: true })
        el.addEventListener('mouseleave', onLeave, { passive: true })
        return () => {
            el.removeEventListener('mousemove', onMove)
            el.removeEventListener('mouseleave', onLeave)
        }
    }, [timelineRef, TOTAL_FIGHT_SECONDS, draggingAssignment])

    const handleTimelineMouseMove = (e: React.MouseEvent) => {
        if (!timelineRef) return
        if (draggingAssignment) {
            const trackContainer = document.getElementById('timeline-track-container')
            if (!trackContainer) return

            const rect = trackContainer.getBoundingClientRect()
            const mouseX = e.clientX - rect.left
            const percentage = mouseX / rect.width
            const mouseTime = percentage * TOTAL_FIGHT_SECONDS

            // Subtract the offset to perfectly lock the block under cursor
            const newTime = Math.max(0, Math.min(TOTAL_FIGHT_SECONDS, Math.round(mouseTime - draggingAssignment.timeOffset)))

            // Update floating tooltip to show the NEW start time of the ability being dragged
            setFloatingTooltip({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                time: newTime
            });

            if (!wasDragging) setWasDragging(true)
            setAssignments(prev => prev.map(a =>
                a.id === draggingAssignment.id ? { ...a, time_seconds: newTime } : a
            ))
            setHoverTime(newTime)
        }
    }

    const handleTimelineMouseLeave = () => {
        if (!draggingAssignment) return
    }

    const handleAssignmentMouseDown = (e: React.MouseEvent, assign: any) => {
        e.stopPropagation()
        if (e.button !== 0) return // Only left click

        if (e.ctrlKey) {
            setEditingAssignment(assign)
            setEditInputValue(formatTime(assign.time_seconds))
            return
        }

        // Prevent dragging an assignment that is still saving to the database
        if (assign.id.startsWith("temp")) return

        let timeOffset = 0;
        const trackContainer = document.getElementById('timeline-track-container')
        if (trackContainer) {
            const rect = trackContainer.getBoundingClientRect()
            const mouseX = e.clientX - rect.left
            const percentage = mouseX / rect.width
            const mouseTime = percentage * TOTAL_FIGHT_SECONDS
            timeOffset = mouseTime - assign.time_seconds
        }

        setDraggingAssignment({
            id: assign.id,
            memberId: assign.member_id,
            cooldownId: assign.cooldown_id,
            startTime: assign.time_seconds,
            timeOffset: timeOffset
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
            setTimeout(() => setWasDragging(false), 200)
        } else {
            setWasDragging(false)
        }
        setDraggingAssignment(null)
        setFloatingTooltip(prev => ({ ...prev, visible: false }))
    }

    const handleDeleteAssignment = async (id: string, e: React.MouseEvent) => {
        e.preventDefault()
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
        <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-background">
            {/* Dragging Zoom Overlay */}
            {draggingAssignment && (
                <TimelineZoomOverlay
                    cooldownId={draggingAssignment.cooldownId}
                    cooldownDefinitions={cooldownDefinitions}
                    dragTime={assignments.find(a => a.id === draggingAssignment.id)?.time_seconds || 0}
                    mouseX={floatingTooltip.x}
                    mouseY={floatingTooltip.y}
                    selectedBoss={selectedBoss}
                    assignments={assignments}
                    healers={healers}
                />
            )}

            {/* Header Main Card */}
            <Card className="bg-[#0a0a0f]/80 border border-border/40 rounded-xl p-6 shadow-2xl relative group/header h-32 flex items-center">
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2 flex-1 flex flex-col min-h-0">
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

                <TabsContent value="planner" className="flex-1 m-0 flex flex-col min-h-0 bg-[#121217] data-[state=inactive]:hidden">
                    <Card className="bg-[#121217] flex-1 border-border/50 shadow-2xl rounded-xl flex flex-col min-h-0 overflow-hidden relative">
                        <div className="flex border-b border-border/40 bg-muted/5 items-center justify-between px-6 h-16 shrink-0 relative z-50">
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
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-3 px-4 py-2 bg-background/50 rounded-lg border border-border/10 cursor-help" title="Duración estimada del encuentro para la planificación">
                                    <IconClock className="size-3.5 text-muted-foreground" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">0:00 - {formatTime(TOTAL_FIGHT_SECONDS)}</span>
                                </div>
                                {/* Time segments */}
                                <div className="flex items-center gap-0.5 bg-background/50 rounded-lg border border-border/10 p-1">
                                    {Array.from({ length: Math.ceil(TOTAL_FIGHT_SECONDS / 60) }, (_, i) => {
                                        const segStart = i * 60
                                        const segEnd = Math.min((i + 1) * 60, TOTAL_FIGHT_SECONDS)
                                        return (
                                            <button
                                                key={i}
                                                className={cn(
                                                    "text-[9px] font-bold px-2 py-1 rounded transition-colors",
                                                    "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                                )}
                                                onClick={() => {
                                                    setTimelineZoom(2)
                                                    // Scroll to segment after zoom applies
                                                    requestAnimationFrame(() => {
                                                        if (timelineRef) {
                                                            const contentWidth = timelineRef.scrollWidth - 110
                                                            const segPosition = (segStart / TOTAL_FIGHT_SECONDS) * contentWidth
                                                            timelineRef.scrollLeft = segPosition + 110 - (timelineRef.clientWidth / 4)
                                                        }
                                                    })
                                                }}
                                                title={`${formatTime(segStart)} - ${formatTime(segEnd)}`}
                                            >
                                                {formatTime(segStart)}
                                            </button>
                                        )
                                    })}
                                </div>
                                <div className="flex items-center gap-1 bg-background/50 rounded-lg border border-border/10 p-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTimelineZoom(z => Math.max(0.5, z - 0.25))} disabled={timelineZoom <= 0.5}>
                                        <IconZoomOut className="size-3.5" />
                                    </Button>
                                    <button
                                        className="text-[10px] font-black text-muted-foreground w-10 text-center hover:text-foreground transition-colors"
                                        onClick={() => setTimelineZoom(1)}
                                        title="Resetear zoom"
                                    >
                                        {Math.round(timelineZoom * 100)}%
                                    </button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTimelineZoom(z => Math.min(4, z + 0.25))} disabled={timelineZoom >= 4}>
                                        <IconZoomIn className="size-3.5" />
                                    </Button>
                                </div>
                                <button
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-colors",
                                        condensedView
                                            ? "bg-blue-600/20 border-blue-500/40 text-blue-400"
                                            : "bg-background/50 border-border/10 text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={() => setCondensedView(v => !v)}
                                >
                                    <IconLayoutList className="size-3.5" />
                                    Condensado
                                </button>
                                {/* Spell Filters */}
                                <div className="relative">
                                    <button
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-colors",
                                            showFilters || activeFilters.size < 4
                                                ? "bg-purple-600/20 border-purple-500/40 text-purple-400"
                                                : "bg-background/50 border-border/10 text-muted-foreground hover:text-foreground"
                                        )}
                                        onClick={() => setShowFilters(v => !v)}
                                    >
                                        <IconFilter className="size-3.5" />
                                        Filtros
                                        {activeFilters.size < 4 && (
                                            <span className="bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">{activeFilters.size}</span>
                                        )}
                                    </button>
                                    {showFilters && (
                                        <div className="absolute top-full right-0 mt-2 z-[60] bg-[#0d0d12] border border-border/30 rounded-xl shadow-2xl p-3 min-w-[260px]">
                                            {/* Actions */}
                                            <div className="flex gap-1.5 mb-3">
                                                <button
                                                    className="flex-1 text-[9px] font-black uppercase tracking-wider py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
                                                    onClick={() => setActiveFilters(new Set(['RAID', 'EXTERNAL', 'PERSONAL', 'UTILITY']))}
                                                >
                                                    Todos
                                                </button>
                                                <button
                                                    className="flex-1 text-[9px] font-black uppercase tracking-wider py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
                                                    onClick={() => setActiveFilters(new Set())}
                                                >
                                                    Ninguno
                                                </button>
                                                <button
                                                    className="flex-1 text-[9px] font-black uppercase tracking-wider py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
                                                    onClick={() => setActiveFilters(new Set(['RAID', 'EXTERNAL']))}
                                                >
                                                    Default
                                                </button>
                                            </div>
                                            {/* Category toggles */}
                                            <div className="flex flex-col gap-1">
                                                {FILTER_CATEGORIES.map(cat => (
                                                    <button
                                                        key={cat.key}
                                                        className={cn(
                                                            "flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all text-left",
                                                            activeFilters.has(cat.key)
                                                                ? "border-white/20 bg-white/5"
                                                                : "border-transparent bg-transparent opacity-40 hover:opacity-70"
                                                        )}
                                                        onClick={() => toggleFilter(cat.key)}
                                                    >
                                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                                        <div className="flex flex-col leading-tight">
                                                            <span className="text-[10px] font-black text-white">{cat.label}</span>
                                                            <span className="text-[8px] text-white/40">{cat.description}</span>
                                                        </div>
                                                        {activeFilters.has(cat.key) ? (
                                                            <IconEye className="size-3.5 ml-auto text-white/50 shrink-0" />
                                                        ) : (
                                                            <IconEyeOff className="size-3.5 ml-auto text-white/20 shrink-0" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ======================= */}
                        {/* TIMELINE RENDERER       */}
                        {/* ======================= */}
                        <div
                            className="flex-1 min-h-0 overflow-x-auto overflow-y-auto select-none bg-gradient-to-b from-[#0a0a0f] to-[#050508] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative"
                            ref={setTimelineRef}
                            onMouseMove={handleTimelineMouseMove}
                            onMouseLeave={handleTimelineMouseLeave}
                            onMouseUp={handleTimelineMouseUp}
                        >
                            <div className="flex flex-col relative pb-10 h-full min-h-max" style={{ minWidth: `${1400 * timelineZoom}px` }}>
                                <div className="h-6 flex relative border-b border-border/10 sticky top-0 z-40 bg-[#0a0a0f] backdrop-blur-md">
                                    <div className="w-[150px] border-r border-border/20 shrink-0 sticky left-0 z-40 bg-[#0a0a0f]/90" />
                                    <div className="flex-1 relative" id="timeline-track-container">
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

                                {/* Full-Height Indicator Lines - behind abilities */}
                                <div className="absolute inset-0 pointer-events-none z-[5] overflow-visible" style={{ left: `${SIDEBAR_WIDTH}px`, width: `calc(100% - ${SIDEBAR_WIDTH}px)` }}>
                                    {/* Hover line - GPU accelerated via transform */}
                                    <div
                                        ref={hoverLineRef}
                                        className="absolute inset-y-0 w-px bg-white/20 pointer-events-none"
                                        style={{ display: 'none', left: 0, boxShadow: '0 0 10px rgba(255,255,255,0.2)' }}
                                    />

                                </div>

                                {/* Time badges - Removed legacy badges to favors floating tooltip */}
                                <div className="absolute inset-0 pointer-events-none z-50 overflow-visible" style={{ left: `${SIDEBAR_WIDTH}px`, width: `calc(100% - ${SIDEBAR_WIDTH}px)` }}>
                                    <div ref={hoverBadgeContainerRef} style={{ display: 'none' }} />
                                </div>

                                {/* Boss Abilities - one row per unique ability */}
                                {(() => {
                                    const bossAbilities = BOSS_TIMELINES[selectedBoss] || []
                                    // Group by ability name preserving order of first appearance
                                    const abilityGroups: { name: string; times: number[] }[] = []
                                    const seen = new Map<string, number>()
                                    bossAbilities.forEach(a => {
                                        const idx = seen.get(a.name)
                                        if (idx !== undefined) {
                                            abilityGroups[idx].times.push(a.time)
                                        } else {
                                            seen.set(a.name, abilityGroups.length)
                                            abilityGroups.push({ name: a.name, times: [a.time] })
                                        }
                                    })

                                    if (abilityGroups.length === 0) {
                                        return (
                                            <div className="h-20 border-b border-border/10 flex relative">
                                                <div className="w-[150px] border-r border-border/20 p-2 flex flex-col justify-center gap-2 shrink-0 bg-[#0d0d12] backdrop-blur-xl z-20 sticky left-0">
                                                    <div className="flex flex-col items-center">
                                                        <IconTrash className="size-4 text-red-500/50" />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div className="flex flex-col border-b border-red-500/20">
                                            <div className="flex">
                                                <div className="w-[150px] border-r border-border/20 shrink-0 bg-[#0d0d12] sticky left-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)]" style={{ borderLeftWidth: '3px', borderLeftColor: '#ef4444' }}>
                                                    <div className="flex flex-col bg-black/40">
                                                        {/* BOSS header row */}
                                                        <div className="h-[24px] flex items-center pl-2.5 border-b border-border/10 bg-black/20">
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-red-500">HABILIDADES BOSS</span>
                                                        </div>
                                                        {abilityGroups.map((group) => {
                                                            const meta = BOSS_ABILITY_META[group.name]
                                                            const displayName = meta?.nameEs || group.name;
                                                            return (
                                                                <div key={group.name} className="h-[28px] flex items-center justify-end gap-1.5 pl-2 pr-2 border-b border-border/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                                                    <span className="text-[9px] font-bold truncate text-right flex-1" style={{ color: meta?.color || '#f87171' }} title={displayName}>{displayName}</span>
                                                                    {meta?.icon && (
                                                                        <Image unoptimized src={meta.icon} alt={group.name} width={16} height={16} className="rounded-sm shadow-sm opacity-90 shrink-0" />
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                                <div className="flex-1 flex flex-col relative bg-grid-white/[0.01]">
                                                    {/* Vertical grid lines */}
                                                    <div className="absolute inset-0 pointer-events-none">
                                                        {[...Array(16)].map((_, i) => (
                                                            <div key={`grid-boss-${i}`} className="absolute inset-y-0 w-px bg-white/[0.02]" style={{ left: `${((TOTAL_FIGHT_SECONDS / 16) * i) / TOTAL_FIGHT_SECONDS * 100}%` }} />
                                                        ))}
                                                    </div>
                                                    {/* Header spacer */}
                                                    <div className="h-[24px] border-b border-border/10" />
                                                    {/* One track per ability */}
                                                    {abilityGroups.map((group) => {
                                                        const meta = BOSS_ABILITY_META[group.name]
                                                        const abilityColor = meta?.color || '#ef4444'
                                                        return (
                                                            <div key={group.name} className="h-[28px] relative border-b border-border/5 last:border-0">
                                                                {group.times.map((t, ti) => (
                                                                    <div
                                                                        key={`boss-${group.name}-${ti}`}
                                                                        className="absolute top-0.5 bottom-0.5 rounded flex items-center gap-1 px-1 text-[8px] font-bold shadow-sm overflow-visible transition-colors cursor-default z-10 group/boss"
                                                                        style={{
                                                                            left: `${(t / TOTAL_FIGHT_SECONDS) * 100}%`,
                                                                            backgroundColor: `${abilityColor}15`,
                                                                            borderWidth: '1px',
                                                                            borderColor: `${abilityColor}40`,
                                                                            borderLeftWidth: '2px',
                                                                            borderLeftColor: abilityColor,
                                                                            color: abilityColor,
                                                                            width: '52px',
                                                                        }}
                                                                    >
                                                                        {meta?.icon && (
                                                                            <Image unoptimized src={meta.icon} alt="" width={14} height={14} className="rounded-sm opacity-80 shrink-0" />
                                                                        )}
                                                                        <span className="truncate">{formatTime(t)}</span>
                                                                        {/* Hover preview */}
                                                                        <div className="absolute bottom-full left-0 mb-1 hidden group-hover/boss:flex items-center gap-2 bg-black/95 border border-border/30 rounded-lg px-2.5 py-1.5 shadow-xl z-50 whitespace-nowrap pointer-events-none">
                                                                            {meta?.icon && (
                                                                                <img src={meta.icon} alt="" width={24} height={24} className="rounded shadow-sm shrink-0" />
                                                                            )}

                                                                            <div className="flex flex-col leading-tight">
                                                                                <span className="text-[10px] font-black" style={{ color: abilityColor }}>{meta?.nameEs || group.name}</span>
                                                                                <span className="text-[9px] text-white/60">{formatTime(t)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()}

                                <div className="flex-1 flex flex-col border-t border-border/10">
                                    {healers.length === 0 ? (
                                        <div className="h-40 flex items-center justify-center text-muted-foreground text-sm uppercase tracking-widest font-black opacity-50">
                                            No hay healers seleccionados en el roster
                                        </div>
                                    ) : condensedView ? (
                                        /* ===== CONDENSED VIEW ===== */
                                        healers.map((h: any, hIndex: number) => {
                                            const hCooldowns = cooldownDefinitions.filter((c: CooldownDefinition) => {
                                                if (!activeFilters.has(c.ability_type)) return false;
                                                if (c.class_id !== h.class_id) return false;

                                                // Determine allowed specs based on the character's assigned event_role
                                                const roleSpecs = getRoleSpecs(h.class_id, h.role);

                                                // If the cooldown is role/spec restricted
                                                if (c.allowed_specs && c.allowed_specs.length > 0) {
                                                    // If we know their role specs, ensure the cooldown fits their role
                                                    if (roleSpecs) {
                                                        const isAllowedForRole = c.allowed_specs.some(specId => roleSpecs.includes(specId));
                                                        if (!isAllowedForRole) return false;
                                                    } else {
                                                        // Fallback to strict spec_id checking if role isn't mapped
                                                        if (h.spec_id > 0 && !c.allowed_specs.includes(h.spec_id)) return false;
                                                    }
                                                }

                                                return true;
                                            })

                                            if (hCooldowns.length === 0) return null;
                                            const classColor = hCooldowns[0]?.color || '#ffffff'
                                            const allAssignments = assignments.filter((a: any) => a.member_id === h.id)

                                            return (
                                                <div key={hIndex} className="flex border-b border-border/10 h-[28px]">
                                                    {/* Sidebar: name + icons */}
                                                    <div className="w-[150px] border-r border-border/20 shrink-0 bg-[#0d0d12] sticky left-0 z-30 flex items-center justify-center p-1 shadow-[4px_0_24px_rgba(0,0,0,0.5)]" style={{ borderLeftWidth: '3px', borderLeftColor: classColor }}>
                                                        <div className="flex items-center gap-1 overflow-hidden shrink-0">
                                                            {h.role === 'tank' && <IconShield className="size-3.5 opacity-60 shrink-0" />}
                                                            {h.role === 'heal' && <IconPlus className="size-3.5 text-emerald-400 opacity-80 shrink-0" />}
                                                            {h.role === 'melee' && <IconSword className="size-3.5 opacity-60 shrink-0" />}
                                                            {(h.role === 'ranged' || !h.role) && <IconBow className="size-3.5 opacity-60 shrink-0" />}
                                                            <span className="text-[9px] font-black uppercase tracking-wider truncate" style={{ color: classColor }}>{h.character_name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-0.5 ml-auto shrink-0">
                                                            {hCooldowns.map((cd: CooldownDefinition) => (
                                                                <Image key={cd.id} unoptimized src={cd.icon} alt={cd.name} width={14} height={14} className="rounded-sm opacity-80" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {/* Single condensed track */}
                                                    <div
                                                        className={cn(
                                                            "flex-1 relative border-b border-border/5 bg-grid-white/[0.01]",
                                                            draggingAssignment ? "pointer-events-none" : ""
                                                        )}
                                                    >
                                                        {/* Grid lines */}
                                                        <div className="absolute inset-0 pointer-events-none z-0">
                                                            {[...Array(16)].map((_, i) => (
                                                                <div key={`grid-c-${i}`} className="absolute inset-y-0 w-px bg-white/[0.02]" style={{ left: `${((TOTAL_FIGHT_SECONDS / 16) * i) / TOTAL_FIGHT_SECONDS * 100}%` }} />
                                                            ))}
                                                        </div>
                                                        {/* All assignments on one row */}
                                                        {allAssignments.map((assign: any) => {
                                                            const cd = hCooldowns.find((c: any) => c.id === assign.cooldown_id)
                                                            if (!cd) return null

                                                            const myStart = Number(assign.time_seconds);
                                                            const dur = Number(cd.duration || 0);
                                                            const actDurSec = Number(cd.active_duration || 0);
                                                            const myEnd = myStart + dur;

                                                            // Overlap check
                                                            const isConflict = allAssignments.some((a: any) => {
                                                                if (a.id === assign.id) return false;
                                                                if (a.cooldown_id !== assign.cooldown_id) return false;
                                                                const otherStart = Number(a.time_seconds);
                                                                const otherEnd = otherStart + dur;
                                                                // Exclusive check: if they touch exactly, they don't fail.
                                                                return Math.max(otherStart, myStart) < Math.min(otherEnd, myEnd);
                                                            });

                                                            const actPct = actDurSec > 0 ? (actDurSec / TOTAL_FIGHT_SECONDS) * 100 : 0;
                                                            const cdPct = dur > 0 ? (dur / TOTAL_FIGHT_SECONDS) * 100 : 0;

                                                            return (
                                                                <React.Fragment key={assign.id}>
                                                                    {/* Active Duration Overlay */}
                                                                    {actDurSec > 0 && (
                                                                        <div
                                                                            className="absolute top-0.5 bottom-0.5 pointer-events-none z-10"
                                                                            style={{
                                                                                left: `${(myStart / TOTAL_FIGHT_SECONDS) * 100}%`,
                                                                                width: `${actPct}%`,
                                                                                backgroundColor: `transparent`,
                                                                                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px)`,
                                                                                borderTop: `1px solid ${cd.color}90`,
                                                                                borderBottom: `1px solid ${cd.color}90`,
                                                                                borderRight: `1px solid ${cd.color}90`,
                                                                            }}
                                                                        />
                                                                    )}

                                                                    {/* Cooldown Range (Right Tail) */}
                                                                    {dur > 0 && (
                                                                        <div
                                                                            className="absolute top-0.5 bottom-0.5 rounded-r pointer-events-none z-0"
                                                                            style={{
                                                                                left: `${(myStart / TOTAL_FIGHT_SECONDS) * 100}%`,
                                                                                width: `${(dur / TOTAL_FIGHT_SECONDS) * 100}%`,
                                                                                backgroundColor: isConflict ? 'rgba(239, 68, 68, 0.4)' : `${cd.color}60`,
                                                                                borderColor: isConflict ? '#ef4444' : `${cd.color}90`,
                                                                                borderStyle: 'solid',
                                                                                borderWidth: '1px',
                                                                                borderLeftWidth: '0px'
                                                                            }}
                                                                        />
                                                                    )}

                                                                    {/* Ghost Cooldown Range (Left Tail) */}
                                                                    {dur > 0 && (
                                                                        <div
                                                                            className="absolute top-0.5 bottom-0.5 rounded-l pointer-events-none z-0 border-y border-l"
                                                                            style={{
                                                                                left: `${(myStart / TOTAL_FIGHT_SECONDS) * 100}%`,
                                                                                transform: `translateX(-100%)`,
                                                                                width: `${(dur / TOTAL_FIGHT_SECONDS) * 100}%`,
                                                                                backgroundColor: `${cd.color}15`,
                                                                                borderColor: isConflict ? '#ef4444' : `${cd.color}60`,
                                                                                borderStyle: 'dashed',
                                                                            }}
                                                                        />
                                                                    )}

                                                                    <div
                                                                        className={cn(
                                                                            "absolute top-0.5 bottom-0.5 flex items-center justify-center overflow-visible z-20 group/assign shadow-sm transition-all -translate-x-1/2 rounded",
                                                                            draggingAssignment?.id === assign.id ? "opacity-50 cursor-grabbing scale-95" : "hover:brightness-125 cursor-grab active:cursor-grabbing",
                                                                            isConflict && "bg-red-500/30 border-red-500/50 ring-1 ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)] z-30"
                                                                        )}
                                                                        style={{
                                                                            left: `${(myStart / TOTAL_FIGHT_SECONDS) * 100}%`,
                                                                            width: '26px',
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onContextMenu={(e) => handleDeleteAssignment(assign.id, e)}
                                                                        onMouseDown={(e) => handleAssignmentMouseDown(e, assign)}
                                                                        onDragStart={(e) => e.preventDefault()}
                                                                    >
                                                                        <img src={cd.icon} alt="" width={24} height={24} className="rounded-sm opacity-90 shrink-0 pointer-events-none" />

                                                                        {/* Hover preview */}
                                                                        <div className="absolute bottom-full left-0 mb-1 hidden group-hover/assign:flex items-center gap-2 bg-black/95 border border-border/30 rounded-lg px-2.5 py-1.5 shadow-xl z-50 whitespace-nowrap pointer-events-none">
                                                                            <img src={cd.icon} alt="" width={24} height={24} className="rounded shadow-sm shrink-0" />

                                                                            <div className="flex flex-col leading-tight">
                                                                                <span className="text-[10px] font-black" style={{ color: cd.color }}>{cd.name}</span>
                                                                                <span className="text-[9px] text-white/60">{h.character_name} · {formatTime(assign.time_seconds)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </React.Fragment>
                                                            )
                                                        })}

                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        /* ===== EXPANDED VIEW ===== */
                                        healers.map((h: any, hIndex: number) => {
                                            const hCooldowns = cooldownDefinitions.filter((c: CooldownDefinition) => {
                                                if (!activeFilters.has(c.ability_type)) return false;
                                                if (c.class_id !== h.class_id) return false;

                                                // Determine allowed specs based on the character's assigned event_role
                                                const roleSpecs = getRoleSpecs(h.class_id, h.role);

                                                // If the cooldown is role/spec restricted
                                                if (c.allowed_specs && c.allowed_specs.length > 0) {
                                                    // If we know their role specs, ensure the cooldown fits their role
                                                    if (roleSpecs) {
                                                        const isAllowedForRole = c.allowed_specs.some(specId => roleSpecs.includes(specId));
                                                        if (!isAllowedForRole) return false;
                                                    } else {
                                                        // Fallback to strict spec_id checking if role isn't mapped
                                                        if (h.spec_id > 0 && !c.allowed_specs.includes(h.spec_id)) return false;
                                                    }
                                                }

                                                return true;
                                            })

                                            if (hCooldowns.length === 0) return null;

                                            const classColor = hCooldowns[0]?.color || '#ffffff'

                                            return (
                                                <div key={hIndex} className="flex flex-col border-b border-border/20">
                                                    <div className="flex">
                                                        <div className="w-[150px] border-r border-border/20 shrink-0 bg-[#0d0d12] sticky left-0 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.5)]" style={{ borderLeftWidth: '3px', borderLeftColor: classColor }}>
                                                            {/* Cooldown list */}
                                                            <div className="flex flex-col bg-black/40">
                                                                {/* Name header row */}
                                                                <div className="h-[24px] flex items-center gap-1.5 pl-2 border-b border-border/10 bg-black/20">
                                                                    {h.role === 'tank' && <IconShield className="size-3.5 opacity-60 shrink-0" />}
                                                                    {h.role === 'heal' && <IconPlus className="size-3.5 text-emerald-400 opacity-80 shrink-0" />}
                                                                    {h.role === 'melee' && <IconSword className="size-3.5 opacity-60 shrink-0" />}
                                                                    {(h.role === 'ranged' || !h.role) && <IconBow className="size-3.5 opacity-60 shrink-0" />}
                                                                    <span className="text-[10px] font-black uppercase tracking-wider truncate pr-1" style={{ color: classColor }}>{h.character_name}</span>
                                                                </div>
                                                                {hCooldowns.map((cd: CooldownDefinition) => (
                                                                    <div key={cd.id} className="h-[28px] flex items-center justify-end gap-1.5 pl-2 pr-2 border-b border-border/5 last:border-0 hover:bg-white/[0.02] transition-colors" title={cd.name}>
                                                                        <span className="text-[9px] font-bold truncate text-right flex-1 text-white/80">{cd.name}</span>
                                                                        <Image unoptimized src={cd.icon} alt={cd.name} width={16} height={16} className="rounded-sm shadow-sm opacity-90 shrink-0" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>


                                                        <div className="flex-1 flex flex-col relative bg-grid-white/[0.01]">
                                                            {/* Vertical grid lines */}
                                                            <div className="absolute inset-0 pointer-events-none z-0">
                                                                {[...Array(16)].map((_, i) => (
                                                                    <div key={`grid-${i}`} className="absolute inset-y-0 w-px bg-white/[0.02]" style={{ left: `${((TOTAL_FIGHT_SECONDS / 16) * i) / TOTAL_FIGHT_SECONDS * 100}%` }} />
                                                                ))}
                                                            </div>

                                                            {/* Name header spacer */}
                                                            <div className="h-[24px] border-b border-border/10" />

                                                            {/* One track per cooldown */}
                                                            {hCooldowns.map((cd: any) => {
                                                                const rowAssignments = assignments.filter((a: any) => a.member_id === h.id && a.cooldown_id === cd.id)

                                                                return (
                                                                    <div
                                                                        key={`track-${cd.id}`}
                                                                        className={cn(
                                                                            "h-[28px] relative cursor-crosshair transition-colors group/track border-b border-border/5 last:border-0",
                                                                            draggingAssignment ? "pointer-events-none" : "hover:bg-white/[0.03]"
                                                                        )}
                                                                        onMouseMove={(e) => {
                                                                            const rect = e.currentTarget.getBoundingClientRect()
                                                                            const x = e.clientX - rect.left
                                                                            const pct = Math.max(0, Math.min(1, x / rect.width))
                                                                            e.currentTarget.style.setProperty('--preview-left', `${pct * 100}%`)
                                                                            const previewTime = Math.round(pct * TOTAL_FIGHT_SECONDS)

                                                                            setFloatingTooltip({
                                                                                visible: true,
                                                                                x: e.clientX,
                                                                                y: e.clientY,
                                                                                time: previewTime
                                                                            });

                                                                            const previewEl = e.currentTarget.querySelector('[data-preview-time]') as HTMLElement
                                                                            if (previewEl) {
                                                                                previewEl.textContent = formatTime(previewTime)
                                                                            }
                                                                        }}
                                                                        onMouseLeave={() => setFloatingTooltip(prev => ({ ...prev, visible: false }))}

                                                                        onMouseUp={(e) => {
                                                                            if (e.button !== 0) return; // Only allow left-click for creation
                                                                            if (isLoading || wasDragging || draggingAssignment) return;
                                                                            const rect = e.currentTarget.getBoundingClientRect()
                                                                            const clickX = e.clientX - rect.left
                                                                            const percentage = Math.max(0, clickX / rect.width)
                                                                            const timeClicked = Math.round(percentage * TOTAL_FIGHT_SECONDS)
                                                                            handleAssignCooldown(h.id, cd.id, timeClicked)
                                                                        }}
                                                                    >
                                                                        {/* Ghost preview on hover */}
                                                                        <div
                                                                            className="absolute top-0.5 bottom-0.5 rounded flex items-center gap-1 px-1 opacity-0 group-hover/track:opacity-40 transition-opacity pointer-events-none z-[1]"
                                                                            style={{
                                                                                left: 'var(--preview-left, 0%)',
                                                                                transform: 'translateX(-50%)',
                                                                                backgroundColor: `${cd.color}25`,
                                                                                borderWidth: '1px',
                                                                                borderColor: `${cd.color}50`,
                                                                                borderLeftWidth: '2px',
                                                                                borderLeftColor: cd.color,
                                                                                width: cd.active_duration && cd.active_duration > 0
                                                                                    ? `calc(max(60px, ${(cd.active_duration / TOTAL_FIGHT_SECONDS) * 100}%))`
                                                                                    : '60px',
                                                                            }}
                                                                        >
                                                                            <Image unoptimized src={cd.icon} alt="" width={16} height={16} className="rounded-sm opacity-60 shrink-0" />
                                                                            <span data-preview-time className="text-[8px] font-bold" style={{ color: cd.color }}>0:00</span>
                                                                        </div>
                                                                        {rowAssignments.map((assign: any) => {
                                                                            const actDurSec = cd.active_duration && cd.active_duration > 0 ? cd.active_duration : 0;
                                                                            // Minimum width for clickability if active duration is 0
                                                                            const minWidthPx = actDurSec > 0 ? 0 : 60;
                                                                            const actPct = actDurSec > 0 ? (actDurSec / TOTAL_FIGHT_SECONDS) * 100 : 0;
                                                                            const cdPct = cd.duration ? (cd.duration / TOTAL_FIGHT_SECONDS) * 100 : 0;

                                                                            // Robust detection logic: An assignment A is in error if there is a conflict in their cooldown periods.
                                                                            const myStart = Number(assign.time_seconds);
                                                                            const dur = Number(cd.duration || 0);
                                                                            const myEnd = myStart + dur;

                                                                            const isConflict = rowAssignments.some((a: any) => {
                                                                                if (a.id === assign.id) return false;
                                                                                const otherStart = Number(a.time_seconds);
                                                                                const otherEnd = otherStart + dur;
                                                                                // Exclusive check: if they touch exactly, they don't fail.
                                                                                return Math.max(otherStart, myStart) < Math.min(otherEnd, myEnd);
                                                                            });

                                                                            return (
                                                                                <React.Fragment key={assign.id}>
                                                                                    {/* Active Duration Overlay */}
                                                                                    {actDurSec > 0 && (
                                                                                        <div
                                                                                            className="absolute top-0.5 bottom-0.5 pointer-events-none z-10"
                                                                                            style={{
                                                                                                left: `${(myStart / TOTAL_FIGHT_SECONDS) * 100}%`,
                                                                                                width: `${actPct}%`,
                                                                                                backgroundColor: `transparent`,
                                                                                                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px)`,
                                                                                                borderTop: `1px solid ${cd.color}90`,
                                                                                                borderBottom: `1px solid ${cd.color}90`,
                                                                                                borderRight: `1px solid ${cd.color}90`,
                                                                                            }}
                                                                                        />
                                                                                    )}

                                                                                    {/* Cooldown Tail (Right) */}
                                                                                    {dur > 0 && (
                                                                                        <div
                                                                                            className="absolute top-0.5 bottom-0.5 pointer-events-none transition-colors border-y border-r rounded-r z-0"
                                                                                            style={{
                                                                                                left: `${(myStart / TOTAL_FIGHT_SECONDS) * 100}%`,
                                                                                                width: `${(dur / TOTAL_FIGHT_SECONDS) * 100}%`,
                                                                                                backgroundColor: isConflict ? 'rgba(239, 68, 68, 0.4)' : `${cd.color}60`,
                                                                                                borderColor: isConflict ? '#ef4444' : `${cd.color}90`,
                                                                                                borderWidth: '1px',
                                                                                                borderLeftWidth: '0px',
                                                                                                borderStyle: 'solid'
                                                                                            }}
                                                                                        />
                                                                                    )}

                                                                                    {/* Ghost Cooldown Tail (Left Tail) */}
                                                                                    {dur > 0 && (
                                                                                        <div
                                                                                            className="absolute top-0.5 bottom-0.5 rounded-l pointer-events-none z-0 border-y border-l"
                                                                                            style={{
                                                                                                left: `${(myStart / TOTAL_FIGHT_SECONDS) * 100}%`,
                                                                                                transform: `translateX(-100%)`,
                                                                                                width: `${(dur / TOTAL_FIGHT_SECONDS) * 100}%`,
                                                                                                backgroundColor: `${cd.color}15`,
                                                                                                borderColor: isConflict ? '#ef4444' : `${cd.color}60`,
                                                                                                borderStyle: 'dashed',
                                                                                            }}
                                                                                        />
                                                                                    )}

                                                                                    <div
                                                                                        className={cn(
                                                                                            "absolute top-0.5 bottom-0.5 flex items-center shadow-sm overflow-visible transition-all z-20 group/assign rounded -translate-x-1/2",
                                                                                            draggingAssignment?.id === assign.id ? "opacity-50 cursor-grabbing scale-95 ring-2 ring-white/20" : "hover:brightness-125 cursor-grab active:cursor-grabbing",
                                                                                            isConflict && "bg-red-500/30 border border-red-500/50 ring-1 ring-red-400/40 shadow-[0_0_15px_rgba(239,68,68,0.3)] z-30"
                                                                                        )}
                                                                                        style={{
                                                                                            left: `${(myStart / TOTAL_FIGHT_SECONDS) * 100}%`,
                                                                                            width: '58px',
                                                                                            borderLeftColor: cd.color
                                                                                        }}
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        onContextMenu={(e) => handleDeleteAssignment(assign.id, e)}
                                                                                        onMouseDown={(e) => handleAssignmentMouseDown(e, assign)}
                                                                                        onDragStart={(e) => e.preventDefault()}
                                                                                    >
                                                                                        <div className="flex w-full h-full items-center justify-center p-0.5">
                                                                                            <img src={cd.icon} alt="" width={22} height={22} className="rounded-sm opacity-90 shrink-0 pointer-events-none" />
                                                                                        </div>

                                                                                        {/* Hover preview */}
                                                                                        <div className="absolute bottom-full left-0 mb-1 hidden group-hover/assign:flex items-center gap-2 bg-black/95 border border-border/30 rounded-lg px-2.5 py-1.5 shadow-xl z-50 whitespace-nowrap pointer-events-none">
                                                                                            <img src={cd.icon} alt="" width={24} height={24} className="rounded shadow-sm shrink-0" />

                                                                                            <div className="flex flex-col leading-tight">
                                                                                                <span className="text-[10px] font-black" style={{ color: cd.color }}>{cd.name}</span>
                                                                                                <span className="text-[9px] text-white/60">{h.character_name} · {formatTime(assign.time_seconds)}</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </React.Fragment>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
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

                {/* Floating Time Tooltip */}
                {floatingTooltip.visible && (
                    <div
                        className="fixed z-[9999] pointer-events-none bg-black/95 border border-amber-500/50 rounded-md px-2.5 py-1 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md transition-transform duration-75 flex items-center justify-center min-w-[50px]"
                        style={{
                            left: `${floatingTooltip.x + 15}px`,
                            top: `${floatingTooltip.y - 15}px`,
                            transform: 'translate(0, -50%)'
                        }}
                    >
                        <span className="text-sm font-black text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)] tabular-nums">
                            {formatTime(floatingTooltip.time)}
                        </span>
                    </div>
                )}

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

            <Dialog open={!!editingAssignment} onOpenChange={(open) => !open && setEditingAssignment(null)}>
                <DialogContent className="sm:max-w-[425px] bg-[#0c0c12] border-border/20 text-white shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="text-amber-500"><IconClock className="size-5" /></span>
                            Editar Tiempo Manual
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="time" className="text-right text-xs uppercase tracking-widest font-bold text-white/60">
                                Tiempo
                            </Label>
                            <Input
                                id="time"
                                value={editInputValue}
                                onChange={(e) => setEditInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateAssignmentTime()
                                }}
                                className="col-span-3 bg-black/40 border-border/20"
                                placeholder="E.g. 1:23 o 83"
                                autoFocus
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground text-center italic">
                            Puedes usar formato MM:SS o segundos totales.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" className="text-xs uppercase tracking-widest font-bold" onClick={() => setEditingAssignment(null)}>
                            Cancelar
                        </Button>
                        <Button className="bg-amber-600 hover:bg-amber-500 text-xs uppercase tracking-widest font-bold" onClick={handleUpdateAssignmentTime}>
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >

    )
}
