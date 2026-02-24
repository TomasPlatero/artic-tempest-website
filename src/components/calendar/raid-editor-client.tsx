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
    IconTrash,
    IconUserOff
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    is_absent?: boolean
    is_late?: boolean
}

const MIDNIGHT_RAIDS = [
    {
        id: "The Voidspire",
        name: "La Aguja del Vacío",
        background: "/assets/images/raids/voidspire.jpg",
        bosses: ["Plexus Sentinel", "Soulbinder Naazindhri", "Loom'ithar", "Forgeweaver Araz", "The Soul Hunters", "Fractillus"]
    },
    {
        id: "The Dreamrift",
        name: "La Falla del Sueño",
        background: "/assets/images/raids/dreamrift.jpg",
        bosses: ["Primo-Dream"]
    },
    {
        id: "March on Quel'Danas",
        name: "Marcha sobre Quel'Danas",
        background: "/assets/images/raids/marchonqueldanas.jpg",
        bosses: ["Sunwell Corruption", "Xal'atath Shade"]
    }
]

const CLASS_ROLES: Record<number, string> = {
    1: "tank", 2: "tank", 3: "ranged", 4: "melee", 5: "heal", 6: "tank", 7: "ranged", 8: "ranged", 9: "ranged", 10: "tank", 11: "heal", 12: "melee", 13: "ranged"
}

const RAID_BUFFS = [
    {
        category: "Buffs / Debuffs",
        items: [
            { id: "intellect", name: "5% Intelecto", classId: 8 },
            { id: "attack_power", name: "5% Poder de Ataque", classId: 1 },
            { id: "stamina", name: "5% Aguante", classId: 5 },
            { id: "phys_damage", name: "5% Daño Físico", classId: 10 },
            { id: "magic_damage", name: "5% Daño Mágico", classId: 12 },
            { id: "devotion", name: "Aura de Devoción", classId: 2 },
            { id: "versatility", name: "3% Versatilidad", classId: 11 },
            { id: "dr", name: "3.6% Reducción de Daño", classId: 13 },
            { id: "hunters_mark", name: "Marca del Cazador", classId: 3 },
            { id: "skyfury", name: "Skyfury", classId: 7 },
        ]
    },
    {
        category: "Utilidad",
        items: [
            { id: "lust", name: "Ansia de Sangre", classId: 7 },
            { id: "bres", name: "Resurrección en Combate", classId: 6 },
            { id: "speed", name: "Velocidad de Movimiento", classId: 11 },
            { id: "healthstone", name: "Piedra de Salud", classId: 9 },
            { id: "gateway", name: "Portal", classId: 9 },
            { id: "innervate", name: "Estimular", classId: 11 },
            { id: "amz", name: "Zona Anti-Magia", classId: 6 },
            { id: "bop", name: "Bendición de Protección", classId: 2 },
            { id: "rally", name: "Grito de Convocatoria", classId: 1 },
            { id: "darkness", name: "Oscuridad", classId: 12 },
            { id: "immunity", name: "Inmunidad", classId: 2 },
        ]
    }
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
            const role = s.event_role || (s.guild_members?.role || CLASS_ROLES[s.guild_members?.class_id] || 'dps').toLowerCase()
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
                        signup_order: idx,
                        is_absent: s.is_absent,
                        is_late: s.is_late
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

    const currentRaid = MIDNIGHT_RAIDS.find(r => r.id === raid.destination)
    const bgUrl = currentRaid?.background || "/assets/images/wow-raid-hero.jpg"

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
                    {/* Buttons moved to the info card below duration */}
                </div>
            </div>

            {/* Raid Info Header */}
            <div className="relative overflow-hidden bg-card/50 p-6 rounded-xl border border-border/40 shadow-sm flex flex-col gap-6">
                <div
                    className="absolute inset-0 -z-10 bg-cover bg-center pointer-events-none transition-all duration-700"
                    style={{
                        backgroundImage: `linear-gradient(to left, transparent 0%, rgba(15, 15, 20, 0.4) 30%, rgba(15, 15, 20, 0.9) 80%, rgba(15, 15, 20, 1) 100%), url(${bgUrl})`,
                        opacity: 0.3
                    }}
                />
                <div className="flex flex-col md:flex-row md:items-end flex-wrap gap-6 relative z-10">
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
                        <Select value={raid.destination || ""} onValueChange={v => setRaid({ ...raid, destination: v })} disabled={isReadOnly}>
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
                                <SelectItem value="Heroic (30)">Heroico (30)</SelectItem>
                                <SelectItem value="Mythic (20)">Mítico (20)</SelectItem>
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
                        )}
                    </div>
                )}
            </div>


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
                            {/* Mobile Tabs Wrapper */}
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
                                            <RosterGroup title="Tanques" icon="🛡️" color="text-emerald-500" signups={activeByRole.tanks} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
                                            <RosterGroup title="Sanadores" icon="➕" color="text-emerald-500" signups={activeByRole.heals} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
                                            <RosterGroup title="Melee DPS" icon="⚔️" color="text-emerald-500" signups={activeByRole.melee} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
                                            <RosterGroup title="Ranged DPS" icon="🏹" color="text-emerald-500" signups={activeByRole.ranged} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
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
                                            <RosterGroup title="Tanques" color="text-amber-500" signups={reserveByRole.tanks} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
                                            <RosterGroup title="Sanadores" color="text-amber-500" signups={reserveByRole.heals} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
                                            <RosterGroup title="Melee DPS" color="text-amber-500" signups={reserveByRole.melee} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
                                            <RosterGroup title="Ranged DPS" color="text-amber-500" signups={reserveByRole.ranged} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
                                        </DroppableContainer>
                                    </div>
                                </TabsContent>

                                <TabsContent value="buffs">
                                    <BuffsCard activeClassIds={activeClassIds} className="h-auto" />
                                </TabsContent>
                            </Tabs>

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
                                        <RosterGroup title="Tanques" icon="🛡️" color="text-emerald-500" signups={activeByRole.tanks} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
                                        <RosterGroup title="Sanadores" icon="➕" color="text-emerald-500" signups={activeByRole.heals} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
                                        <RosterGroup title="Melee DPS" icon="⚔️" color="text-emerald-500" signups={activeByRole.melee} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
                                        <RosterGroup title="Ranged DPS" icon="🏹" color="text-emerald-500" signups={activeByRole.ranged} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
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
                                        <RosterGroup title="Tanques" color="text-amber-500" signups={reserveByRole.tanks} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
                                        <RosterGroup title="Sanadores" color="text-amber-500" signups={reserveByRole.heals} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
                                        <RosterGroup title="Melee DPS" color="text-amber-500" signups={reserveByRole.melee} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
                                        <RosterGroup title="Ranged DPS" color="text-amber-500" signups={reserveByRole.ranged} onToggle={toggleStatus} onChangeRole={changeRole} onToggleAbsent={toggleAbsent} onToggleLate={toggleLate} onResetStatus={resetStatus} isReadOnly={isReadOnly} changeRole={changeRole} />
                                    </DroppableContainer>
                                </div>

                                {/* COLUMN 3: Buffs */}
                                <div className="flex-1 flex flex-col gap-4 min-w-0 sticky top-6">
                                    <div className="flex justify-between items-end">
                                        <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Buffs & Debuffs</h3>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Cobertura de Raid</span>
                                    </div>
                                    <BuffsCard activeClassIds={activeClassIds} />
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
                                        onToggleAbsent={() => { }}
                                        onToggleLate={() => { }}
                                        onResetStatus={() => { }}
                                        changeRole={changeRole}
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

function MemberItem({ signup, onToggle, onChangeRole, onToggleAbsent, onToggleLate, onResetStatus, isReadOnly = false, changeRole }: { signup: Signup, onToggle: () => void, onChangeRole: () => void, onToggleAbsent: () => void, onToggleLate: () => void, onResetStatus: () => void, isReadOnly?: boolean, changeRole: (id: string, role: string) => void }) {
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
    const classColor = WOW_CLASS_COLORS[m.class_id] || "text-white"

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center justify-between bg-card border border-border/50 rounded-lg p-2 gap-3 hover:border-primary/30 group cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden",
                (signup.is_absent || signup.is_late) && "opacity-40 grayscale-[0.5] border-dashed cursor-default",
                signup.is_absent && "border-red-500/30",
                signup.is_late && "border-amber-500/30"
            )}
            onClick={() => !isReadOnly && !signup.is_absent && !signup.is_late && onToggle()}
        >
            {(signup.is_absent || signup.is_late) && (
                <div
                    className={cn(
                        "absolute inset-0 flex items-center justify-center z-20 transition-all backdrop-blur-[1px]",
                        signup.is_absent ? "bg-red-950/40" : "bg-amber-950/40",
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
                <span className={cn("text-xs font-semibold truncate", classColor)}>{m.character_name}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                {!isReadOnly && (
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
                                title={signup.is_absent ? "Quitar ausencia" : "Marcar como ausente"}
                            >
                                <IconUserOff className="size-3.5" />
                            </Button>
                        </div>
                    </>
                )}
                {isReadOnly && (
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/40 w-20 text-center py-1 bg-muted/20 rounded">
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
    1: "Guerrero", 2: "Paladín", 3: "Cazador", 4: "Pícaro", 5: "Sacerdote", 6: "Caballero de la Muerte", 7: "Chamán", 8: "Mago", 9: "Brujo", 10: "Monje", 11: "Druida", 12: "Cazador de Demonios", 13: "Evocador"
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

function RosterGroup({ title, icon, color, signups, onToggle, onChangeRole, onToggleAbsent, onToggleLate, onResetStatus, isReadOnly, changeRole }: { title: string, icon?: string, color: string, signups: Signup[], onToggle: (id: string) => void, onChangeRole: (id: string) => void, onToggleAbsent: (id: string) => void, onToggleLate: (id: string) => void, onResetStatus: (id: string) => void, isReadOnly: boolean, changeRole: (id: string, role: string) => void }) {
    return (
        <div className="flex flex-col gap-2">
            <h4 className={cn("text-[10px] font-bold uppercase pl-1 flex items-center gap-1", color + "/60")}>
                {icon && <span>{icon}</span>}
                {title}
            </h4>
            {signups.length > 0 ? signups.map(s => (
                <MemberItem
                    key={s.member_id}
                    signup={s}
                    onToggle={() => onToggle(s.member_id)}
                    onChangeRole={() => onChangeRole(s.member_id)}
                    onToggleAbsent={() => onToggleAbsent(s.member_id)}
                    onToggleLate={() => onToggleLate(s.member_id)}
                    onResetStatus={() => onResetStatus(s.member_id)}
                    isReadOnly={isReadOnly}
                    changeRole={changeRole}
                />
            )) : <div className={cn("h-10 border border-dashed rounded-lg flex items-center justify-center text-[10px] font-bold uppercase italic", color + "/10", color + "/30")}>Vacío</div>}
        </div>
    )
}

function BuffsCard({ activeClassIds, className }: { activeClassIds: Set<number>, className?: string }) {
    return (
        <div className={cn("bg-card/50 border border-border/40 rounded-2xl p-6 shadow-sm flex flex-col gap-8", className)}>
            {RAID_BUFFS.map(section => (
                <div key={section.category} className="flex flex-col gap-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 border-b border-border/10 pb-2">
                        {section.category}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                        {section.items.map(buff => {
                            const isPresent = activeClassIds.has(buff.classId)
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
                </div>
            ))}
        </div>
    )
}
