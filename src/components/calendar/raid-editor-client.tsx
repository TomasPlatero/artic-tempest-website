"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
    IconCalendar,
    IconClock,
    IconUsers,
    IconCheck,
    IconDeviceFloppy,
    IconArrowLeft,
    IconTrash,
    IconUserOff,
    IconTimeline,
    IconClipboardText
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"
import { RankBadge } from "@/components/common/roster-table"

// DND Kit
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
    pointerWithin,
    useDroppable,
} from "@dnd-kit/core"

interface Member {
    id: string
    character_name: string
    class_id: number
    rank: number
    role?: string
}

interface Signup {
    member_id: string
    selection_status: 'selected' | 'queued'
    event_role: string
    signup_order: number
    guild_members: Member
    is_absent?: boolean
    is_late?: boolean
}

const formatToDateTimeLocal = (dateInput: string | Date) => {
    const date = new Date(dateInput)
    if (isNaN(date.getTime())) return ""

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function RaidEditorClient({
    initialRaid,
    initialSignups,
    plannableMembers,
    preselectedDate,
    currentMemberId,
    isReadOnly = false,
    rankColors,
    classRoles = {},
    raids = [],
    buffs = []
}: {
    initialRaid: any
    initialSignups: any[]
    plannableMembers: Member[]
    preselectedDate?: string
    currentMemberId?: string
    isReadOnly?: boolean
    rankColors?: (string | null)[]
    classRoles?: Record<number, string>
    raids?: any[]
    buffs?: any[]
}) {
    console.log("RaidEditorClient - Props received:", {
        raidsCount: raids.length,
        buffsCount: buffs.length,
        initialRaidDest: initialRaid?.destination
    })
    const router = useRouter()
    const [raid, setRaid] = useState(initialRaid ? {
        ...initialRaid,
        event_date: formatToDateTimeLocal(initialRaid.event_date),
        selected_bosses: initialRaid.selected_bosses || []
    } : {
        destination: raids[0]?.id || "",
        event_date: preselectedDate ? `${preselectedDate}T20:00` : formatToDateTimeLocal(new Date()),
        difficulty: "Mítico (20)",
        status: "planned",
        selected_bosses: []
    })

    // Signups state: we localy manage the list of members and their status
    // We merge plannableMembers with initialSignups
    const [signups, setSignups] = useState<Signup[]>(() => {
        const merged: Signup[] = []

        // Add existing signups
        initialSignups.forEach(s => {
            // Ensure event_role is set (fallback to class role if missing)
            const role = s.event_role || (s.guild_members?.role || classRoles[s.guild_members?.class_id] || 'ranged').toLowerCase()
            merged.push({
                ...s,
                event_role: role,
                is_absent: s.status === 'absent',
                is_late: s.status === 'late'
            })
        })

        // Add plannable members who aren't signed up yet as 'queued'
        plannableMembers.forEach(m => {
            if (!merged.find(s => s.member_id === m.id)) {
                // Determine initial role: strictly from roster member (m.role)
                const initialRole = (m.role || classRoles[m.class_id] || 'ranged').toLowerCase()

                merged.push({
                    member_id: m.id,
                    selection_status: 'queued',
                    event_role: initialRole,
                    signup_order: merged.length,
                    guild_members: m
                })
            }
        })
        return merged
    })

    const [hasMounted, setHasMounted] = useState(false)
    useEffect(() => {
        setHasMounted(true)
    }, [])

    const initialDuration = initialRaid?.end_date && initialRaid?.event_date
        ? Math.max(1, (new Date(initialRaid.end_date).getTime() - new Date(initialRaid.event_date).getTime()) / 3600000)
        : 2
    const [duration, setDuration] = useState(initialDuration.toString())

    const isPast = useMemo(() => {
        if (!raid.event_date) return false
        // Calculate based on current input and duration to provide real-time feedback
        const startDate = new Date(raid.event_date)
        const eventEnd = new Date(startDate.getTime() + parseFloat(duration) * 3600000)
        return eventEnd < new Date()
    }, [raid.event_date, duration])

    const [isSaving, setIsSaving] = useState(false)

    // Personal presence state (for raiders/viewers)
    const [presence, setPresence] = useState(() => {
        const mySignup = initialSignups.find(s => s.member_id === currentMemberId)
        return mySignup?.status || "present"
    })
    const [comment, setComment] = useState(() => {
        const mySignup = initialSignups.find(s => s.member_id === currentMemberId)
        return mySignup?.comment || ""
    })

    const handleSavePresence = async () => {
        setIsSaving(true)
        try {
            const res = await fetch("/api/guild/events/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_id: raid.id,
                    status: presence,
                    comment: comment,
                    role_preference: "dps" // Fallback
                })
            })

            if (!res.ok) throw new Error("Failed to save")
            toast.success("Inscripción guardada", { description: "Tu estado para esta raid ha sido actualizado." })
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Error", { description: "No se pudo guardar tu inscripción." })
        } finally {
            setIsSaving(false)
        }
    }


    useEffect(() => {
        // Initialization/logging if needed
    }, [])

    // Custom collision detection strategy
    const customCollisionDetection = (args: any) => {
        const pointerCollisions = pointerWithin(args)
        if (pointerCollisions.length > 0) {
            return pointerCollisions
        }
        return closestCenter(args)
    }

    // DND Handlers
    const [activeId, setActiveId] = useState<string | null>(null)

    // Helper to find which container a member belongs to
    const findContainer = (id: string) => {
        if (id === 'active-container' || id === 'queue-container') return id
        const signup = signups.find(s => s.member_id === id)
        if (signup) {
            return signup.selection_status === 'selected' ? 'active-container' : 'queue-container'
        }
        return null
    }

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const canDrag = !isReadOnly


    const handleDragStart = (event: any) => {
        setActiveId(event.active.id)
    }

    const handleDragOver = (event: any) => {
        // We do not mutate cross-container state here anymore, as the group-by-role
        // layout in the active roster causes massive DOM jumps if an item transitions mid-drag.
        // Reordering within the same container could be done here, but since order
        // isn't strictly maintained (due to role-grouping), we'll do everything in DragEnd.
    }

    const handleDragEnd = (event: any) => {
        if (!canDrag) return
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const activeContainer = findContainer(active.id)
        const overContainer = findContainer(over.id)

        if (!activeContainer || !overContainer) return

        if (activeContainer !== overContainer) {
            // Cross-container move
            setSignups((prev) => {
                const activeIndex = prev.findIndex((s) => s.member_id === active.id)
                if (activeIndex === -1) return prev

                const draggedMember = prev[activeIndex]
                const newStatus = overContainer === 'active-container' ? 'selected' : 'queued'

                if (newStatus === 'selected') {
                    const diffGroups = (raid.difficulty || "").match(/\((\d+)\)/)
                    const maxActive = diffGroups ? parseInt(diffGroups[1], 10) : 30
                    const currentActiveCount = prev.filter(s => s.selection_status === 'selected').length
                    if (currentActiveCount >= maxActive) return prev
                }

                const newSignups = [...prev]
                newSignups[activeIndex] = { ...draggedMember, selection_status: newStatus }
                return newSignups
            })
        } else if (active.id !== over.id) {
            // Same container reorder
            setSignups((items) => {
                const oldIndex = items.findIndex((i) => i.member_id === active.id)
                const newIndex = items.findIndex((i) => i.member_id === over.id)
                if (newIndex !== -1 && oldIndex !== -1) {
                    return arrayMove(items, oldIndex, newIndex)
                }
                return items
            })
        }
    }

    const toggleStatus = (memberId: string) => {
        const diffGroups = (raid.difficulty || "").match(/\((\d+)\)/)
        const maxActive = diffGroups ? parseInt(diffGroups[1], 10) : 30

        setSignups(prev => {
            const signup = prev.find(s => s.member_id === memberId)
            if (!signup) return prev

            if (signup.selection_status !== 'selected') {
                const currentActiveCount = prev.filter(s => s.selection_status === 'selected').length
                if (currentActiveCount >= maxActive) return prev
                return prev.map(s => s.member_id === memberId ? { ...s, selection_status: 'selected' } : s)
            } else {
                return prev.map(s => s.member_id === memberId ? { ...s, selection_status: 'queued' } : s)
            }
        })
    }

    const changeRole = (memberId: string, newRole?: string) => {
        const ROLES = ['tank', 'heal', 'melee', 'ranged']
        setSignups(prev => prev.map(s => {
            if (s.member_id === memberId) {
                const currentIndex = ROLES.indexOf(s.event_role)
                const role = newRole || ROLES[(currentIndex + 1) % ROLES.length]
                return { ...s, event_role: role }
            }
            return s
        }))
    }

    const toggleAbsent = (memberId: string) => {
        setSignups(prev => prev.map(s => {
            if (s.member_id === memberId) {
                return { ...s, is_absent: !s.is_absent, is_late: false }
            }
            return s
        }))
    }

    const toggleLate = (memberId: string) => {
        setSignups(prev => prev.map(s => {
            if (s.member_id === memberId) {
                return { ...s, is_late: !s.is_late, is_absent: false }
            }
            return s
        }))
    }

    const resetStatus = (memberId: string) => {
        setSignups(prev => prev.map(s => {
            if (s.member_id === memberId) {
                return { ...s, is_absent: false, is_late: false }
            }
            return s
        }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const startDate = new Date(raid.event_date)
            const endDate = new Date(startDate.getTime() + parseFloat(duration) * 60 * 60 * 1000)

            const payload = {
                ...raid,
                event_date: startDate.toISOString(), // Standardize to UTC ISO
                end_date: endDate.toISOString(),
                selected_bosses: raid.selected_bosses || []
            }

            // 1. Create/Update Raid
            const raidRes = await fetch(initialRaid ? `/api/guild/events/${initialRaid.id}` : "/api/guild/events", {
                method: initialRaid ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            if (!raidRes.ok) throw new Error("Error al guardar la raid")
            const raidData = await raidRes.json()
            const finalRaidId = initialRaid?.id || raidData.event.id

            // 2. Save Roster (Signups)
            const signupRes = await fetch(`/api/guild/events/${finalRaidId}/roster`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    selections: signups.map((s, idx) => ({
                        member_id: s.member_id,
                        selection_status: s.selection_status,
                        event_role: s.event_role,
                        signup_order: idx,
                        is_absent: s.is_absent,
                        is_late: s.is_late
                    }))
                })
            })
            if (!signupRes.ok) throw new Error("Error al guardar el roster")

            toast.success("Evento guardados con éxito")
            router.push("/dashboard/calendario")
            router.refresh()
        } catch (error: any) {
            toast.error("Error", { description: error.message })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!initialRaid?.id) return
        if (!window.confirm("¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.")) return

        setIsSaving(true)
        try {
            const res = await fetch(`/api/guild/events/${initialRaid.id}`, {
                method: "DELETE"
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Error al eliminar el evento")

            toast.success("Evento eliminado correctamente")
            router.push("/dashboard/calendario")
            router.refresh()
        } catch (error: any) {
            toast.error("Error", { description: error.message })
            setIsSaving(false)
        }
    }

    const activeMembers = signups.filter(s => s.selection_status === 'selected')
    const reserveMembers = signups.filter(s => s.selection_status === 'queued')

    const activeByRole = useMemo(() => {
        return {
            tanks: activeMembers.filter(s => s.event_role === 'tank'),
            heals: activeMembers.filter(s => s.event_role === 'heal'),
            melee: activeMembers.filter(s => s.event_role === 'melee'),
            ranged: activeMembers.filter(s => s.event_role === 'ranged'),
        }
    }, [activeMembers])

    const reserveByRole = useMemo(() => {
        return {
            tanks: reserveMembers.filter(s => s.event_role === 'tank'),
            heals: reserveMembers.filter(s => s.event_role === 'heal'),
            melee: reserveMembers.filter(s => s.event_role === 'melee'),
            ranged: reserveMembers.filter(s => s.event_role === 'ranged'),
        }
    }, [reserveMembers])

    const activeClassIds = useMemo(() => new Set(activeMembers.map(s => s.guild_members.class_id)), [activeMembers])

    const [localRaids, setLocalRaids] = useState(raids)
    const [localBuffs, setLocalBuffs] = useState(buffs)

    useEffect(() => {
        if (localRaids.length === 0 || localBuffs.length === 0) {
            fetch("/api/guild/constants")
                .then(res => res.json())
                .then(data => {
                    const r: any[] = []
                    const b: any[] = [
                        { category: "Buffs / Debuffs", items: [] },
                        { category: "Utilidad", items: [] }
                    ]

                    if (data.wow_raid) {
                        Object.entries(data.wow_raid).forEach(([key, val]: [string, any]) => {
                            r.push({ id: key, name: val.value, background: val.metadata?.background, bosses: val.metadata?.bosses || [] })
                        })
                        setLocalRaids(r)
                    }
                    if (data.wow_buff) {
                        Object.entries(data.wow_buff).forEach(([key, val]: [string, any]) => {
                            const item = { id: key, name: val.value, classId: val.metadata?.classId }
                            if (val.metadata?.type === 'buff') b[0].items.push(item)
                            else b[1].items.push(item)
                        })
                        setLocalBuffs(b)
                    }
                })
                .catch(err => console.error("Error fetching fallback constants:", err))
        }
    }, [localRaids.length, localBuffs.length])

    const currentRaid = useMemo(() => localRaids.find((r: any) => r.id === raid.destination || r.name === raid.destination), [localRaids, raid.destination])
    const bgUrl = currentRaid?.background || "/assets/images/midnight-battle.webp"

    return (
        <div className="flex flex-col gap-6 text-foreground">
            {/* Top Navigation & Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>
                        <IconArrowLeft className="size-4 mr-2" />
                        Volver
                    </Button>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <IconCalendar className="size-5 text-primary" />
                        Planificador de Raid
                    </h1>
                    {isPast && (
                        <div className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-black uppercase border border-amber-500/30 flex items-center gap-1 animate-pulse">
                            <span className="size-1.5 bg-amber-500 rounded-full" />
                            Evento Finalizado
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Buttons moved to the info card below duration */}
                </div>
            </div>

            {/* Raid Info Header */}
            <div className="relative overflow-hidden bg-card/50 p-6 rounded-xl border border-border/40 shadow-sm flex flex-col gap-6">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-700"
                    style={{
                        backgroundImage: `linear-gradient(to left, transparent 0%, rgba(15, 15, 20, 0.4) 30%, rgba(15, 15, 20, 0.9) 80%, rgba(15, 15, 20, 1) 100%), url(${bgUrl})`,
                        opacity: 0.3
                    }}
                />
                <div className="relative z-10 grid grid-cols-2 md:grid-cols-8 gap-8 md:gap-6">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Fecha y Hora</Label>
                        {isReadOnly ? (
                            <div className="flex items-center gap-2 h-10 px-0 text-amber-200/90 font-medium">
                                <IconCalendar className="size-4 opacity-50" />
                                <span className="text-sm">{new Date(raid.event_date).toLocaleString('es-ES', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                {isPast && <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded uppercase font-bold border border-amber-500/20 ml-2">Histórico</span>}
                            </div>
                        ) : (
                            <Input
                                type="datetime-local"
                                value={raid.event_date}
                                onChange={(e) => setRaid({ ...raid, event_date: e.target.value })}
                                className="bg-background/50 border-border/20 focus:border-primary/50 transition-colors h-10"
                            />
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Destino (Midnight)</Label>
                        {isReadOnly ? (
                            <div className="flex items-center gap-2 h-10 px-0 text-white font-bold tracking-tight">
                                <span className="text-sm">{raids.find((r: any) => r.id === raid.destination || r.name === raid.destination)?.name || raid.destination}</span>
                            </div>
                        ) : (
                            <Select
                                value={raid.destination}
                                onValueChange={(val) => setRaid({ ...raid, destination: val })}
                            >
                                <SelectTrigger className="bg-background/50 border-border/20 h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border/20">
                                    {localRaids.map((r: any) => (
                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Dificultad</Label>
                        {isReadOnly ? (
                            <div className="flex items-center gap-2 h-10 px-0">
                                <span className={cn(
                                    "text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-md",
                                    raid.difficulty.includes("Mítico") ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                )}>
                                    {raid.difficulty}
                                </span>
                            </div>
                        ) : (
                            <Select
                                value={raid.difficulty}
                                onValueChange={(val) => setRaid({ ...raid, difficulty: val })}
                            >
                                <SelectTrigger className="bg-background/50 border-border/20 h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border/20">
                                    <SelectItem value="Normal (30)">Normal (30)</SelectItem>
                                    <SelectItem value="Heroic (30)">Heroico (30)</SelectItem>
                                    <SelectItem value="Mythic (20)">Mítico (20)</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">Duración</Label>
                        {isReadOnly ? (
                            <div className="flex items-center gap-2 h-10 px-0 text-muted-foreground font-medium">
                                <IconClock className="size-4 opacity-50" />
                                <span className="text-sm">{duration} Horas</span>
                            </div>
                        ) : (
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger className="bg-background/50 border-border/20 h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border/20">
                                    <SelectItem value="1">1 Hora</SelectItem>
                                    <SelectItem value="1.5">1.5 Horas</SelectItem>
                                    <SelectItem value="2">2 Horas</SelectItem>
                                    <SelectItem value="2.5">2.5 Horas</SelectItem>
                                    <SelectItem value="3">3 Horas</SelectItem>
                                    <SelectItem value="4">4 Horas</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                {!isReadOnly && (
                    <div className="flex items-center gap-3 pt-4 border-t border-border/10">
                        <Button
                            size="lg"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-emerald-500/10 text-sm uppercase tracking-wider"
                        >
                            <IconDeviceFloppy className="size-4 mr-2" />
                            {isSaving ? "Guardando..." : "Guardar Evento"}
                        </Button>
                        {initialRaid && (
                            <>
                                <div className="h-6 w-px bg-border/20 mx-1" />
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={async () => {
                                        if (!isReadOnly) await handleSave();
                                        const firstBoss = currentRaid?.bosses[0] || ""
                                        router.push(`/dashboard/planificador-cds?event_id=${initialRaid.id}${firstBoss ? `&boss=${encodeURIComponent(firstBoss)}` : ''}`)
                                    }}
                                    className="px-6 h-11 rounded-xl border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 shadow-lg shadow-blue-500/5 group"
                                >
                                    <IconTimeline className="size-4 mr-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-black uppercase tracking-widest">Asignar CD&apos;s</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={async () => {
                                        if (!isReadOnly) await handleSave();
                                        const firstBoss = currentRaid?.bosses[0] || ""
                                        router.push(`/dashboard/planificador-cds?event_id=${initialRaid.id}&tab=mrt${firstBoss ? `&boss=${encodeURIComponent(firstBoss)}` : ''}`)
                                    }}
                                    className="px-6 h-11 rounded-xl border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 shadow-lg shadow-amber-500/5 group"
                                >
                                    <IconClipboardText className="size-4 mr-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-black uppercase tracking-widest">Nota MRT</span>
                                </Button>
                                <div className="h-6 w-px bg-border/20 mx-1" />
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={handleDelete}
                                    disabled={isSaving}
                                    className="px-4 h-11 rounded-xl border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                                    title="Eliminar Evento"
                                >
                                    <IconTrash className="size-4 mr-2" />
                                    <span className="text-xs uppercase font-bold">Eliminar</span>
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Personal Inscription (for Raiders/Members to set their own status) */}
            {/* <div className="bg-card/30 border border-border/20 rounded-xl p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                <div className="flex flex-col gap-1">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <IconUsers className="size-4" />
                        Tu Inscripción
                    </h2>
                    <p className="text-xs text-muted-foreground">Indica tu disponibilidad para este evento.</p>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-1 max-w-2xl">
                    <div className="flex bg-muted/30 p-1 rounded-xl border border-border/20 flex-1">
                        <button
                            onClick={() => setPresence("present")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all uppercase tracking-tighter",
                                presence === "present" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            <IconCheck className="size-4" />
                            Presente
                        </button>
                        <button
                            onClick={() => setPresence("late")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all uppercase tracking-tighter",
                                presence === "late" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            <IconClock className="size-4" />
                            Tarde
                        </button>
                        <button
                            onClick={() => setPresence("absent")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all uppercase tracking-tighter",
                                presence === "absent" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            <IconUserOff className="size-4" />
                            Ausente
                        </button>
                    </div>

                    <Input
                        placeholder="Comentario (opcional)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="bg-background/50 border-border/20 h-10 md:w-64"
                    />

                    <Button
                        onClick={handleSavePresence}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 md:px-6 rounded-lg uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-primary/10"
                    >
                        {isSaving ? "Cargando..." : "Confirmar Mi Asistencia"}
                    </Button>
                </div>
            </div> */}

            {/* Boss Selection */}
            {currentRaid?.bosses && currentRaid.bosses.length > 0 && !isReadOnly && (
                <div className="bg-card/30 border border-border/20 rounded-xl p-4 md:p-6 shadow-sm flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                            <IconCheck className="size-4" />
                            Selección de Jefes
                        </h2>
                        <p className="text-xs text-muted-foreground">Selecciona qué jefes se van a enfrentar en esta planifiación.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setRaid({ ...raid, selected_bosses: [] })}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-tighter border",
                                raid.selected_bosses.length === 0
                                    ? "bg-primary/20 text-primary border-primary/30"
                                    : "bg-background/50 border-border/20 text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            Todos (Completa)
                        </button>
                        {currentRaid.bosses.map((boss: string) => {
                            const isSelected = raid.selected_bosses.includes(boss);
                            return (
                                <button
                                    key={boss}
                                    onClick={() => {
                                        setRaid((prev: any) => {
                                            const newArray = isSelected
                                                ? prev.selected_bosses.filter((b: string) => b !== boss)
                                                : [...(prev.selected_bosses || []), boss];
                                            return { ...prev, selected_bosses: newArray };
                                        });
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold transition-all uppercase border",
                                        isSelected
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background/50 border-border/20 text-muted-foreground hover:border-primary/30 hover:text-primary"
                                    )}
                                >
                                    {boss}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Planning Area */}
            {
                !hasMounted ? (
                    <div className="flex flex-col gap-8 opacity-50">
                        <div className="h-64 bg-muted animate-pulse rounded-2xl" />
                        <div className="h-32 bg-muted animate-pulse rounded-2xl" />
                    </div>
                ) : (
                    <DndContext
                        id="raid-planner-dnd"
                        sensors={canDrag ? sensors : []}
                        collisionDetection={customCollisionDetection}
                        onDragStart={canDrag ? handleDragStart : undefined}
                        onDragOver={canDrag ? handleDragOver : undefined}
                        onDragEnd={canDrag ? handleDragEnd : undefined}
                    >
                        <div className="w-full">
                            <div className="flex-1 overflow-hidden">
                                <Tabs defaultValue="active" className="lg:hidden w-full">
                                    <TabsList className="grid grid-cols-3 mb-4 w-full h-11 p-1">
                                        <TabsTrigger value="active">Activos</TabsTrigger>
                                        <TabsTrigger value="queued">Cola</TabsTrigger>
                                        <TabsTrigger value="buffs">Buffs</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="active">
                                        <div className="flex flex-col gap-4">
                                            <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest">Activos ({activeMembers.length})</h3>
                                            <DroppableContainer
                                                id="active-container-mobile"
                                                items={activeMembers.map(s => s.member_id)}
                                                strategy={verticalListSortingStrategy}
                                                className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex flex-col gap-4"
                                            >
                                                <RosterGroup title="Tanques" color="text-emerald-500" signups={activeByRole.tanks} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                                <RosterGroup title="Sanadores" color="text-emerald-500" signups={activeByRole.heals} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                                <RosterGroup title="Melee DPS" color="text-emerald-500" signups={activeByRole.melee} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                                <RosterGroup title="Ranged DPS" color="text-emerald-500" signups={activeByRole.ranged} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                            </DroppableContainer>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="queued">
                                        <div className="flex flex-col gap-4">
                                            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest">En Cola ({reserveMembers.length})</h3>
                                            <DroppableContainer
                                                id="queue-container-mobile"
                                                items={reserveMembers.map(s => s.member_id)}
                                                strategy={verticalListSortingStrategy}
                                                className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-4"
                                            >
                                                <RosterGroup title="Tanques" color="text-amber-500" signups={reserveByRole.tanks} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                                <RosterGroup title="Sanadores" color="text-amber-500" signups={reserveByRole.heals} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                                <RosterGroup title="Melee DPS" color="text-amber-500" signups={reserveByRole.melee} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                                <RosterGroup title="Ranged DPS" color="text-amber-500" signups={reserveByRole.ranged} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                            </DroppableContainer>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="buffs">
                                        <BuffsCard activeClassIds={activeClassIds} buffs={localBuffs} className="h-auto" />
                                    </TabsContent>
                                </Tabs>
                            </div>

                            {/* Desktop Layout (hidden on small screens) */}
                            <div className="hidden lg:flex flex-row gap-6 items-start">
                                {/* COLUMN 1: Active Roster */}
                                <div className="flex-1 flex flex-col gap-4 min-w-0">
                                    <div className="flex justify-between items-end">
                                        <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest">Activos ({activeMembers.length} / {raid.difficulty.includes('20') ? 20 : 30})</h3>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Planificación actual</span>
                                    </div>
                                    <DroppableContainer
                                        id="active-container"
                                        items={activeMembers.map(s => s.member_id)}
                                        strategy={rectSortingStrategy}
                                        className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 min-h-[600px] grid grid-cols-1 xl:grid-cols-2 gap-4"
                                    >
                                        <RosterGroup title="Tanques" color="text-emerald-500" signups={activeByRole.tanks} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                        <RosterGroup title="Sanadores" color="text-emerald-500" signups={activeByRole.heals} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                        <RosterGroup title="Melee DPS" color="text-emerald-500" signups={activeByRole.melee} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                        <RosterGroup title="Ranged DPS" color="text-emerald-500" signups={activeByRole.ranged} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                    </DroppableContainer>
                                </div>

                                {/* COLUMN 2: Reserve */}
                                <div className="flex-1 flex flex-col gap-4 min-w-0 self-stretch">
                                    <div className="flex justify-between items-end">
                                        <h3 className="text-sm font-bold text-amber-500 uppercase tracking-widest">En Cola ({reserveMembers.length})</h3>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Banquillo disponible</span>
                                    </div>
                                    <DroppableContainer
                                        id="queue-container"
                                        items={reserveMembers.map(s => s.member_id)}
                                        strategy={rectSortingStrategy}
                                        className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 min-h-[600px] grid grid-cols-1 xl:grid-cols-2 gap-4"
                                    >
                                        <RosterGroup title="Tanques" color="text-amber-500" signups={reserveByRole.tanks} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                        <RosterGroup title="Sanadores" color="text-amber-500" signups={reserveByRole.heals} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                        <RosterGroup title="Melee DPS" color="text-amber-500" signups={reserveByRole.melee} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                        <RosterGroup title="Ranged DPS" color="text-amber-500" signups={reserveByRole.ranged} onToggle={toggleStatus} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} rankColors={rankColors} />
                                    </DroppableContainer>
                                </div>

                                {/* COLUMN 3: Buffs */}
                                <div className="flex-1 flex flex-col gap-4 min-w-0 sticky top-6">
                                    <div className="flex justify-between items-end">
                                        <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Buffs & Debuffs</h3>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Cobertura de Raid</span>
                                    </div>
                                    <BuffsCard activeClassIds={activeClassIds} buffs={localBuffs} />
                                </div>
                            </div>
                        </div>

                        <DragOverlay dropAnimation={null}>
                            {activeId ? (
                                <div className="opacity-90 backdrop-blur-sm pointer-events-none scale-105 shadow-2xl border-primary shadow-primary/20">
                                    <MemberItem
                                        signup={signups.find(s => s.member_id === activeId)!}
                                        onToggle={() => { }}
                                        onToggleAbsent={() => { }}
                                        onToggleLate={() => { }}
                                        onResetStatus={() => { }}
                                        changeRole={changeRole}
                                        rankColors={rankColors}
                                    />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )
            }
        </div >
    )
}

function MemberItem({ signup, onToggle, onToggleAbsent, onToggleLate, onResetStatus, isReadOnly = false, changeRole, rankColors }: { signup: Signup, onToggle: () => void, onToggleAbsent: () => void, onToggleLate: () => void, onResetStatus: () => void, isReadOnly?: boolean, changeRole: (id: string, role: string) => void, rankColors?: (string | null)[] }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: signup.member_id,
        disabled: isReadOnly || signup.is_absent || signup.is_late
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1
    }

    const m = signup.guild_members
    const classColor = "text-white"

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center justify-between bg-card border border-border/50 rounded-lg p-2 gap-3 hover:border-primary/30 group cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden",
                (signup.is_absent || signup.is_late) && "opacity-70 grayscale-[0.3] border-dashed cursor-default",
                signup.is_absent && "border-red-500/30",
                signup.is_late && "border-amber-500/30"
            )}
            onClick={() => !isReadOnly && !signup.is_absent && !signup.is_late && onToggle()}
        >
            {(signup.is_absent || signup.is_late) && (
                <div
                    className={cn(
                        "absolute inset-0 flex items-center justify-center z-20 transition-all",
                        signup.is_absent ? "bg-red-950/30" : "bg-amber-950/30",
                        !isReadOnly && "cursor-pointer group/absent hover:bg-emerald-950/60"
                    )}
                    onClick={(e) => {
                        if (isReadOnly) return
                        e.stopPropagation()
                        onResetStatus()
                    }}
                >
                    <span className={cn(
                        "text-[14px] font-black uppercase tracking-[0.4em] -rotate-6 transition-all",
                        signup.is_absent ? "text-red-500" : "text-amber-500",
                        !isReadOnly && "group-hover/absent:scale-110 group-hover/absent:opacity-0"
                    )}>
                        {signup.is_absent ? "Ausente" : "Llega Tarde"}
                    </span>
                    {!isReadOnly && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/absent:opacity-100 transition-all">
                            <span className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.2em] -rotate-6 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                                RETORNAR
                            </span>
                        </div>
                    )}
                </div>
            )}
            <div className="flex items-center gap-2 flex-1 overflow-hidden" {...attributes} {...listeners}>
                <Image src={`/assets/images/classes/${m.class_id}.jpg`} alt="" width={20} height={20} className="rounded-full shrink-0" />
                <RankBadge rank={m.rank} rankColors={rankColors} className="size-4" />
                <span className={cn("text-xs font-semibold truncate text-white")}>{m.character_name}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                {isReadOnly ? (
                    <div className="px-2 py-0.5 rounded bg-muted/30 border border-border/30 text-[9px] uppercase font-black tracking-tighter text-muted-foreground/70">
                        {signup.event_role}
                    </div>
                ) : (
                    <>
                        <Select
                            value={signup.event_role}
                            disabled={signup.is_absent || signup.is_late}
                            onValueChange={(newRole) => {
                                changeRole(signup.member_id, newRole)
                            }}
                        >
                            <SelectTrigger className="h-7 w-20 text-[10px] uppercase font-bold bg-muted/50 border-none hover:bg-muted py-0 px-2 justify-center">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tank">Tank</SelectItem>
                                <SelectItem value="heal">Healer</SelectItem>
                                <SelectItem value="melee">Melee</SelectItem>
                                <SelectItem value="ranged">Ranged</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "size-7 rounded-md transition-all scale-90",
                                    signup.is_late ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" : "text-muted-foreground/30 hover:text-amber-400 hover:bg-amber-500/10"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onToggleLate()
                                }}
                                title={signup.is_late ? "Quitar retraso" : "Llega tarde"}
                            >
                                <IconClock className="size-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "size-7 rounded-md transition-all scale-90",
                                    signup.is_absent ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "text-muted-foreground/30 hover:text-red-400 hover:bg-red-500/10"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onToggleAbsent()
                                }}
                                title={signup.is_absent ? "Quitar ausencia" : "Marcar ausencia"}
                            >
                                <IconUserOff className="size-3.5" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}


function DroppableContainer({ id, items, strategy, children, className }: { id: string, items: string[], strategy: any, children: React.ReactNode, className?: string }) {
    const { setNodeRef } = useDroppable({ id })
    return (
        <SortableContext id={id} items={items} strategy={strategy}>
            <div ref={setNodeRef} id={id} className={className}>
                {children}
            </div>
        </SortableContext>
    )
}


const CLASS_COUNTS = (active: Signup[]) => {
    const counts: Record<number, number> = {}
    active.forEach(s => {
        const cid = s.guild_members.class_id
        counts[cid] = (counts[cid] || 0) + 1
    })
    return counts
}

function RosterGroup({ title, color, signups, onToggle, onToggleAbsent, onToggleLate, onResetStatus, isReadOnly, changeRole, rankColors }: { title: string, color: string, signups: Signup[], onToggle: (id: string) => void, onToggleAbsent: (id: string) => void, onToggleLate: (id: string) => void, onResetStatus: (id: string) => void, isReadOnly: boolean, changeRole: (id: string, role: string) => void, rankColors?: (string | null)[] }) {
    return (
        <div className="flex flex-col gap-2">
            <h4 className={cn("text-[10px] font-bold uppercase pl-1 flex items-center gap-1", color + "/60")}>
                {title}
            </h4>
            {signups.length > 0 ? signups.map(s => (
                <MemberItem
                    key={s.member_id}
                    signup={s}
                    onToggle={() => onToggle(s.member_id)}
                    onToggleAbsent={() => onToggleAbsent(s.member_id)}
                    onToggleLate={() => onToggleLate(s.member_id)}
                    onResetStatus={() => onResetStatus(s.member_id)}
                    isReadOnly={isReadOnly}
                    changeRole={changeRole}
                    rankColors={rankColors}
                />
            )) : <div className={cn("h-10 border border-dashed rounded-lg flex items-center justify-center text-[10px] font-bold uppercase italic", color + "/10", color + "/30")}>Vacío</div>}
        </div>
    )
}

function BuffsCard({ activeClassIds, buffs, className }: { activeClassIds: Set<number>, buffs: any[], className?: string }) {
    if (!buffs || buffs.length === 0) {
        return (
            <div className={cn("bg-card/50 border border-border/40 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center py-12 text-muted-foreground", className)}>
                <IconClipboardText className="size-8 opacity-20 mb-2" />
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-50">Sin datos de cobertura</p>
            </div>
        )
    }

    return (
        <div className={cn("bg-card/50 border border-border/40 rounded-2xl p-6 shadow-sm flex flex-col gap-8", className)}>
            {buffs.map((section: any) => (
                <div key={section.category} className="flex flex-col gap-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 border-b border-border/10 pb-2">
                        {section.category}
                    </h4>
                    {section.items.length === 0 ? (
                        <p className="text-[9px] text-muted-foreground/30 italic">No hay beneficios disponibles</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {section.items.map((buff: any) => {
                                const isPresent = activeClassIds.has(Number(buff.classId))
                                return (
                                    <div key={buff.id} className="flex items-center justify-between p-2.5 rounded-xl bg-background/40 border border-border/10 group">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "size-2 rounded-full transition-all duration-300",
                                                isPresent ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/20"
                                            )} />
                                            <span className={cn(
                                                "text-xs transition-colors",
                                                isPresent ? "text-foreground font-semibold" : "text-muted-foreground/40 italic"
                                            )}>
                                                {buff.name}
                                            </span>
                                        </div>
                                        <div className={cn(
                                            "size-5 rounded-md flex items-center justify-center transition-all shrink-0",
                                            isPresent ? "bg-emerald-500/10 text-emerald-500" : "text-muted-foreground/10"
                                        )}>
                                            {isPresent && <IconCheck className="size-3" />}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}
