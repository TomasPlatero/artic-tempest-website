"use client"

import { useState } from "react"
import {
    IconDeviceFloppy,
    IconRefreshAlert,
    IconSettings,
    IconCalendarEvent,
    IconClock,
    IconMapPin,
    IconSwords,
    IconCircleCheck,
    IconCircleX
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const DAYS = [
    { id: 1, label: "Lunes", key: "Monday" },
    { id: 2, label: "Martes", key: "Tuesday" },
    { id: 3, label: "Miércoles", key: "Wednesday" },
    { id: 4, label: "Jueves", key: "Thursday" },
    { id: 5, label: "Viernes", key: "Friday" },
    { id: 6, label: "Sábado", key: "Saturday" },
    { id: 7, label: "Domingo", key: "Sunday" }
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

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingDay, setEditingDay] = useState<number | null>(null)
    const [tempConfig, setTempConfig] = useState<any>(null)

    // Initialize state with default or existing data
    const [scheduleState, setScheduleState] = useState(() => {
        return DAYS.map(day => {
            const existing = initialSchedule.find(s => s.day_of_week === day.id)
            if (existing) {
                return {
                    day_of_week: day.id,
                    is_active: existing.is_active,
                    start_time: existing.start_time.substring(0, 5),
                    end_time: existing.end_time.substring(0, 5),
                    destination: existing.destination,
                    difficulty: existing.difficulty,
                }
            }
            return {
                day_of_week: day.id,
                is_active: false,
                start_time: "17:30",
                end_time: "19:30",
                destination: MIDNIGHT_RAIDS[0].name,
                difficulty: "Heroic",
            }
        })
    })

    const openEditModal = (dayId: number) => {
        const config = scheduleState.find(s => s.day_of_week === dayId)
        if (config) {
            setEditingDay(dayId)
            setTempConfig({ ...config })
            setIsModalOpen(true)
        }
    }

    const handleApplyTempConfig = () => {
        if (!tempConfig) return
        setScheduleState(prev => prev.map(day =>
            day.day_of_week === tempConfig.day_of_week ? tempConfig : day
        ))
        setIsModalOpen(false)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const res = await fetch("/api/guild/schedule", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schedule: scheduleState })
            })
            if (!res.ok) throw new Error("Error guardando ajustes")

            setIsSyncing(true)
            await fetch("/api/guild/schedule/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ force: true })
            })

            router.refresh()
            toast.success("Horario Actualizado", { description: "Los ajustes se han guardado y los eventos han sido regenerados." })
        } catch (error: any) {
            console.error(error)
            toast.error("Error", { description: "Hubo un problema: " + error.message })
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
            toast.success("Sincronización Exitosa", { description: data.message || "Calendario actualizado." })
        } catch (error: any) {
            console.error(error)
            toast.error("Error", { description: "Error al generar eventos: " + error.message })
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {scheduleState.map((dayConfig) => {
                    const dayInfo = DAYS.find(d => d.id === dayConfig.day_of_week)
                    const isActive = dayConfig.is_active

                    return (
                        <div key={dayConfig.day_of_week}
                            className={`group relative flex flex-col p-6 rounded-[2rem] border transition-all duration-300 overflow-hidden shadow-xl ring-1 ring-white/5 h-48 justify-between ${isActive ? 'bg-blue-500/5 border-blue-500/20' : 'bg-zinc-950/40 border-white/5 opacity-60'}`}
                        >
                            <div className="flex items-center justify-between z-10">
                                <div className="flex items-center gap-3">
                                    <div className={`size-10 rounded-2xl flex items-center justify-center border transition-all ${isActive ? 'bg-blue-500/20 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/10'}`}>
                                        <IconCalendarEvent className={`size-5 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                                    </div>
                                    <span className={`text-sm font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                                        {dayInfo?.label}
                                    </span>
                                </div>

                                {isActive ? (
                                    <IconCircleCheck className="size-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                ) : (
                                    <IconCircleX className="size-5 text-zinc-700" />
                                )}
                            </div>

                            <div className="mt-4 z-10">
                                {isActive ? (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <IconClock className="size-3 text-white/40" />
                                            <span className="text-xs font-mono font-bold text-white/80">{dayConfig.start_time} - {dayConfig.end_time}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IconMapPin className="size-3 text-white/40" />
                                            <span className="text-[10px] uppercase font-black tracking-wider text-white/60 truncate max-w-[150px]">{dayConfig.destination}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Día de Descanso</span>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute bottom-4 right-4 size-10 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white/60 hover:text-white transition-all shadow-xl active:scale-95 z-20"
                                onClick={() => openEditModal(dayConfig.day_of_week)}
                            >
                                <IconSettings className="size-5" />
                            </Button>

                            {/* Decorative element */}
                            <div className={`absolute -right-4 -bottom-4 size-24 blur-3xl rounded-full transition-all duration-1000 ${isActive ? 'bg-blue-500/10' : 'bg-zinc-800/5'}`} />
                        </div>
                    )
                })}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-zinc-950/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-white/5 mt-8 sticky bottom-4 z-30 mx-2 sm:mx-0">
                <Button
                    variant="outline"
                    className="w-full sm:w-auto h-14 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 text-zinc-400 font-bold uppercase tracking-widest text-[10px] px-8 transition-all active:scale-95"
                    onClick={handleManualSync}
                    disabled={isSyncing || isSaving}
                >
                    <IconRefreshAlert className={`size-4 mr-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Sincronizando...' : 'Refrescar Calendario'}
                </Button>
                <Button
                    className="w-full sm:flex-1 max-w-sm h-14 rounded-2xl bg-primary hover:bg-primary/90 text-zinc-950 font-black uppercase tracking-widest text-[10px] shadow-[0_10px_30px_rgba(var(--primary),0.2)] transition-all active:scale-95"
                    onClick={handleSave}
                    disabled={isSaving || isSyncing}
                >
                    <IconDeviceFloppy className="size-4 mr-3" />
                    {isSaving ? 'Guardando...' : 'Guardar y Generar Eventos'}
                </Button>
            </div>

            {/* Edit Day Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-white rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] p-0 overflow-hidden outline-none">
                    {tempConfig && (
                        <>
                            <DialogHeader className="p-8 pb-4">
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <IconSettings className="size-6 text-primary" />
                                    </div>
                                    Configurar {DAYS.find(d => d.id === tempConfig.day_of_week)?.label}
                                </DialogTitle>
                                <DialogDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2">
                                    Define el horario y destino para este día
                                </DialogDescription>
                            </DialogHeader>

                            <div className="p-8 space-y-8">
                                {/* Activity Toggle */}
                                <div className={`p-6 rounded-3xl border transition-all flex items-center justify-between ${tempConfig.is_active ? 'bg-blue-500/5 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-white/[0.03] border-white/5'}`}>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-[11px] font-black text-white uppercase tracking-wider cursor-pointer">Día de Raid</Label>
                                            <IconCalendarEvent className={`size-4 ${tempConfig.is_active ? 'text-blue-400' : 'text-zinc-600'}`} />
                                        </div>
                                        <span className="text-[9px] text-white/30 font-medium uppercase tracking-tight">Activa este día para generar eventos</span>
                                    </div>
                                    <Switch
                                        checked={tempConfig.is_active}
                                        onCheckedChange={(val) => setTempConfig({ ...tempConfig, is_active: val })}
                                        className="data-[state=checked]:bg-blue-500 scale-110"
                                    />
                                </div>

                                <div className={`space-y-6 transition-all duration-500 ${tempConfig.is_active ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
                                    {/* Hours */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black text-white/30 ml-1 tracking-[0.22em]">Apertura</Label>
                                            <div className="relative">
                                                <input
                                                    type="time"
                                                    value={tempConfig.start_time}
                                                    onChange={(e) => setTempConfig({ ...tempConfig, start_time: e.target.value })}
                                                    className="w-full bg-white/5 border-white/10 h-14 text-sm font-black rounded-2xl px-6 focus:ring-primary/20 transition-all text-white/90"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black text-white/30 ml-1 tracking-[0.22em]">Cierre</Label>
                                            <div className="relative">
                                                <input
                                                    type="time"
                                                    value={tempConfig.end_time}
                                                    onChange={(e) => setTempConfig({ ...tempConfig, end_time: e.target.value })}
                                                    className="w-full bg-white/5 border-white/10 h-14 text-sm font-black rounded-2xl px-6 focus:ring-primary/20 transition-all text-white/90"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Destination */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-black text-white/30 ml-1 tracking-[0.22em]">Destino / Raid</Label>
                                        <Select
                                            value={tempConfig.destination}
                                            onValueChange={(val) => setTempConfig({ ...tempConfig, destination: val })}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-[11px] font-black uppercase tracking-wider text-white">
                                                <IconMapPin className="size-4 text-primary mr-2" />
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-white/10">
                                                {MIDNIGHT_RAIDS.map(raid => (
                                                    <SelectItem key={raid.id} value={raid.name} className="text-[11px] font-bold uppercase tracking-widest py-3">
                                                        {raid.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Difficulty */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-black text-white/30 ml-1 tracking-[0.22em]">Dificultad</Label>
                                        <Select
                                            value={tempConfig.difficulty}
                                            onValueChange={(val) => setTempConfig({ ...tempConfig, difficulty: val })}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-[11px] font-black uppercase tracking-wider text-white">
                                                <IconSwords className="size-4 text-primary mr-2" />
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-white/10">
                                                {DIFFICULTIES.map(diff => (
                                                    <SelectItem key={diff.id} value={diff.id} className="text-[11px] font-bold uppercase tracking-widest py-3">
                                                        {diff.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="p-8 pt-0 flex gap-4 sm:justify-between items-center sm:flex-row flex-col-reverse">
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-auto px-8 bg-white/5 border-white/10 hover:bg-white/10 text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-14 rounded-2xl"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Descartar
                                </Button>
                                <Button
                                    className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] h-14 rounded-2xl shadow-[0_10px_30px_rgba(var(--primary),0.2)] transition-all active:scale-95"
                                    onClick={handleApplyTempConfig}
                                >
                                    Aplicar Configuración
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
