"use client"

import { useState, useMemo } from "react"
import { IconChevronLeft, IconChevronRight, IconPlus, IconCalendarEvent } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

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
    // We'll also expect a signups count from the backend eventually
    signups_count?: number
    total_spots?: number
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

    // Dialog state
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createDestination, setCreateDestination] = useState("naxx")
    const [createDate, setCreateDate] = useState("")
    const [createDifficulty, setCreateDifficulty] = useState("25")
    const [isSaving, setIsSaving] = useState(false)

    const handleCreateRaid = async () => {
        if (!createDate) {
            toast.error("Please select a date and time")
            return
        }

        setIsSaving(true)
        try {
            const res = await fetch("/api/guild/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    destination: createDestination,
                    event_date: new Date(createDate).toISOString(),
                    end_date: new Date(createDate).toISOString(), // Simplified assumption 
                    difficulty: createDifficulty
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to create raid")

            toast.success("Raid created successfully!")
            setIsCreateOpen(false)
            router.refresh()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setIsSaving(false)
        }
    }

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
        cells.push(<div key={`empty-${i}`} className="min-h-[120px] p-2" />)
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
        const dayEvents = eventsByDay[d] || []

        // Check if it's today
        const now = new Date()
        const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear()

        cells.push(
            <div
                key={`day-${d}`}
                className={cn(
                    "min-h-[120px] p-1 border-t border-r border-border/50 flex flex-col gap-1 relative group transition-colors",
                    isToday && "bg-muted/10"
                )}
            >
                <span className={cn(
                    "text-xs font-semibold self-end mr-1 mb-1 mt-1",
                    isToday ? "text-primary" : "text-muted-foreground"
                )}>
                    {d < 10 ? `0${d}` : d}
                </span>

                {/* Render Events */}
                {dayEvents.map(evt => {
                    const start = new Date(evt.event_date)
                    const end = new Date(evt.end_date)

                    const timeStringStart = start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                    const timeStringEnd = end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

                    // Fallback background color if no image
                    const bgStyle = evt.background_url
                        ? { backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url(${evt.background_url})` }
                        : {}

                    return (
                        <div
                            key={evt.id}
                            onClick={() => router.push(`/dashboard/calendario/${evt.id}`)}
                            className="relative flex flex-col justify-between rounded-md p-1.5 cursor-pointer text-xs text-white overflow-hidden bg-blue-900/60 hover:ring-2 ring-primary/50 transition-all bg-cover bg-center h-[70px]"
                            style={bgStyle}
                        >
                            {/* Top row: Destination title */}
                            <div className="font-semibold text-[10px] leading-tight truncate opacity-90 drop-shadow-md">
                                {evt.destination || evt.title}
                            </div>

                            {/* Time */}
                            <div className="flex justify-between font-mono text-[10px] drop-shadow-md mt-1 font-bold">
                                <span>{timeStringStart}</span>
                                <span>{timeStringEnd}</span>
                            </div>

                            {/* Roster count floating bottom right */}
                            <div className="absolute bottom-1 right-1 font-bold text-xs drop-shadow-lg">
                                32 / 32
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
            cells.push(<div key={`empty-end-${i}`} className="min-h-[120px] p-2 border-t border-border/50" />)
        }
    }

    return (
        <div className="flex flex-col gap-4 bg-background h-full">
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
                {/* Create Button */}
                {isOfficerOrGm && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" size="sm" className="bg-muted/50">
                                Create raid
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-[#1e1e24] border-border/20">
                            <DialogHeader>
                                <DialogTitle>Create New Raid</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 py-4">
                                <Label>Select Destination</Label>
                                <Select value={createDestination} onValueChange={setCreateDestination}>
                                    <SelectTrigger className="bg-[#2b2b36] border-border/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="naxx">Naxxramas</SelectItem>
                                        <SelectItem value="malygos">The Eye of Eternity</SelectItem>
                                        <SelectItem value="sartharion">The Obsidian Sanctum</SelectItem>
                                        <SelectItem value="ulduar">Ulduar</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Label>Date & Time</Label>
                                <Input
                                    type="datetime-local"
                                    className="bg-[#2b2b36] border-border/20"
                                    value={createDate}
                                    onChange={(e) => setCreateDate(e.target.value)}
                                />

                                <Label>Difficulty</Label>
                                <Select value={createDifficulty} onValueChange={setCreateDifficulty}>
                                    <SelectTrigger className="bg-[#2b2b36] border-border/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10 Player</SelectItem>
                                        <SelectItem value="25">25 Player</SelectItem>
                                        <SelectItem value="10hm">10 Player (Heroic)</SelectItem>
                                        <SelectItem value="25hm">25 Player (Heroic)</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button
                                    className="w-full mt-4"
                                    onClick={handleCreateRaid}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Saving..." : "Save Raid"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50 mt-4">
                <Button variant="ghost" size="sm" onClick={prevMonth} className="text-muted-foreground">
                    <IconChevronLeft className="size-4 mr-1" />
                    {month === 0 ? monthNames[11] : monthNames[month - 1]}
                </Button>

                <div className="flex gap-2">
                    {/* Mockup selects to look like wowaudit */}
                    <div className="px-3 py-1 bg-muted/30 rounded text-sm cursor-pointer hover:bg-muted/50 border border-border/50 flex items-center gap-2 font-medium">
                        {monthNames[month]} <IconChevronLeft className="size-3 -rotate-90" />
                    </div>
                    <div className="px-3 py-1 bg-muted/30 rounded text-sm cursor-pointer hover:bg-muted/50 border border-border/50 flex items-center gap-2 font-medium">
                        {year} <IconChevronLeft className="size-3 -rotate-90" />
                    </div>
                </div>

                <Button variant="ghost" size="sm" onClick={nextMonth} className="text-muted-foreground">
                    {month === 11 ? monthNames[0] : monthNames[month + 1]}
                    <IconChevronRight className="size-4 ml-1" />
                </Button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-[#1e1e24]/20 border border-border/30 rounded-lg overflow-hidden flex-1 shadow-sm">
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
