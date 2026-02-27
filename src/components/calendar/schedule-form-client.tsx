"use client"

import { useState } from "react"
import { IconDeviceFloppy, IconRefreshAlert } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const DAYS = [
    { id: 1, label: "Monday" },
    { id: 2, label: "Tuesday" },
    { id: 3, label: "Wednesday" },
    { id: 4, label: "Thursday" },
    { id: 5, label: "Friday" },
    { id: 6, label: "Saturday" },
    { id: 7, label: "Sunday" }
]

const MIDNIGHT_RAIDS = [
    { id: "voidspire", name: "La Aguja del Vacío" },
    { id: "dreamwell", name: "La Falla del Sueño" },
    { id: "marchonqueldanas", name: "Marcha sobre Quel'Danas" }
]

const DIFFICULTIES = [
    { id: "Normal", name: "Normal (30)" },
    { id: "Heroic", name: "Heroic (30)" },
    { id: "Mythic", name: "Mythic (20)" }
]

export function ScheduleFormClient({ initialSchedule }: { initialSchedule: any[] }) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)

    // Initialize state with default or existing data
    const [scheduleState, setScheduleState] = useState(() => {
        return DAYS.map(day => {
            const existing = initialSchedule.find(s => s.day_of_week === day.id)
            if (existing) {
                // Return exactly as it came, ensuring types are roughly what inputs expect
                return {
                    day_of_week: day.id,
                    is_active: existing.is_active,
                    start_time: existing.start_time.substring(0, 5), // "HH:mm"
                    end_time: existing.end_time.substring(0, 5),     // "HH:mm"
                    destination: existing.destination,
                    difficulty: existing.difficulty,
                }
            }
            return {
                day_of_week: day.id,
                is_active: false,
                start_time: "17:30",
                end_time: "19:30",
                destination: MIDNIGHT_RAIDS[0].id,
                difficulty: "Heroic",
            }
        })
    })

    const handleUpdateDay = (dayId: number, field: string, value: any) => {
        setScheduleState(prev => prev.map(day =>
            day.day_of_week === dayId ? { ...day, [field]: value } : day
        ))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // 1. Save schedule
            const res = await fetch("/api/guild/schedule", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schedule: scheduleState })
            })
            if (!res.ok) throw new Error("Error guardando ajustes")

            // 2. Trigger hard sync
            setIsSyncing(true)
            await fetch("/api/guild/schedule/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ force: true })
            })

            router.refresh()
            toast.success("Guardado", { description: "Ajustes guardados y eventos generados con éxito." })
        } catch (error: any) {
            console.error(error)
            toast.error("Error", { description: "Error al guardar: " + error.message })
        } finally {
            setIsSaving(false)
            setIsSyncing(false)
        }
    }

    const handleManualSync = async () => {
        setIsSyncing(true)
        try {
            const res = await fetch("/api/guild/schedule/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ force: true })
            })
            if (!res.ok) throw new Error("Error sincronizando")

            const data = await res.json()
            router.refresh()
            toast.success("Sincronizado", { description: data.message || "Sincronización completada." })
        } catch (error: any) {
            console.error(error)
            toast.error("Error", { description: "Error al generar eventos: " + error.message })
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <div className="bg-card/50 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-xl text-sm">
            <h2 className="text-xl font-bold font-serif text-white mb-6 border-b border-white/10 pb-4">
                Horario de Raids
            </h2>

            <div className="flex flex-col gap-3 mb-8">
                {/* Headers */}
                <div className="grid grid-cols-12 gap-4 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-2">Día</div>
                    <div className="col-span-2 text-center">Inicio</div>
                    <div className="col-span-2 text-center">Fin</div>
                    <div className="col-span-4">Destino</div>
                    <div className="col-span-2">Dificultad</div>
                </div>

                {/* Rows */}
                {scheduleState.map((dayConfig) => {
                    const dayLabel = DAYS.find(d => d.id === dayConfig.day_of_week)?.label
                    const isActive = dayConfig.is_active

                    return (
                        <div key={dayConfig.day_of_week}
                            className={`grid grid-cols-12 gap-4 items-center p-3 rounded-lg border transition-colors ${isActive ? 'bg-blue-500/10 border-blue-500/30' : 'bg-background/40 border-border/40 opacity-50'}`}
                        >
                            {/* Checkbox and Label */}
                            <div className="col-span-2 flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => handleUpdateDay(dayConfig.day_of_week, 'is_active', e.target.checked)}
                                    className="w-4 h-4 rounded appearance-none border border-white/30 checked:bg-emerald-500 checked:border-emerald-500 cursor-pointer flex items-center justify-center after:content-['✓'] after:text-white after:opacity-0 checked:after:opacity-100 after:text-xs transition-colors shrink-0"
                                />
                                <span className={`font-semibold ${isActive ? 'text-white' : 'text-white/60'}`}>
                                    {dayLabel}
                                </span>
                            </div>

                            {/* Start Time */}
                            <div className="col-span-2 flex justify-center">
                                <input
                                    type="time"
                                    value={dayConfig.start_time}
                                    onChange={(e) => handleUpdateDay(dayConfig.day_of_week, 'start_time', e.target.value)}
                                    disabled={!isActive}
                                    className="bg-black/40 border border-white/10 rounded p-1.5 text-center text-white/90 disabled:opacity-50"
                                    required
                                />
                            </div>

                            {/* End Time */}
                            <div className="col-span-2 flex justify-center">
                                <input
                                    type="time"
                                    value={dayConfig.end_time}
                                    onChange={(e) => handleUpdateDay(dayConfig.day_of_week, 'end_time', e.target.value)}
                                    disabled={!isActive}
                                    className="bg-black/40 border border-white/10 rounded p-1.5 text-center text-white/90 disabled:opacity-50"
                                    required
                                />
                            </div>

                            {/* Destination */}
                            <div className="col-span-4">
                                <Select
                                    disabled={!isActive}
                                    value={dayConfig.destination}
                                    onValueChange={(val) => handleUpdateDay(dayConfig.day_of_week, 'destination', val)}
                                >
                                    <SelectTrigger className="bg-black/40 border-white/10 h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MIDNIGHT_RAIDS.map(raid => (
                                            <SelectItem key={raid.id} value={raid.name}>{raid.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Difficulty */}
                            <div className="col-span-2">
                                <Select
                                    disabled={!isActive}
                                    value={dayConfig.difficulty}
                                    onValueChange={(val) => handleUpdateDay(dayConfig.day_of_week, 'difficulty', val)}
                                >
                                    <SelectTrigger className="bg-black/40 border-white/10 h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DIFFICULTIES.map(diff => (
                                            <SelectItem key={diff.id} value={diff.id}>{diff.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button
                    variant="outline"
                    onClick={handleManualSync}
                    disabled={isSyncing || isSaving}
                >
                    <IconRefreshAlert className={`size-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Sincronizando...' : 'Forzar Sincronización Rápida'}
                </Button>
                <Button
                    variant="glow"
                    onClick={handleSave}
                    disabled={isSaving || isSyncing}
                >
                    <IconDeviceFloppy className="size-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Guardar y Generar Eventos'}
                </Button>
            </div>
        </div>
    )
}
