"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    IconInbox,
    IconExternalLink,
    IconClock,
    IconCheck,
    IconX,
    IconSearch,
    IconFilter
} from "@tabler/icons-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

const statusConfig: Record<string, { label: string, color: string }> = {
    pending: { label: "Nuevo", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    reviewing: { label: "En Revisión", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    interview: { label: "Charla Pendiente", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    accepted: { label: "Aceptado", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    rejected: { label: "Rechazado", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" }
}

export function RecruitmentInbox({ applications, constants }: { applications: any[], constants: any[] }) {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    const classMap = new Map()
    constants.filter(c => c.category === 'wow_class').forEach(c => {
        classMap.set(Number(c.key), { name: c.value, color: c.metadata?.color })
    })

    const filteredApps = applications.filter(app => {
        const matchesSearch = app.character_name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || app.status === statusFilter
        return matchesSearch && matchesStatus
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-black/20 p-4 rounded-2xl border border-white/5">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                        <Input
                            placeholder="Buscar por nombre..."
                            className="pl-9 bg-zinc-950/50 border-white/10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-48 bg-zinc-950/50 border-white/10">
                            <SelectValue placeholder="Filtrar por estado" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/10 text-white">
                            <SelectItem value="all">Todos los estados</SelectItem>
                            {Object.entries(statusConfig).map(([key, cfg]) => (
                                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <p className="text-xs text-zinc-500 font-medium">
                    Mostrando {filteredApps.length} solicitudes
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {filteredApps.map((app) => {
                    const cls = classMap.get(app.character_class)
                    return (
                        <Card
                            key={app.id}
                            className="bg-zinc-950/30 border-white/5 hover:bg-zinc-900/40 transition-all cursor-pointer group overflow-hidden"
                            onClick={() => router.push(`/dashboard/settings/recruitment/${app.id}`)}
                        >
                            <CardContent className="p-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="relative size-12 rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-lg">
                                            <Image
                                                src={`/assets/images/classes/${app.character_class}.jpg`}
                                                alt="Clase"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg text-white truncate">{app.character_name}</h3>
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/5 bg-white/5">
                                                    <div className={`size-1.5 rounded-full ${app.status === 'pending' ? 'bg-blue-500' :
                                                            app.status === 'reviewing' ? 'bg-purple-500' :
                                                                app.status === 'interview' ? 'bg-amber-500' :
                                                                    app.status === 'accepted' ? 'bg-emerald-500' :
                                                                        app.status === 'rejected' ? 'bg-rose-500' :
                                                                            'bg-zinc-500'
                                                        }`} />
                                                    <span className={`text-[10px] uppercase font-black tracking-tight ${app.status === 'pending' ? 'text-blue-400' :
                                                            app.status === 'reviewing' ? 'text-purple-400' :
                                                                app.status === 'interview' ? 'text-amber-400' :
                                                                    app.status === 'accepted' ? 'text-emerald-400' :
                                                                        app.status === 'rejected' ? 'text-rose-400' :
                                                                            'text-zinc-400'
                                                        }`}>
                                                        {statusConfig[app.status]?.label}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-xs font-medium" style={{ color: cls?.color }}>
                                                {app.character_spec} {cls?.name} · {app.character_realm}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1 text-zinc-500">
                                                <IconClock className="size-3" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                    {new Date(app.created_at).toLocaleDateString("es-ES")}
                                                </span>
                                            </div>
                                            {app.internal_notes && (
                                                <span className="text-[9px] text-blue-400 font-bold uppercase mt-1">✓ Con notas</span>
                                            )}
                                        </div>
                                        <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 border-white/10 bg-white/5 group-hover:bg-blue-500 group-hover:text-white transition-all text-xs">
                                            Ver Detalles
                                            <IconExternalLink className="size-3 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {filteredApps.length === 0 && (
                    <div className="py-20 text-center space-y-4 bg-zinc-950/20 border border-dashed border-white/5 rounded-3xl">
                        <IconInbox className="size-12 text-zinc-700 mx-auto" />
                        <div>
                            <p className="text-zinc-400 font-bold">No hay solicitudes que coincidan</p>
                            <p className="text-xs text-zinc-600 mt-1">Prueba a cambiar los filtros o el término de búsqueda.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
