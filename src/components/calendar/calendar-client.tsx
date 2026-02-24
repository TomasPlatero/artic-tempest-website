"use client"

import { useState, useMemo, useEffect } from "react"
import { IconChevronLeft, IconChevronRight, IconPlus, IconCalendarEvent } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sileo } from "sileo"

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

export function CalendarClient({
    initialEvents,
    roleLevel,
}: {
    initialEvents: GuildEvent[]
    roleLevel: string
}) {
    const router = useRouter()
    const isOfficerOrGm = roleLevel === "gm" || roleLevel === "officer"

    // Current selected month
    const [currentDate, setCurrentDate] = useState(() => {
        const d = new Date()
        return new Date(d.getFullYear(), d.getMonth(), 1)
    })

    // Calendar math
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    const dayNames = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))

    // Group events by day in the current month
    const eventsByDay = useMemo(() => {
        const map: Record<number, GuildEvent[]> = {}
        initialEvents.forEach(evt => {
            const d = new Date(evt.event_date)
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate()
                if (!map[day]) map[day] = []
                map[day].push(evt)
            }
        })
        return map
    }, [initialEvents, year, month])

    // Build the grid cells
    const cells = []
    // Empty cells for days before the 1st
    for (let i = 1; i < firstDay; i++) {
        cells.push(<div key={`empty-${i}`} className="min-h-[120px] p-2 border-t border-r border-border/50" />)
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
        const dayEvents = eventsByDay[d] || []

        // Check if it's today
        const now = new Date()
        const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear()

        // Format ISO date for the day (at noon to avoid timezone issues when just picking a day)
        const dayDate = new Date(year, month, d, 12, 0, 0)
        const dateStr = dayDate.toISOString().split('T')[0]

        cells.push(
            <div
                key={`day-${d}`}
                onClick={() => {
                    if (isOfficerOrGm) {
                        router.push(`/dashboard/calendario/editor?date=${dateStr}`)
                    }
                }}
                className={cn(
                    "min-h-[120px] p-1 border-t border-r border-border/50 flex flex-col gap-1 relative group transition-colors cursor-pointer hover:bg-muted/5",
                    isToday && "bg-muted/10"
                )}
            >
                <div className="flex justify-between items-start">
                    {isOfficerOrGm && dayEvents.length === 0 && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded border border-primary/30 ml-1 mt-1 font-bold">
                            create
                        </div>
                    )}
                    <span className={cn(
                        "text-xs font-semibold self-end mr-1 mb-1 mt-1 ml-auto",
                        isToday ? "text-primary" : "text-muted-foreground"
                    )}>
                        {d < 10 ? `0${d}` : d}
                    </span>
                </div>

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

                    return (
                        <div
                            key={evt.id}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (isOfficerOrGm) {
                                    router.push(`/dashboard/calendario/editor/${evt.id}`)
                                } else {
                                    router.push(`/dashboard/calendario/${evt.id}`)
                                }
                            }}
                            className="relative flex flex-col justify-between rounded p-2 cursor-pointer text-[10px] text-white overflow-hidden bg-blue-600 hover:ring-2 ring-white transition-all bg-cover bg-center min-h-[60px] border border-white/20 shadow-lg"
                            style={bgStyle}
                        >
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
                })}
            </div>
        )
    }

    // To make the grid nice, pad the end with empty cells to complete the row
    const totalCells = cells.length
    const remainder = totalCells % 7
    if (remainder !== 0) {
        for (let i = 0; i < 7 - remainder; i++) {
            cells.push(<div key={`empty-end-${i}`} className="min-h-[120px] p-2 border-t border-r border-border/50" />)
        }
    }

    return (
        <div className="flex flex-col gap-4 bg-background h-fit mb-8">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between">
                {/* Title */}
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <IconCalendarEvent className="size-6 text-muted-foreground" />
                        Calendar
                    </h1>
                    <p className="text-sm text-muted-foreground">Raids - Team raiders</p>
                </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50 mt-4">
                <Button variant="ghost" size="sm" onClick={prevMonth} className="text-muted-foreground">
                    <IconChevronLeft className="size-4 mr-1" />
                    {month === 0 ? monthNames[11] : monthNames[month - 1]}
                </Button>

                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-muted/30 rounded text-sm cursor-pointer hover:bg-muted/50 border border-border/50 flex items-center gap-2 font-medium">
                        {monthNames[month]} <IconChevronLeft className="size-3 -rotate-90" />
                    </div>
                    <div className="px-3 py-1 bg-muted/30 rounded text-sm cursor-pointer hover:bg-muted/50 border border-border/50 flex items-center gap-2 font-medium">
                        {year} <IconChevronLeft className="size-3 -rotate-90" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={nextMonth} className="text-muted-foreground">
                        {month === 11 ? monthNames[0] : monthNames[month + 1]}
                        <IconChevronRight className="size-4 ml-1" />
                    </Button>
                    {/* No settings button here, moved to Apps hub */}
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-[#1e1e24]/20 border-l border-b border-border/30 rounded-lg overflow-hidden h-fit shadow-sm">
                {/* Days of week header */}
                <div className="grid grid-cols-7 border-b border-border/50">
                    {dayNames.map(d => (
                        <div key={d} className="text-center py-2 text-xs font-semibold text-muted-foreground">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 border-l border-border/50">
                    {cells}
                </div>
            </div>
        </div>
    )
}
