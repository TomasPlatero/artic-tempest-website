"use client"

import { useState } from "react"
import { IconChevronLeft, IconChevronRight, IconCalendarEvent, IconTrash, IconClock, IconPlus } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { GuildEvent } from "./calendar-client"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"

export type EventSignup = {
    member_id: string
    character_name: string
    class_id: number
    role_preference: string
    status: string // present, absent, tentative, late
    selection_status: string // queued, selected
    comment: string | null
}

export function EventDetailClient({
    event,
    signups,
    roleLevel,
}: {
    event: GuildEvent
    signups: EventSignup[]
    roleLevel: string
}) {
    const router = useRouter()
    const isOfficerOrGm = roleLevel === "gm" || roleLevel === "officer"

    const [presence, setPresence] = useState("present")
    const [comment, setComment] = useState("")
    const [isSaving, setIsSaving] = useState(false)

    const handleSavePresence = async () => {
        setIsSaving(true)
        try {
            const res = await fetch("/api/guild/events/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_id: event.id,
                    status: presence,
                    comment: comment,
                    role_preference: "dps"
                })
            })

            if (!res.ok) throw new Error("Failed to save")
            router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const start = new Date(event.event_date)
    const end = new Date(event.end_date)
    const timeStringStart = start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    const timeStringEnd = end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

    const dateString = start.toLocaleDateString("es-ES", { month: "long", day: "numeric" })

    return (
        <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full">
            {/* Top Header */}
            <div className="flex items-center gap-2 text-muted-foreground text-sm cursor-pointer hover:text-foreground w-fit" onClick={() => router.push('/dashboard/calendario')}>
                <IconChevronLeft className="size-4" />
                Bandas - Equipo raider
            </div>

            <div className="flex items-center gap-2 text-2xl font-bold">
                <IconCalendarEvent className="size-6" />
                {dateString} - {event.destination || event.title}
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-8 text-sm font-medium text-emerald-500 hover:text-emerald-400 cursor-pointer w-full sm:w-fit overflow-x-auto pb-1">
                <div className="flex items-center gap-1 shrink-0">
                    <IconChevronLeft className="size-4" />
                    Anterior
                </div>
                <span className="text-muted-foreground hover:text-foreground shrink-0 hidden sm:inline" onClick={() => router.push('/dashboard/calendario')}>Volver al Calendario</span>
                <div role="button" className="sm:hidden text-muted-foreground hover:text-white underline text-xs" onClick={() => router.push('/dashboard/calendario')}>Calendario</div>
                <div className="flex items-center gap-1 shrink-0">
                    Siguiente
                    <IconChevronRight className="size-4" />
                </div>
            </div>

            {/* Main Grid: Left/Center (Planning) + Right (Checklist) */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">

                <div className="flex flex-col gap-6">
                    {/* Top Controls Box */}
                    <div className="bg-[#1e1e24] border border-border/20 rounded-lg p-4 shadow-sm flex flex-col gap-4">

                        {/* Event Settings Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4 items-end text-sm">
                            <div className="flex gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
                                <div className="space-y-1 flex-1">
                                    <label className="text-muted-foreground text-xs">Inicio</label>
                                    <div className="flex items-center bg-muted/20 border border-border/30 rounded px-3 py-1.5 gap-2 h-9">
                                        {timeStringStart} <IconClock className="size-4 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="space-y-1 flex-1">
                                    <label className="text-muted-foreground text-xs">Fin</label>
                                    <div className="flex items-center bg-muted/20 border border-border/30 rounded px-3 py-1.5 gap-2 h-9">
                                        {timeStringEnd} <IconClock className="size-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1 flex-1 min-w-[150px]">
                                <label className="text-muted-foreground text-xs">Destino</label>
                                <Input value={event.destination || event.title} className="h-9 bg-muted/20 border-border/30" readOnly title={event.destination || event.title} />
                            </div>

                            <div className="space-y-1 w-full sm:w-[140px]">
                                <label className="text-muted-foreground text-xs">Dificultad</label>
                                <Select value={event.difficulty?.toLowerCase() || "mythic"} disabled={!isOfficerOrGm}>
                                    <SelectTrigger className="h-9 bg-muted/20 border-border/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mythic">Mítico</SelectItem>
                                        <SelectItem value="heroic">Heroico</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1 w-full sm:w-[140px]">
                                <label className="text-muted-foreground text-xs">Estado</label>
                                <Select value={event.status || "planned"} disabled={!isOfficerOrGm}>
                                    <SelectTrigger className="h-9 bg-muted/20 border-border/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="planned">Planificado</SelectItem>
                                        <SelectItem value="finished">Finalizado</SelectItem>
                                        <SelectItem value="canceled">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="flex items-center gap-2 mb-1.5 mt-auto">
                                    <input type="checkbox" className="size-4 rounded border-gray-300" disabled={!isOfficerOrGm} />
                                    <label className="text-muted-foreground text-xs">Opcional</label>
                                </div>

                                {isOfficerOrGm && (
                                    <Button variant="ghost" size="icon" className="mb-0.5 text-muted-foreground hover:text-destructive shrink-0">
                                        <IconTrash className="size-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="h-px bg-border/30 w-full" />

                        {/* Personal Presence Row */}
                        <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-end text-sm">
                            <div className="space-y-1 w-full sm:w-[160px]">
                                <label className="text-muted-foreground text-xs">Presencia</label>
                                <Select value={presence} onValueChange={setPresence}>
                                    <SelectTrigger className="h-9 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="present">Presente</SelectItem>
                                        <SelectItem value="absent">Ausente</SelectItem>
                                        <SelectItem value="tentative">Tentativo</SelectItem>
                                        <SelectItem value="late">Tarde</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1 flex-1 w-full sm:min-w-[200px]">
                                <label className="text-muted-foreground text-xs">Comentario</label>
                                <Input
                                    placeholder="Comentario"
                                    className="h-9 bg-muted/20 border-border/30"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                            </div>

                            <Button
                                variant="secondary"
                                className="h-9 w-full sm:w-auto bg-muted/50 hover:bg-muted"
                                onClick={handleSavePresence}
                                disabled={isSaving}
                            >
                                {isSaving ? "..." : "Guardar"}
                            </Button>
                        </div>
                    </div>

                    {/* Planning Header */}
                    <div className="flex items-center justify-between border-b-2 border-emerald-500 pb-2">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            Todos los encuentros
                            <span className="text-sm text-muted-foreground font-normal ml-2">
                                {signups.filter(s => s.selection_status === "selected").length} / 20
                            </span>
                        </h2>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-8 bg-[#1e1e24] border-border/30">Importar</Button>
                            <Button variant="outline" size="sm" className="h-8 bg-[#1e1e24] border-border/30">Ver info de planificación</Button>
                        </div>
                    </div>

                    {/* Role Columns Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <RoleColumn title="Tanque" icon="🛡️" signups={signups.filter(s => s.role_preference === "tank")} />
                        <RoleColumn title="Sanador" icon="➕" signups={signups.filter(s => s.role_preference === "heal")} />
                        <RoleColumn title="Melé" icon="⚔️" signups={signups.filter(s => s.role_preference === "melee")} />
                        <RoleColumn title="Distancia" icon="🏹" signups={signups.filter(s => s.role_preference === "ranged")} />
                    </div>

                    {/* Note section */}
                    <div className="bg-[#1e1e24] border border-border/20 rounded-lg p-4 shadow-sm flex justify-between items-center mt-4">
                        <span className="font-semibold text-sm">Strategy / Notes</span>
                        <IconChevronRight className="size-4 text-muted-foreground" />
                    </div>
                </div>

                {/* Right Sidebar: Checklist */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-bold">Resumen</h2>

                    <div className="bg-[#1e1e24] border border-border/20 rounded-lg p-4 shadow-sm flex flex-col gap-2 text-sm">
                        <h3 className="font-semibold border-b border-border/30 pb-2 mb-2">Clases</h3>
                        <ChecklistItem count={0} label="Sacerdote" color="text-white" />
                        <ChecklistItem count={0} label="Mago" color="text-[#3FC7EB]" />
                        <ChecklistItem count={0} label="Brujo" color="text-[#8788EE]" />
                        <ChecklistItem count={0} label="Druida" color="text-[#FF7C0A]" />
                        <ChecklistItem count={0} label="Pícaro" color="text-[#FFF468]" />
                        <ChecklistItem count={0} label="Monje" color="text-[#00FF98]" />
                        <ChecklistItem count={0} label="Cazador de Demonios" color="text-[#A330C9]" />
                        <ChecklistItem count={0} label="Cazador" color="text-[#AAD372]" />
                        <ChecklistItem count={0} label="Chamán" color="text-[#0070DD]" />
                        <ChecklistItem count={0} label="Evocador" color="text-[#33937F]" />
                        <ChecklistItem count={0} label="Caballero de la Muerte" color="text-[#C41E3A]" />
                        <ChecklistItem count={0} label="Paladín" color="text-[#F48CBA]" />
                        <ChecklistItem count={0} label="Guerrero" color="text-[#C69B6D]" />
                    </div>

                    <div className="bg-[#1e1e24] border border-border/20 rounded-lg p-4 shadow-sm flex flex-col gap-2 text-sm">
                        <h3 className="font-semibold border-b border-border/30 pb-2 mb-2">Bufos / Perjuicios</h3>
                        <ChecklistItem count={0} label="5% Intelecto" />
                        <ChecklistItem count={0} label="5% Poder de Ataque" />
                        <ChecklistItem count={0} label="5% Aguante" />
                        <ChecklistItem count={0} label="5% Daño Físico" />
                        <ChecklistItem count={0} label="5% Daño Mágico" />
                        <ChecklistItem count={0} label="Aura de Devoción" />
                        <ChecklistItem count={0} label="3% Versatilidad" />
                        <ChecklistItem count={0} label="3.6% Reducción de Daño" />
                        <ChecklistItem count={0} label="Marca del Cazador" />
                    </div>

                    <div className="bg-[#1e1e24] border border-border/20 rounded-lg p-4 shadow-sm flex flex-col gap-2 text-sm">
                        <h3 className="font-semibold border-b border-border/30 pb-2 mb-2">Utilidad</h3>
                        <ChecklistItem count={0} label="Ansia de Sangre" />
                        <ChecklistItem count={0} label="Resurrección en Combate" />
                        <ChecklistItem count={0} label="Velocidad de Movimiento" />
                        <ChecklistItem count={0} label="Portal de Invocación" />
                        <ChecklistItem count={0} label="Zona de Anti-Magia" />
                        <ChecklistItem count={0} label="Oscuridad" />
                    </div>
                </div>

            </div>
        </div>
    )
}

function RoleColumn({ title, icon, signups }: { title: string, icon: string, signups: EventSignup[] }) {
    const selected = signups.filter(s => s.selection_status === "selected")
    const queued = signups.filter(s => s.selection_status === "queued")

    return (
        <div className="bg-[#1e1e24] border border-border/20 rounded-lg shadow-sm flex flex-col overflow-hidden">
            <div className="flex flex-col items-center justify-center p-3 border-b border-border/20 bg-muted/5">
                <div className="flex items-center gap-2 font-bold text-sm">
                    <span>{icon}</span> {title}
                    <span className="text-muted-foreground font-normal">{selected.length}</span>
                </div>
            </div>

            <div className="p-2 flex flex-col gap-1 text-xs px-3">
                {/* Selected Block */}
                <div className="flex justify-between items-center text-muted-foreground mb-1 mt-1">
                    <span>Seleccionados</span>
                    <IconPlus className="size-3" />
                </div>
                {selected.length === 0 && <div className="h-6" />}
                {selected.map(s => <SignupRow key={s.member_id} signup={s} />)}

                {/* Queued Block */}
                <div className="flex justify-between items-center text-muted-foreground mt-3 mb-1 pt-3 border-t border-border/10">
                    <span>En Cola</span>
                </div>
                {queued.length === 0 && <div className="h-6" />}
                {queued.map(s => <SignupRow key={s.member_id} signup={s} />)}
            </div>
        </div>
    )
}

function SignupRow({ signup }: { signup: EventSignup }) {
    // Mock class colors for text
    const WOW_CLASS_COLORS: Record<number, string> = {
        1: "text-[#C69B6D]", 2: "text-[#F48CBA]", 3: "text-[#AAD372]", 4: "text-[#FFF468]",
        5: "text-white", 6: "text-[#C41E3A]", 7: "text-[#0070DD]", 8: "text-[#3FC7EB]",
        9: "text-[#8788EE]", 10: "text-[#00FF98]", 11: "text-[#FF7C0A]", 12: "text-[#A330C9]", 13: "text-[#33937F]",
    }
    const color = WOW_CLASS_COLORS[signup.class_id] || "text-foreground"

    return (
        <div className="flex items-center justify-between py-1 px-1 hover:bg-muted/10 rounded cursor-pointer">
            <div className="flex items-center gap-2">
                <div className="size-4 rounded-full bg-muted border border-border/50" />
                <span className={cn("font-medium", color)}>{signup.character_name}</span>
            </div>
            <div className="text-emerald-500">✓</div>
        </div>
    )
}

function ChecklistItem({ count, label, color = "text-muted-foreground" }: { count: number, label: string, color?: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-amber-500/80 font-mono text-xs w-4 text-right">{count}x</span>
            <span className={color}>{label}</span>
        </div>
    )
}
