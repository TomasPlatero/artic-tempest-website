"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
    IconChevronLeft,
    IconChevronRight,
    IconCalendar,
    IconClock,
    IconUsers,
    IconCheck,
    IconDeviceFloppy,
    IconArrowLeft,
    IconTrash
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sileo } from "sileo"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"

// DND Kit
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
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
    getFirstCollision,
    closestCorners,
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
}

const MIDNIGHT_RAIDS = [
    { id: "The Voidspire", name: "The Voidspire", bosses: ["Plexus Sentinel", "Soulbinder Naazindhri", "Loom'ithar", "Forgeweaver Araz", "The Soul Hunters", "Fractillus"] },
    { id: "The Dreamrift", name: "The Dreamrift", bosses: ["Primo-Dream"] },
    { id: "March on Quel'Danas", name: "March on Quel'Danas", bosses: ["Sunwell Corruption", "Xal'atath Shade"] }
]

const CLASS_ROLES: Record<number, string> = {
    1: "tank", 2: "tank", 3: "ranged", 4: "melee", 5: "heal", 6: "tank", 7: "ranged", 8: "ranged", 9: "ranged", 10: "tank", 11: "heal", 12: "melee", 13: "ranged"
}

const RAID_BUFFS = [
    { id: "stamina", name: "Stamina (Priest)", classId: 5 },
    { id: "intellect", name: "Intellect (Mage)", classId: 8 },
    { id: "attack_power", name: "Battle Shout (Warrior)", classId: 1 },
    { id: "versatility", name: "Mark of the Wild (Druid)", classId: 11 },
    { id: "chaos_brand", name: "Chaos Brand (DH)", classId: 12 },
    { id: "mystic_touch", name: "Mystic Touch (Monk)", classId: 10 },
    { id: "healthstones", name: "Healthstones (Warlock)", classId: 9 },
]

export function RaidEditorClient({
    initialRaid,
    initialSignups,
    plannableMembers,
    preselectedDate,
    currentMemberId,
    isReadOnly = false
}: {
    initialRaid: any
    initialSignups: any[]
    plannableMembers: Member[]
    preselectedDate?: string
    currentMemberId?: string
    isReadOnly?: boolean
}) {
    const router = useRouter()
    const [raid, setRaid] = useState(initialRaid ? {
        ...initialRaid,
        selected_bosses: initialRaid.selected_bosses || []
    } : {
        destination: MIDNIGHT_RAIDS[0].name,
        event_date: preselectedDate ? `${preselectedDate}T20:00` : new Date().toISOString().slice(0, 16),
        difficulty: "Mythic (20)",
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
            const role = s.event_role || (s.guild_members?.role || CLASS_ROLES[s.guild_members?.class_id] || 'dps').toLowerCase()
            merged.push({ ...s, event_role: role })
        })

        // Add plannable members who aren't signed up yet as 'queued'
        plannableMembers.forEach(m => {
            if (!merged.find(s => s.member_id === m.id)) {
                merged.push({
                    member_id: m.id,
                    selection_status: 'queued',
                    event_role: (m.role || CLASS_ROLES[m.class_id] || 'dps').toLowerCase(),
                    signup_order: merged.length,
                    guild_members: m
                })
            }
        })
        return merged
    })

    const initialDuration = initialRaid?.end_date && initialRaid?.event_date
        ? Math.max(1, Math.round((new Date(initialRaid.end_date).getTime() - new Date(initialRaid.event_date).getTime()) / 3600000))
        : 2
    const [duration, setDuration] = useState(initialDuration.toString())

    const [isSaving, setIsSaving] = useState(false)
    const [hasMounted, setHasMounted] = useState(false)

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
            sileo.success({ title: "Inscripción guardada", description: "Tu estado para esta raid ha sido actualizado." })
            router.refresh()
        } catch (error) {
            console.error(error)
            sileo.error({ title: "Error", description: "No se pudo guardar tu inscripción." })
        } finally {
            setIsSaving(false)
        }
    }


    useEffect(() => {
        setHasMounted(true)
        console.log("RaidEditorClient Mounted")
        console.log("initialRaid:", initialRaid)
        console.log("initialSignups length:", initialSignups.length)
        console.log("plannableMembers length:", plannableMembers.length)
        console.log("Internal signups length:", signups.length)
    }, [initialRaid, initialSignups.length, plannableMembers.length, signups.length])

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

    const changeRole = (memberId: string) => {
        const ROLES = ['tank', 'heal', 'melee', 'ranged']
        setSignups(prev => prev.map(s => {
            if (s.member_id === memberId) {
                const currentIndex = ROLES.indexOf(s.event_role)
                const nextRole = ROLES[(currentIndex + 1) % ROLES.length]
                return { ...s, event_role: nextRole }
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
                end_date: endDate.toISOString(),
                selected_bosses: []
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
                        signup_order: idx
                    }))
                })
            })
            if (!signupRes.ok) throw new Error("Error al guardar el roster")

            sileo.success({ title: "Raid y Roster guardados con éxito" })
            router.push("/dashboard/calendario")
            router.refresh()
        } catch (error: any) {
            sileo.error({ title: "Error", description: error.message })
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

            sileo.success({ title: "Evento eliminado correctamente" })
            router.push("/dashboard/calendario")
            router.refresh()
        } catch (error: any) {
            sileo.error({ title: "Error", description: error.message })
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
                </div>
                <div className="flex items-center gap-2">
                    {!isReadOnly && initialRaid && (
                        <Button
                            variant="outline"
                            onClick={handleDelete}
                            disabled={isSaving}
                            className="text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                        >
                            <IconTrash className="size-4 mr-2" />
                            Eliminar Evento
                        </Button>
                    )}
                    {!isReadOnly && (
                        <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
                            <IconDeviceFloppy className="size-4 mr-2" />
                            {isSaving ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Raid Info Header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card/50 p-6 rounded-xl border border-border/40 shadow-sm">
                <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Fecha y Hora</Label>
                    <Input
                        type="datetime-local"
                        value={raid.event_date.slice(0, 16)}
                        onChange={e => setRaid({ ...raid, event_date: e.target.value })}
                        className="bg-background border-border/20"
                        readOnly={isReadOnly}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Destino (Midnight)</Label>
                    <Select value={raid.destination} onValueChange={v => setRaid({ ...raid, destination: v })} disabled={isReadOnly}>
                        <SelectTrigger className="bg-background border-border/20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {MIDNIGHT_RAIDS.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Dificultad</Label>
                    <Select value={raid.difficulty} onValueChange={v => setRaid({ ...raid, difficulty: v })} disabled={isReadOnly}>
                        <SelectTrigger className="bg-background border-border/20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Normal (30)">Normal (30)</SelectItem>
                            <SelectItem value="Heroic (30)">Heroic (30)</SelectItem>
                            <SelectItem value="Mythic (20)">Mythic (20)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Duración</Label>
                    <Select value={duration} onValueChange={setDuration} disabled={isReadOnly}>
                        <SelectTrigger className="bg-background border-border/20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">1 Hora</SelectItem>
                            <SelectItem value="1.5">1.5 Horas</SelectItem>
                            <SelectItem value="2">2 Horas</SelectItem>
                            <SelectItem value="2.5">2.5 Horas</SelectItem>
                            <SelectItem value="3">3 Horas</SelectItem>
                            <SelectItem value="4">4 Horas</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>


            {/* Main Planning Area */}
            {!hasMounted ? (
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
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        {/* COLUMN 1: Active Roster Grouped (33%) */}
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
                                {/* Tank Column */}
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-[10px] font-bold text-emerald-500/60 uppercase pl-1">Tanques</h4>
                                    {activeByRole.tanks.length > 0 ? activeByRole.tanks.map(s => (
                                        <MemberItem key={s.member_id} signup={s} onToggle={() => toggleStatus(s.member_id)} onChangeRole={() => changeRole(s.member_id)} isReadOnly={isReadOnly} />
                                    )) : <div className="h-10 border border-dashed border-emerald-500/10 rounded-lg flex items-center justify-center text-[10px] text-emerald-500/30 font-bold uppercase italic">Sin Tanques</div>}
                                </div>

                                {/* Heals Column */}
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-[10px] font-bold text-emerald-500/60 uppercase pl-1">Healers</h4>
                                    {activeByRole.heals.length > 0 ? activeByRole.heals.map(s => (
                                        <MemberItem key={s.member_id} signup={s} onToggle={() => toggleStatus(s.member_id)} onChangeRole={() => changeRole(s.member_id)} isReadOnly={isReadOnly} />
                                    )) : <div className="h-10 border border-dashed border-emerald-500/10 rounded-lg flex items-center justify-center text-[10px] text-emerald-500/30 font-bold uppercase italic">Sin Healers</div>}
                                </div>

                                {/* Melee Column */}
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-[10px] font-bold text-emerald-500/60 uppercase pl-1">Melee DPS</h4>
                                    {activeByRole.melee.length > 0 ? activeByRole.melee.map(s => (
                                        <MemberItem key={s.member_id} signup={s} onToggle={() => toggleStatus(s.member_id)} onChangeRole={() => changeRole(s.member_id)} isReadOnly={isReadOnly} />
                                    )) : <div className="h-10 border border-dashed border-emerald-500/10 rounded-lg flex items-center justify-center text-[10px] text-emerald-500/30 font-bold uppercase italic">Sin Melee</div>}
                                </div>

                                {/* Ranged Column */}
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-[10px] font-bold text-emerald-500/60 uppercase pl-1">Ranged DPS</h4>
                                    {activeByRole.ranged.length > 0 ? activeByRole.ranged.map(s => (
                                        <MemberItem key={s.member_id} signup={s} onToggle={() => toggleStatus(s.member_id)} onChangeRole={() => changeRole(s.member_id)} isReadOnly={isReadOnly} />
                                    )) : <div className="h-10 border border-dashed border-emerald-500/10 rounded-lg flex items-center justify-center text-[10px] text-emerald-500/30 font-bold uppercase italic">Sin Ranged</div>}
                                </div>
                            </DroppableContainer>
                        </div>

                        {/* COLUMN 2: Queue / Reserve (33%) Role-based Grid Mirror */}
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
                                {/* Tank Reserve */}
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-[10px] font-bold text-amber-500/60 uppercase pl-1">Tanques</h4>
                                    {reserveByRole.tanks.length > 0 ? reserveByRole.tanks.map(s => (
                                        <MemberItem key={s.member_id} signup={s} onToggle={() => toggleStatus(s.member_id)} onChangeRole={() => changeRole(s.member_id)} isReadOnly={isReadOnly} />
                                    )) : <div className="h-10 border border-dashed border-amber-500/10 rounded-lg flex items-center justify-center text-[10px] text-amber-500/30 font-bold uppercase italic">Vacío</div>}
                                </div>

                                {/* Heals Reserve */}
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-[10px] font-bold text-amber-500/60 uppercase pl-1">Healers</h4>
                                    {reserveByRole.heals.length > 0 ? reserveByRole.heals.map(s => (
                                        <MemberItem key={s.member_id} signup={s} onToggle={() => toggleStatus(s.member_id)} onChangeRole={() => changeRole(s.member_id)} isReadOnly={isReadOnly} />
                                    )) : <div className="h-10 border border-dashed border-amber-500/10 rounded-lg flex items-center justify-center text-[10px] text-amber-500/30 font-bold uppercase italic">Vacío</div>}
                                </div>

                                {/* Melee Reserve */}
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-[10px] font-bold text-amber-500/60 uppercase pl-1">Melee DPS</h4>
                                    {reserveByRole.melee.length > 0 ? reserveByRole.melee.map(s => (
                                        <MemberItem key={s.member_id} signup={s} onToggle={() => toggleStatus(s.member_id)} onChangeRole={() => changeRole(s.member_id)} isReadOnly={isReadOnly} />
                                    )) : <div className="h-10 border border-dashed border-amber-500/10 rounded-lg flex items-center justify-center text-[10px] text-amber-500/30 font-bold uppercase italic">Vacío</div>}
                                </div>

                                {/* Ranged Reserve */}
                                <div className="flex flex-col gap-2">
                                    <h4 className="text-[10px] font-bold text-amber-500/60 uppercase pl-1">Ranged DPS</h4>
                                    {reserveByRole.ranged.length > 0 ? reserveByRole.ranged.map(s => (
                                        <MemberItem key={s.member_id} signup={s} onToggle={() => toggleStatus(s.member_id)} onChangeRole={() => changeRole(s.member_id)} isReadOnly={isReadOnly} />
                                    )) : <div className="h-10 border border-dashed border-amber-500/10 rounded-lg flex items-center justify-center text-[10px] text-amber-500/30 font-bold uppercase italic">Vacío</div>}
                                </div>
                            </DroppableContainer>
                        </div>

                        {/* COLUMN 3: Buffs & Debuffs (33%) */}
                        <div className="flex-1 flex flex-col gap-4 min-w-0 sticky top-6">
                            <div className="flex justify-between items-end">
                                <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Buffs & Debuffs</h3>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Cobertura de Raid</span>
                            </div>
                            <div className="bg-card/50 border border-border/40 rounded-2xl p-6 shadow-sm min-h-[600px]">
                                <div className="grid grid-cols-1 gap-4">
                                    {RAID_BUFFS.map(buff => {
                                        const isPresent = activeClassIds.has(buff.classId)
                                        return (
                                            <div key={buff.id} className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border/10">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className={cn("text-xs transition-colors", isPresent ? "text-foreground font-bold" : "text-muted-foreground/50 italic")}>
                                                        {buff.name}
                                                    </span>
                                                    <span className="text-[9px] text-muted-foreground/40 uppercase font-bold">{buff.id}</span>
                                                </div>
                                                <div className={cn(
                                                    "size-5 rounded-full flex items-center justify-center transition-all shrink-0 animate-in fade-in zoom-in duration-300",
                                                    isPresent ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/10 border border-muted-foreground/5 text-muted-foreground/20"
                                                )}>
                                                    {isPresent ? <IconCheck className="size-3" /> : <div className="size-1 rounded-full bg-current" />}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DragOverlay dropAnimation={null}>
                        {activeId ? (
                            <div className="opacity-90 backdrop-blur-sm pointer-events-none scale-105 shadow-2xl border-primary shadow-primary/20">
                                <MemberItem
                                    signup={signups.find(s => s.member_id === activeId)!}
                                    onToggle={() => { }}
                                    onChangeRole={() => { }}
                                />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}
        </div >
    )
}

function MemberItem({ signup, onToggle, onChangeRole, isReadOnly = false }: { signup: Signup, onToggle: () => void, onChangeRole: () => void, isReadOnly?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: signup.member_id, disabled: isReadOnly })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1
    }

    const m = signup.guild_members
    const classColor = WOW_CLASS_COLORS[m.class_id] || "text-white"

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between bg-card border border-border/50 rounded-lg p-2 gap-3 hover:border-primary/30 group cursor-default"
        >
            <div className="flex items-center gap-2 flex-1" {...attributes} {...listeners}>
                <Image src={`/assets/images/classes/${m.class_id}.jpg`} alt="" width={20} height={20} className="rounded-full shrink-0" />
                <span className={cn("text-xs font-semibold truncate", classColor)}>{m.character_name}</span>
            </div>

            <div className="flex items-center gap-1.5">
                {!isReadOnly && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); onChangeRole(); }}
                            className="text-[10px] uppercase font-bold text-muted-foreground/60 w-12 text-center hover:text-white transition-colors cursor-pointer bg-muted/50 hover:bg-muted py-1 rounded"
                            title="Cambiar rol"
                        >
                            {signup.event_role}
                        </button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-white"
                            onClick={onToggle}
                        >
                            {signup.selection_status === 'selected' ? <IconTrash className="size-3 text-red-500" /> : <IconCheck className="size-3 text-emerald-500" />}
                        </Button>
                    </>
                )}
                {isReadOnly && (
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/40 w-12 text-center py-1">
                        {signup.event_role}
                    </span>
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

const WOW_CLASSES: Record<number, string> = {
    1: "Warrior", 2: "Paladin", 3: "Hunter", 4: "Rogue", 5: "Priest", 6: "Death Knight", 7: "Shaman", 8: "Mage", 9: "Warlock", 10: "Monk", 11: "Druid", 12: "Demon Hunter", 13: "Evoker"
}

const WOW_CLASS_COLORS: Record<number, string> = {
    1: "text-[#C69B6D]", 2: "text-[#F48CBA]", 3: "text-[#AAD372]", 4: "text-[#FFF468]", 5: "text-white", 6: "text-[#C41E3A]", 7: "text-[#0070DD]", 8: "text-[#3FC7EB]", 9: "text-[#8788EE]", 10: "text-[#00FF98]", 11: "text-[#FF7C0A]", 12: "text-[#A330C9]", 13: "text-[#33937F]"
}

const CLASS_COUNTS = (active: Signup[]) => {
    const counts: Record<number, number> = {}
    active.forEach(s => {
        const cid = s.guild_members.class_id
        counts[cid] = (counts[cid] || 0) + 1
    })
    return counts
}
