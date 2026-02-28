"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    IconUser,
    IconCalendar,
    IconExternalLink,
    IconSearch,
    IconFilter
} from "@tabler/icons-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"

export function RecruitmentListClient({ initialApplications, classConstants }: any) {
    const router = useRouter()
    const [search, setSearch] = useState("")

    const classMap = new Map()
    classConstants.forEach((c: any) => classMap.set(Number(c.key), { name: c.value, color: c.metadata?.color }))

    const filtered = initialApplications.filter((app: any) =>
        app.character_name.toLowerCase().includes(search.toLowerCase()) ||
        app.character_realm.toLowerCase().includes(search.toLowerCase())
    )

    const statusColors: Record<string, string> = {
        pending: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        reviewing: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        interview: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        accepted: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        rejected: "bg-rose-500/10 text-rose-500 border-rose-500/20"
    }

    const statusLabels: Record<string, string> = {
        pending: "Nuevo",
        reviewing: "En Revisión",
        interview: "Charla Pendiente",
        accepted: "Aceptado",
        rejected: "Rechazado"
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 bg-card/40 border border-border/40 p-4 rounded-xl backdrop-blur-sm">
                <div className="relative flex-1">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o reino..."
                        className="pl-9 bg-black/20 border-border/40"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="gap-2 border-border/40">
                    <IconFilter className="size-4" />
                    Filtros
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {filtered.map((app: any) => {
                    const cls = classMap.get(app.character_class)
                    return (
                        <Card
                            key={app.id}
                            className="bg-card/40 border-border/40 hover:border-primary/40 transition-all cursor-pointer group group"
                            onClick={() => router.push(`/dashboard/recruitment/${app.id}`)}
                        >
                            <CardContent className="p-4 flex items-center justify-between gap-6">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="relative size-12 rounded-lg overflow-hidden border border-white/5 shadow-xl">
                                        <Image
                                            src={`/assets/images/classes/${app.character_class}.jpg`}
                                            alt="Clase" fill className="object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                                                {app.character_name}
                                            </span>
                                            <Badge variant="outline" className={`text-[10px] uppercase font-bold py-0 h-5 ${statusColors[app.status]}`}>
                                                {statusLabels[app.status]}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                            <span style={{ color: cls?.color }}>{app.character_spec} {cls?.name}</span>
                                            <span>•</span>
                                            <span>{app.character_realm}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden md:flex flex-col items-end gap-1 text-right">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <IconCalendar className="size-3.5" />
                                        {new Date(app.created_at).toLocaleDateString("es-ES", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-tighter">
                                            RIO: ???
                                        </div>
                                        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-tighter">
                                            WCL: ???
                                        </div>
                                    </div>
                                </div>

                                <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                                    <IconExternalLink className="size-5 text-muted-foreground" />
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}

                {filtered.length === 0 && (
                    <div className="py-20 text-center text-muted-foreground border border-dashed border-border/40 rounded-2xl">
                        No se encontraron aplicaciones.
                    </div>
                )}
            </div>
        </div>
    )
}
