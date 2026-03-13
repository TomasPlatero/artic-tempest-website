"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { toast } from "sonner"
import Image from "next/image"

export function SpotsManager({ initialSpots, constants }: any) {
    const [spots, setSpots] = useState(initialSpots)

    const classes = constants.filter((c: any) => c.category === 'wow_class')

    const handleUrgencyChange = async (classId: string, specName: string, newUrgency: string) => {
        try {
            const res = await fetch("/api/recruitment/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "spot",
                    data: { class_id: classId, spec_name: specName, urgency: newUrgency }
                })
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Error al actualizar")

            setSpots((prev: any[]) => {
                const existing = prev.find(s => s.class_id === classId && s.spec_name === specName)
                if (existing) {
                    return prev.map(s => s.id === result.id ? result : s)
                }
                return [...prev, result]
            })

            toast.success(`Prioridad de ${specName} actualizada`)
        } catch (error: any) {
            console.error("Error updating spot:", error)
            toast.error("Error al actualizar vacante", {
                description: error.message || "Error desconocido"
            })
        }
    }

    const urgencyThemes: Record<string, string> = {
        high: "border-rose-500/50 text-rose-500 bg-rose-500/10",
        medium: "border-amber-500/50 text-amber-500 bg-amber-500/10",
        low: "border-blue-500/50 text-blue-500 bg-blue-500/10",
        closed: "border-zinc-500/50 text-zinc-500 bg-zinc-500/10"
    }

    return (
        <div className="space-y-6">
            <Card className="bg-card/40 border-border/40">
                <CardHeader>
                    <CardTitle>Vacantes actuales</CardTitle>
                    <CardDescription>
                        Define la urgencia de reclutamiento para cada especialización. Los cambios se reflejan al instante en la web pública.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                {classes.sort((a: any, b: any) => Number(a.key) - Number(b.key)).map((cls: any) => {
                    const classConfigs = spots.filter((s: any) => s.class_id === cls.key)

                    const CLASS_SPECS_MAP: Record<string, string[]> = {
                        "1": ["Armas", "Furia", "Protección"],
                        "2": ["Sagrado", "Protección", "Reprensión"],
                        "3": ["Bestias", "Puntería", "Supervivencia"],
                        "4": ["Asesinato", "Forajido", "Sutileza"],
                        "5": ["Disciplina", "Sagrado", "Sombra"],
                        "6": ["Sangre", "Escarcha", "Profano"],
                        "7": ["Elemental", "Mejora", "Restauración"],
                        "8": ["Arcano", "Fuego", "Escarcha"],
                        "9": ["Aflicción", "Demonología", "Destrucción"],
                        "10": ["Maestro cervecero", "Tejedor de niebla", "Viajero del viento"],
                        "11": ["Equilibrio", "Feral", "Guardián", "Restauración"],
                        "12": ["Devastación", "Venganza", "Devorador"],
                        "13": ["Aumento", "Devastación", "Preservación"]
                    }

                    const classSpecs = CLASS_SPECS_MAP[cls.key] || []

                    return (
                        <Card key={cls.key} className="bg-card/40 border-border/40 overflow-hidden shadow-xl hover:shadow-primary/5 transition-all duration-500 group pt-0">
                            <CardHeader className="p-6 border-b border-border/40 flex flex-row items-center gap-3 bg-muted/20">
                                <div className="relative size-10 rounded shadow-inner overflow-hidden border border-white/10 group-hover:scale-110 transition-transform">
                                    <Image src={`/assets/images/classes/${cls.key}.jpg`} alt={cls.value} fill className="object-cover" />
                                </div>
                                <CardTitle className="text-lg font-black uppercase tracking-tighter" style={{ color: cls.metadata?.color }}>
                                    {cls.value}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/20">
                                    {classSpecs.map((specName: string) => {
                                        const spot = classConfigs.find((s: any) => s.spec_name === specName)
                                        const currentUrgency = spot?.urgency || "closed"

                                        return (
                                            <div key={specName} className="flex items-center justify-between p-3.5 px-4 group hover:bg-white/5 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] font-bold text-white leading-tight">{specName}</span>
                                                    {specName === 'Devorador' && (
                                                        <span className="text-[9px] text-blue-400 uppercase font-black tracking-tighter">
                                                            🌌 Midnight
                                                        </span>
                                                    )}
                                                </div>
                                                <Select
                                                    value={currentUrgency}
                                                    onValueChange={(val) => handleUrgencyChange(cls.key, specName, val)}
                                                >
                                                    <SelectTrigger className={`w-[130px] h-9 text-[11px] uppercase font-black border-none transition-all px-3 ${urgencyThemes[currentUrgency]}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                                        <SelectItem value="high" className="font-bold text-red-500">🔴 ALTA</SelectItem>
                                                        <SelectItem value="medium" className="font-bold text-amber-500">🟡 MEDIA</SelectItem>
                                                        <SelectItem value="low" className="font-bold text-blue-500">🔵 BAJA</SelectItem>
                                                        <SelectItem value="closed" className="font-bold text-zinc-500">🔒 CERRADO</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
