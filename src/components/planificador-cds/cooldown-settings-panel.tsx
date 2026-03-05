"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { IconTrash, IconDownload, IconRefresh, IconLoader2 } from "@tabler/icons-react"

type CooldownDef = {
    id: string
    name: string
    icon: string
    duration: number
    class_id: number
    ability_type: string
    allowed_specs: number[] | null
    color: string
    spell_id?: number
    category?: string
    active_duration?: number
}

const CLASS_NAMES: Record<number, string> = {
    1: "Warrior", 2: "Paladin", 3: "Hunter", 4: "Rogue", 5: "Priest",
    6: "Death Knight", 7: "Shaman", 8: "Mage", 9: "Warlock", 10: "Monk",
    11: "Druid", 12: "Demon Hunter", 13: "Evoker"
}

const CLASS_COLORS: Record<number, string> = {
    1: "#C69B6D", 2: "#F58CBA", 3: "#AAD372", 4: "#FFF468", 5: "#FFFFFF",
    6: "#C41E3A", 7: "#0070DE", 8: "#3FC7EB", 9: "#8788EE", 10: "#00FF96",
    11: "#FF7D0A", 12: "#A330C9", 13: "#33937F"
}

export function CooldownSettingsPanel() {
    const [cooldowns, setCooldowns] = useState<CooldownDef[]>([])
    const [loading, setLoading] = useState(false)
    const [seeding, setSeeding] = useState(false)
    const [seedProgress, setSeedProgress] = useState<{ progress: number, total: number } | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null)

    const fetchCooldowns = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/cd-planner/cooldowns')
            if (!res.ok) throw new Error("Error al cargar")
            const data = await res.json()
            setCooldowns(data)
        } catch (e: any) {
            setMessage({ text: e.message, type: 'error' })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCooldowns()
    }, [fetchCooldowns])

    const handleSeed = async () => {
        setSeeding(true)
        setSeedProgress({ progress: 0, total: 100 }) // placeholder total
        setMessage({ text: "Conectando para sincronizar...", type: 'info' })
        try {
            const res = await fetch('/api/cd-planner/cooldowns/seed', { method: 'POST' })

            if (!res.ok) {
                const text = await res.text()
                throw new Error(text || "Error HTTP")
            }

            if (!res.body) throw new Error("No ReadableStream body")

            const reader = res.body.getReader()
            const decoder = new TextDecoder()

            let done = false
            while (!done) {
                const { value, done: readerDone } = await reader.read()
                done = readerDone
                if (value) {
                    const chunk = decoder.decode(value)
                    const lines = chunk.split('\n\n')

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = JSON.parse(line.slice(6))

                            if (data.error) throw new Error(data.error)

                            if (data.total) {
                                setSeedProgress({ progress: data.progress || 0, total: data.total })
                            }

                            if (data.message) {
                                setMessage({ text: data.message, type: 'info' })
                            }

                            if (data.status === 'complete') {
                                setMessage({ text: data.message, type: 'success' })
                                fetchCooldowns()
                            }
                        }
                    }
                }
            }
        } catch (e: any) {
            setMessage({ text: e.message, type: 'error' })
        } finally {
            setSeeding(false)
            setSeedProgress(null)
        }
    }


    const handleDeleteAll = async () => {
        if (!confirm("¿Estás seguro? Se eliminarán TODAS las definiciones de cooldown.")) return
        setDeleting(true)
        try {
            const res = await fetch('/api/cd-planner/cooldowns/seed', { method: 'DELETE' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Error al eliminar")
            setMessage({ text: data.message, type: 'success' })
            fetchCooldowns()
        } catch (e: any) {
            setMessage({ text: e.message, type: 'error' })
        } finally {
            setDeleting(false)
        }
    }

    const handleDeleteOne = async (id: string) => {
        try {
            const res = await fetch(`/api/cd-planner/cooldowns/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error("Error al eliminar")
            setCooldowns(prev => prev.filter(c => c.id !== id))
            setMessage({ text: "Habilidad eliminada", type: 'success' })
        } catch (e: any) {
            setMessage({ text: e.message, type: 'error' })
        }
    }

    // Group by class
    const grouped = cooldowns.reduce<Record<number, CooldownDef[]>>((acc, cd) => {
        if (!acc[cd.class_id]) acc[cd.class_id] = []
        acc[cd.class_id].push(cd)
        return acc
    }, {})

    return (
        <div className="space-y-6">
            {/* Header + Actions */}
            <div className="flex flex-col gap-4">
                <div>
                    <h2 className="text-xl font-black tracking-tight">Cooldown Definitions</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gestiona las habilidades disponibles en el planificador de CDs. Importa desde Battle.net o elimínalas.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={handleSeed}
                        disabled={seeding}
                        className="gap-2 relative overflow-hidden"
                    >
                        {seeding && seedProgress && seedProgress.total > 0 && (
                            <div
                                className="absolute inset-0 bg-primary-foreground/10 transition-all duration-300"
                                style={{ width: `${(seedProgress.progress / seedProgress.total) * 100}%` }}
                            />
                        )}
                        {seeding ? <IconLoader2 className="size-4 animate-spin relative z-10" /> : <IconDownload className="size-4 relative z-10" />}
                        <span className="relative z-10">
                            {seeding
                                ? seedProgress && seedProgress.total > 0
                                    ? `Importando ${seedProgress.progress}/${seedProgress.total}`
                                    : "Cargando..."
                                : "Forzar Sync"}
                        </span>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={fetchCooldowns}
                        disabled={loading}
                        className="gap-2"
                    >
                        <IconRefresh className="size-4" />
                        Refrescar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteAll}
                        disabled={deleting || cooldowns.length === 0}
                        className="gap-2"
                    >
                        {deleting ? <IconLoader2 className="size-4 animate-spin" /> : <IconTrash className="size-4" />}
                        Eliminar todo ({cooldowns.length})
                    </Button>
                </div>
            </div>

            {/* Status message */}
            {message && (
                <div className={`px-4 py-3 rounded-lg text-sm font-medium border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                    message.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                        'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-4 text-center">
                    <div className="text-2xl font-black">{cooldowns.length}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-black text-green-500">{cooldowns.filter(c => c.ability_type === 'RAID').length}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Raid CDs</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-black text-blue-500">{cooldowns.filter(c => c.ability_type === 'EXTERNAL').length}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Externals</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-black text-purple-500">{cooldowns.filter(c => c.ability_type === 'UTILITY').length}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Utilidad</div>
                </Card>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {/* Empty state */}
            {!loading && cooldowns.length === 0 && (
                <Card className="p-12 text-center">
                    <div className="text-muted-foreground text-sm">
                        No hay definiciones de cooldown.<br />
                        Pulsa <strong>&quot;Importar desde Battle.net&quot;</strong> para cargar todas las habilidades.
                    </div>
                </Card>
            )}

            {/* Cooldowns grouped by class */}
            {!loading && Object.entries(grouped)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([classIdStr, cds]) => {
                    const classId = Number(classIdStr)
                    const color = CLASS_COLORS[classId] || '#ffffff'
                    return (
                        <Card key={classId} className="overflow-hidden">
                            <div
                                className="px-4 py-2.5 flex items-center gap-2 border-b border-border/20"
                                style={{ borderLeftWidth: '4px', borderLeftColor: color }}
                            >
                                <span className="text-sm font-black uppercase tracking-wider" style={{ color }}>
                                    {CLASS_NAMES[classId] || `Clase ${classId}`}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground ml-auto">
                                    {cds.length} habilidades
                                </span>
                            </div>
                            <div className="divide-y divide-border/10">
                                {cds.map(cd => (
                                    <div key={cd.id} className="flex items-center gap-3 px-4 py-2 hover:bg-white/[0.02] transition-colors group">
                                        <Image
                                            unoptimized
                                            src={cd.icon}
                                            alt={cd.name}
                                            width={28}
                                            height={28}
                                            className="rounded shadow-sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold" style={{ color }}>{cd.name}</div>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                                <span className="px-1.5 py-0.5 rounded bg-white/5 font-bold">{cd.ability_type}</span>
                                                <span>{cd.duration}s CD</span>
                                                {cd.active_duration ? <span>Activo: {cd.active_duration}s</span> : null}
                                                {cd.spell_id && <span className="opacity-50">ID: {cd.spell_id}</span>}
                                                {cd.category && <span className="opacity-50">{cd.category}</span>}
                                                {cd.allowed_specs && <span className="opacity-50">Specs: {cd.allowed_specs.join(', ')}</span>}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                                            onClick={() => handleDeleteOne(cd.id)}
                                        >
                                            <IconTrash className="size-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )
                })
            }
        </div>
    )
}
