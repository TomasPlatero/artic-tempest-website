"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconBrandTwitch, IconTrash, IconPlus, IconLoader2, IconExternalLink } from "@tabler/icons-react"
import { toast } from "sonner"

export function StreamersSettings() {
    const [streamers, setStreamers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [newStreamer, setNewStreamer] = useState("")
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchStreamers()
    }, [])

    const fetchStreamers = async () => {
        try {
            const res = await fetch("/api/streamers")
            if (!res.ok) throw new Error("Error obteniendo streamers")
            const data = await res.json()
            setStreamers(data)
        } catch (error) {
            console.error(error)
            toast.error("Error al cargar", { description: "No se pudieron obtener los streamers." })
        } finally {
            setLoading(false)
        }
    }

    const handleAddStreamer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newStreamer.trim() || submitting) return

        setSubmitting(true)
        try {
            const res = await fetch("/api/streamers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ twitch_username: newStreamer.trim() })
            })

            if (!res.ok) throw new Error("Error")
            toast.success("Streamer añadido correctamente.")
            setNewStreamer("")
            fetchStreamers()
        } catch (error) {
            toast.error("Error al añadir streamer.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string, username: string) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar a ${username}?`)) return
        try {
            const res = await fetch(`/api/streamers?id=${id}`, { method: "DELETE" })
            if (!res.ok) throw new Error("Error")
            toast.success(`${username} eliminado.`)
            fetchStreamers()
        } catch (error) {
            toast.error("Error al eliminar el streamer.")
        }
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8 max-w-4xl mx-auto w-full">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <IconBrandTwitch className="size-6 text-purple-500" />
                    Twitch Streamers
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Gestiona la lista de creadores de contenido de tu hermandad. Aparecerán listados automáticamente en la web y en la sección Streamers.
                </p>
            </div>

            <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Añadir Streamer</CardTitle>
                    <CardDescription>Introduce el nombre exacto de usuario de Twitch del creador (ej: zatoshi)</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddStreamer} className="flex flex-col sm:flex-row gap-3">
                        <Input
                            placeholder="Nombre de usuario de Twitch..."
                            value={newStreamer}
                            onChange={(e) => setNewStreamer(e.target.value)}
                            className="flex-1 bg-black/20"
                            required
                        />
                        <Button type="submit" disabled={submitting || !newStreamer.trim()} className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white">
                            {submitting ? <IconLoader2 className="mr-2 h-4 w-4 animate-spin" /> : <IconPlus className="mr-2 h-4 w-4" />}
                            Añadir a la hermandad
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Streamers Actuales</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-6 text-muted-foreground">
                            <IconLoader2 className="size-6 animate-spin" />
                        </div>
                    ) : streamers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <IconBrandTwitch className="size-10 mx-auto opacity-20 mb-2" />
                            <p>No hay streamers configurados.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {streamers.map((streamer) => (
                                <div key={streamer.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <IconBrandTwitch className="size-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">{streamer.twitch_username}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-purple-400" asChild>
                                            <a href={`https://twitch.tv/${streamer.twitch_username}`} target="_blank" rel="noreferrer">
                                                <IconExternalLink className="size-4" />
                                            </a>
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                                            onClick={() => handleDelete(streamer.id, streamer.twitch_username)}
                                        >
                                            <IconTrash className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
