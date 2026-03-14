"use client"

import { useState, useMemo, useEffect } from "react"
import { IconChevronLeft, IconChevronRight, IconChevronDown, IconCalendarEvent, IconLayoutGrid, IconList, IconRefresh, IconArrowLeft, IconCalendar, IconClock, IconTrash, IconDeviceFloppy, IconTimeline, IconClipboardText } from "@tabler/icons-react"
import { Button } from "@/shared/ui/button"
import { useRouter } from "next/navigation"
import { cn } from "@/shared/tailwind/tailwind-utils"
import { toast } from "sonner"
import Image from "next/image"
import { DndContext, useDraggable, useDroppable, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"


export type GuildEvent = {
    id: string
    title: string
    description: string | null
    event_date: string
    end_date: string
    event_type: string
    destination: string | null
    difficulty: string | null
    status: string
    background_url: string | null
    event_signups?: any[]
}

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
    // 0 = Sunday, 1 = Monday. We want Monday=1, Sunday=7 for European calendars
    const day = new Date(year, month, 1).getDay()
    return day === 0 ? 7 : day
}

// --- DND COMPONENTS ---

function DraggableEvent({ evt, canEdit, month, onClick, isPast, isInProgress, bgStyle, selectedCount, maxActive, timeStringStart, timeStringEnd }: {
    evt: GuildEvent,
    canEdit: boolean,
    month: number,
    onClick: (e: React.MouseEvent) => void,
    isPast: boolean,
    isInProgress: boolean,
    bgStyle: any,
    selectedCount: number,
    maxActive: number,
    timeStringStart: string,
    timeStringEnd: string
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: evt.id,
        disabled: !canEdit || isPast,
        data: evt
    })

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
    } : undefined

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, ...bgStyle }}
            {...listeners}
            {...attributes}
            onClick={onClick}
        className={cn(
            "relative flex flex-col justify-between rounded-xl p-2.5 cursor-pointer text-[10px] text-white overflow-hidden transition-all duration-300 bg-cover bg-center min-h-[70px] border border-white/10 hover:border-white/30 shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 group/event touch-none",
            isDragging && "opacity-50 ring-2 ring-primary scale-95 rotate-1 shadow-2xl z-50",
            isPast ? "opacity-50 grayscale-0 brightness-[0.7] hover:brightness-100 transition-all" :
                isInProgress ? "ring-2 ring-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-blue-600/40 backdrop-blur-md"
        )}
        >
            {isPast && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-[1px]">
                    <span className="text-[14px] font-black uppercase tracking-[0.4em] -rotate-6 text-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                        Finalizado
                    </span>
                </div>
            )}
            {isInProgress && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-emerald-500/20 backdrop-blur-[0.5px]">
                    <span className="text-[13px] font-black uppercase tracking-[0.3em] -rotate-12 text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.8)] animate-pulse">
                        En curso
                    </span>
                </div>
            )}
            <div className="flex justify-between items-start">
                <div className="font-bold truncate drop-shadow-md flex-1">
                    {evt.destination || evt.title}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    <div className="bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold border border-white/10 shadow-sm">
                        <span className={selectedCount >= maxActive ? "text-red-400" : "text-emerald-400"}>{selectedCount}</span> / <span className="text-white/80">{maxActive}</span>
                    </div>
                    {evt.difficulty && (
                        <div className="bg-primary/40 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold border border-primary/20 shadow-sm uppercase">
                            {evt.difficulty.split(' ')[0]}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between font-mono font-bold text-[9px] mt-auto pt-2 drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                <span className="text-amber-300">{timeStringStart}</span>
                <span className="text-white/60">{timeStringEnd}</span>
            </div>
        </div>
    )
}

function DroppableDay({ dateStr, d, isToday, canEdit, dayEvents, children, onClick }: {
    dateStr: string,
    d: number,
    isToday: boolean,
    canEdit: boolean,
    dayEvents: GuildEvent[],
    children: React.ReactNode,
    onClick: () => void
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: dateStr,
        data: { date: dateStr }
    })

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={cn(
            "min-h-[140px] min-w-[120px] p-2 border-t border-r border-white/5 flex flex-col gap-1.5 relative group transition-all cursor-pointer",
            isToday ? "bg-blue-500/[0.03]" : "hover:bg-white/[0.02]",
            isOver && "bg-blue-500/10 ring-1 ring-blue-500/30 z-10"
        )}
        >
            <div className="flex justify-between items-start">
                {canEdit && dayEvents.length === 0 && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded border border-primary/30 ml-1 mt-1 font-bold lowercase">
                        crear
                    </div>
                )}
                <span className={cn(
                    "text-[11px] font-black tracking-tighter self-end mr-1.5 mb-1.5 mt-1.5 ml-auto transition-colors",
                    isToday ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" : "text-zinc-500 group-hover:text-zinc-300"
                )}>
                    {d < 10 ? `0${d}` : d}
                </span>
            </div>
            {children}
        </div>
    )
}

// --- MAIN COMPONENT ---

export function CalendarClient({
    initialEvents,
    canEdit,
}: {
    initialEvents: GuildEvent[]
    canEdit: boolean
}) {
    const router = useRouter()

    const [events, setEvents] = useState<GuildEvent[]>(initialEvents)
    const [isUpdating, setIsUpdating] = useState(false)

    // Current selected month
    const [currentDate, setCurrentDate] = useState(() => {
        const d = new Date()
        return new Date(d.getFullYear(), d.getMonth(), 1)
    })

    const [viewMode, setViewMode] = useState<"grid" | "list">("list")
    const [mounted, setMounted] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    // Detect mobile for default view on mount
    useEffect(() => {
        setMounted(true)
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setViewMode("grid")
            } else {
                setViewMode("list")
            }
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    useEffect(() => {
        setEvents(initialEvents)
    }, [initialEvents])

    // Calendar math
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]
    const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || !canEdit) return

        const activeEvent = active.data.current as GuildEvent
        const targetDateStr = over.id as string // format YYYY-MM-DD

        // If dropped on the same day, do nothing
        if (activeEvent.event_date.startsWith(targetDateStr)) return

        try {
            setIsUpdating(true)
            const toastId = toast.loading("Actualizando evento...")

            // Calculate new dates
            const originalStart = new Date(activeEvent.event_date)
            const originalEnd = new Date(activeEvent.end_date)
            const durationMs = originalEnd.getTime() - originalStart.getTime()

            // New start date needs to preserve original time
            const [y, m, d] = targetDateStr.split('-').map(Number)
            const newStart = new Date(y, m - 1, d, originalStart.getHours(), originalStart.getMinutes())
            const newEnd = new Date(newStart.getTime() + durationMs)

            // Optimistic update
            const updatedEvent = {
                ...activeEvent,
                event_date: newStart.toISOString(),
                end_date: newEnd.toISOString()
            }
            setEvents(prev => prev.map(e => e.id === activeEvent.id ? updatedEvent : e))

            const res = await fetch(`/api/guild/events/${activeEvent.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_date: newStart.toISOString(),
                    end_date: newEnd.toISOString()
                })
            })

            if (!res.ok) throw new Error("Error al mover el evento")

            toast.success("Evento movido", { id: toastId })
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Error al mover el evento")
            setEvents(initialEvents) // Rollback
        } finally {
            setIsUpdating(false)
        }
    }

    // Group events by day in the current month
    const eventsByDay = useMemo(() => {
        const map: Record<number, GuildEvent[]> = {}
        events.forEach(evt => {
            const d = new Date(evt.event_date)
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate()
                if (!map[day]) map[day] = []
                map[day].push(evt)
            }
        })
        return map
    }, [events, year, month])

    // Build the grid cells
    const cells = []
    // Empty cells for days before the 1st
    for (let i = 1; i < firstDay; i++) {
        cells.push(<div key={`empty-${i}`} className="min-h-[140px] p-2 border-t border-r border-white/5 bg-black/10 opacity-40" />)
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
        const dayEvents = eventsByDay[d] || []

        // Check if it's today
        const now = new Date()
        const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear()

        // Format ISO date for the day (using year, month, d)
        // We use YYYY-MM-DD format as the ID
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

        cells.push(
            <DroppableDay
                key={`day-${d}`}
                dateStr={dateStr}
                d={d}
                isToday={isToday}
                canEdit={canEdit}
                dayEvents={dayEvents}
                onClick={() => {
                    if (canEdit) {
                        router.push(`/dashboard/calendario/editor?date=${dateStr}`)
                    }
                }}
            >
                {/* Render Events */}
                {dayEvents.map(evt => {
                    const start = new Date(evt.event_date)
                    const end = new Date(evt.end_date)

                    const timeStringStart = start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                    const timeStringEnd = end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

                    const bgStyle = evt.background_url
                        ? { backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.8) 100%), url(${evt.background_url})` }
                        : {}

                    // Calculate participants and bounds
                    const signups = evt.event_signups || []
                    const selectedCount = signups.filter((s: any) => s.selection_status === 'selected').length
                    const diffGroups = (evt.difficulty || "").match(/\((\d+)\)/)
                    const maxActive = diffGroups ? parseInt(diffGroups[1], 10) : 30

                    const eventStart = new Date(evt.event_date)
                    const eventEnd = new Date(evt.end_date || evt.event_date)
                    const isPast = eventEnd < now
                    const isInProgress = now >= eventStart && now <= eventEnd

                    return (
                        <DraggableEvent
                            key={evt.id}
                            evt={evt}
                            canEdit={canEdit}
                            month={month}
                            isPast={isPast}
                            isInProgress={isInProgress}
                            bgStyle={bgStyle}
                            selectedCount={selectedCount}
                            maxActive={maxActive}
                            timeStringStart={timeStringStart}
                            timeStringEnd={timeStringEnd}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (canEdit) {
                                    router.push(`/dashboard/calendario/editor/${evt.id}`)
                                } else {
                                    router.push(`/dashboard/calendario/${evt.id}`)
                                }
                            }}
                        />
                    )
                })}
            </DroppableDay>
        )
    }

    // To make the grid nice, pad the end with empty cells to complete the row
    const totalCells = cells.length
    const remainder = totalCells % 7
    if (remainder !== 0) {
        for (let i = 0; i < 7 - remainder; i++) {
            cells.push(<div key={`empty-end-${i}`} className="min-h-[140px] p-2 border-t border-r border-white/5 bg-black/10 opacity-40" />)
        }
    }

    // Get flat list of events for the month (Agenda View)
    const sortedEvents = useMemo(() => {
        return Object.keys(eventsByDay)
            .map(Number)
            .sort((a, b) => a - b)
            .flatMap(day => eventsByDay[day])
    }, [eventsByDay])

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className={cn("flex flex-col gap-6 h-fit mb-8 transition-opacity duration-300", isUpdating && "opacity-60 pointer-events-none")}>
                {/* Header Toolbar */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white uppercase">
                            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                              <IconCalendar className="size-6 text-blue-400" />
                            </div>
                            Calendario
                        </h1>
                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.2em] ml-1">Bandas - Equipo raider</p>
                    </div>

                    {/* Officer Actions */}
                    {canEdit && (
                        <div className="flex bg-muted/20 p-1 rounded-lg border border-border/40">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground border border-border/20"
                                onClick={() => {
                                    router.refresh()
                                    toast.success("Calendario Refrescado", { description: "Sincronizando eventos con el servidor..." })
                                }}
                            >
                                <IconRefresh className="size-4" />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between py-4 mt-2 gap-4">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={prevMonth} 
                        className="text-zinc-500 hover:text-white hover:bg-white/[0.05] rounded-xl px-4 font-bold uppercase tracking-widest text-[10px]"
                    >
                        <IconChevronLeft className="size-4 mr-2" />
                        {month === 0 ? monthNames[11] : monthNames[month - 1]}
                    </Button>
    
                    <div className="flex gap-3">
                        <div className="px-5 py-2 bg-white/[0.03] backdrop-blur-md rounded-xl text-xs border border-white/[0.05] flex items-center gap-3 font-bold uppercase tracking-widest text-white hover:bg-white/[0.06] transition-all cursor-pointer">
                            {monthNames[month]} <IconChevronDown className="size-3 text-zinc-500" />
                        </div>
                        <div className="px-5 py-2 bg-white/[0.03] backdrop-blur-md rounded-xl text-xs border border-white/[0.05] flex items-center gap-3 font-bold uppercase tracking-widest text-white hover:bg-white/[0.06] transition-all cursor-pointer">
                            {year} <IconChevronDown className="size-3 text-zinc-500" />
                        </div>
                    </div>
    
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={nextMonth} 
                        className="text-zinc-500 hover:text-white hover:bg-white/[0.05] rounded-xl px-4 font-bold uppercase tracking-widest text-[10px]"
                    >
                        {month === 11 ? monthNames[0] : monthNames[month + 1]}
                        <IconChevronRight className="size-4 ml-2" />
                    </Button>
                </div>

                {/* Calendar View Area */}
                {viewMode === "grid" ? (
                    <div className="bg-white/[0.01] backdrop-blur-3xl border border-white/[0.05] rounded-2xl overflow-hidden shadow-2xl">
                        <div className="min-w-[800px] w-full">
                            <div className="grid grid-cols-7 border-b border-white/[0.05] bg-white/[0.02]">
                                {dayNames.map(d => (
                                    <div key={d} className="text-center py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                        {d}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 border-l border-white/[0.05]">
                                {cells}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {sortedEvents.length > 0 ? (
                            sortedEvents.map(evt => {
                                const date = new Date(evt.event_date)
                                const isToday = new Date().toDateString() === date.toDateString()
                                const dayNum = date.getDate()

                                const signups = evt.event_signups || []
                                const selectedCount = signups.filter((s: any) => s.selection_status === 'selected').length
                                const diffGroups = (evt.difficulty || "").match(/\((\d+)\)/)
                                const maxActive = diffGroups ? parseInt(diffGroups[1], 10) : 30

                                const now = new Date()
                                const eventStart = new Date(evt.event_date)
                                const eventEnd = new Date(evt.end_date || evt.event_date)
                                const isPast = eventEnd < now
                                const isInProgress = now >= eventStart && now <= eventEnd

                                return (
                                    <div
                                        key={evt.id}
                                        onClick={() => {
                                            if (canEdit) {
                                                router.push(`/dashboard/calendario/editor/${evt.id}`)
                                            } else {
                                                router.push(`/dashboard/calendario/${evt.id}`)
                                            }
                                        }}
                                        className={cn(
                                            "group relative flex items-center gap-4 rounded-xl border border-border/40 p-4 hover:bg-muted/5 transition-all cursor-pointer overflow-hidden bg-[#1e1e24]/10",
                                            isToday && !isInProgress && "ring-1 ring-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(59,130,246,0.05)]",
                                            isInProgress && "ring-2 ring-emerald-500/50 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
                                            isPast && "opacity-70 grayscale-[0.3]"
                                        )}
                                    >
                                        {/* Date Column */}
                                        <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-border/50 pr-4">
                                            <span className="text-2xl font-black text-foreground/90">{dayNum < 10 ? `0${dayNum}` : dayNum}</span>
                                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{monthNames[month].substring(0, 3)}</span>
                                        </div>

                                        {/* Event Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                                                        {evt.destination || evt.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        {evt.difficulty && (
                                                            <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-primary/20">
                                                                {evt.difficulty}
                                                            </span>
                                                        )}
                                                        {isInProgress ? (
                                                            <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase border border-emerald-400/30 animate-pulse flex items-center gap-1">
                                                                <div className="size-1 bg-white rounded-full animate-ping" />
                                                                En curso
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground font-medium">
                                                                {date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-bold border border-border/60 shadow-sm flex items-center gap-1.5">
                                                        <span className={selectedCount >= maxActive ? "text-red-400" : "text-emerald-400"}>{selectedCount}</span>
                                                        <span className="text-muted-foreground/50 font-normal text-xs">/</span>
                                                        <span className="text-foreground/60">{maxActive}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Background Decor */}
                                        {evt.background_url && (
                                            <div
                                                className="absolute inset-0 -z-10 opacity-[0.08] group-hover:opacity-[0.12] transition-opacity bg-cover bg-center"
                                                style={{ backgroundImage: `url(${evt.background_url})` }}
                                            />
                                        )}

                                        {isInProgress && (
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl -z-10 animate-pulse" />
                                        )}

                                        <IconChevronRight className="size-5 text-muted-foreground/30 group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1" />
                                        {isPast && (
                                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/20 pointer-events-none">
                                                <span className="text-[18px] md:text-[24px] font-black uppercase tracking-[0.5em] -rotate-3 text-amber-500/40 select-none">
                                                    Finalizado
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-muted/5 rounded-2xl border border-dashed border-border/60">
                                <IconCalendarEvent className="size-12 text-muted-foreground/20 mb-3" />
                                <p className="text-muted-foreground font-medium">No hay eventos programados para este mes</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DndContext>
    )
}
