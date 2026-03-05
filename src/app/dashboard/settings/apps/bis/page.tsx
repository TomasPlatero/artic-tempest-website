"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { SiteHeader } from "@/components/layout/site-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, AlertCircle, Database, Terminal, Trash2 } from "lucide-react"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

export default function BisSettingsPage() {
    const [isSyncing, setIsSyncing] = useState(false)
    const [isClearing, setIsClearing] = useState(false)
    const [logs, setLogs] = useState<string[]>([])
    const logsEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll terminal when new logs arrive
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    const handleSync = async () => {
        setIsSyncing(true)
        setLogs(["Iniciando sincronización con Battle.net..."])

        try {
            const res = await fetch("/api/admin/bnet/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tierId: 516 })
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.error || "Error al conectar con el servidor.")
            }

            if (!res.body) throw new Error("No hay respuesta del servidor.")

            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ""

            // Read the SSE chunks
            while (true) {
                const { value, done } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split("\n\n")

                buffer = lines.pop() || "" // Keep incomplete chunks in buffer

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6))

                            if (data.error) {
                                toast.error("Error", { description: data.error })
                                setLogs(prev => [...prev, `[ERROR] ${data.error}`])
                            } else if (data.done) {
                                toast.success("Sincronización completa")
                                setLogs(prev => [...prev, data.message])
                            } else if (data.message) {
                                setLogs(prev => [...prev, data.message])
                            }
                        } catch (e) {
                            console.error("Failed to parse SSE line:", line)
                        }
                    }
                }
            }
        } catch (e: any) {
            toast.error("Error de conexión", { description: e.message })
            setLogs(prev => [...prev, `[ERROR] ${e.message}`])
        } finally {
            setIsSyncing(false)
        }
    }

    const handleClearAllBis = async () => {
        if (!confirm("¿Estás seguro de que quieres BORRAR todas las listas de bises de TODOS los miembros? Esta acción no se puede deshacer.")) {
            return
        }

        setIsClearing(true)
        try {
            const res = await fetch("/api/admin/bis/clear", { method: "POST" })
            if (!res.ok) throw new Error("Error al limpiar las listas.")

            toast.success("Listas limpiadas", { description: "Se han borrado todas las selecciones de BiS." })
            setLogs(prev => [...prev, "=> ELIMINACIÓN MASIVA: Se han borrado todas las listas de bises de la hermandad."])
        } catch (e: any) {
            toast.error("Error", { description: e.message })
        } finally {
            setIsClearing(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8 w-full max-w-full">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings/apps">
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5 border-white/10 shadow-xl transition-all">
                        <IconArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">BiS List — Importar Botín</h1>
                    <p className="text-muted-foreground mt-1">
                        Importa y sincroniza datos de botín directamente desde la API oficial de Battle.net.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
                <div className="md:col-span-5 flex flex-col gap-6">
                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="w-5 h-5 text-blue-400" />
                                Sincronización con Battle.net
                            </CardTitle>
                            <CardDescription>
                                Obtén los datos más recientes de raids, jefes y botín de la expansión actual (Midnight).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button
                                className="w-full mt-2"
                                onClick={handleSync}
                                disabled={isSyncing}
                            >
                                {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Sincronizar Expansión (Midnight)
                            </Button>

                            <div className="mt-4 bg-muted/50 border rounded-lg p-4 flex flex-col gap-1">
                                <div className="flex items-center gap-2 font-medium">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Atención</span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1 ml-6">
                                    Este proceso puede tardar varios minutos ya que descarga cientos de objetos de la API oficial y sus correspondientes iconos. Por favor no cierres la ventana.
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="h-fit border-emerald-500/20 bg-emerald-500/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                                    <Terminal className="w-4 h-4" />
                                </div>
                                Exportar para Addon
                            </CardTitle>
                            <CardDescription>
                                Genera el código de exportación para el addon RCLootCouncil_ArticTempest.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/dashboard/settings/apps/bis/export">
                                <Button variant="outline" className="w-full border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors">
                                    Ir a la página de Exportación
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="h-fit border-red-500/20 bg-red-500/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-500">
                                <Trash2 className="w-5 h-5" />
                                Zona de Peligro
                            </CardTitle>
                            <CardDescription>
                                Acciones que borran datos de la hermandad. Ten cuidado.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="destructive"
                                className="w-full gap-2"
                                onClick={handleClearAllBis}
                                disabled={isClearing}
                            >
                                {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Limpiar Todas las Listas (BiS)
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-7 flex flex-col h-full min-h-[400px] md:h-[600px]">
                    {logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 border border-dashed rounded-xl bg-card/10 text-center p-6">
                            <Database className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                            <h3 className="text-lg font-medium text-foreground">Sistema Listo</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-2">
                                Presiona &quot;Sincronizar Expansión&quot; para iniciar el streaming de datos en tiempo real desde los servidores de Blizzard.
                            </p>
                        </div>
                    ) : (
                        <Card className="flex flex-col flex-1 shadow-2xl overflow-hidden border-zinc-800/80 bg-[#09090b] rounded-xl flex-grow h-[400px] md:h-[600px] relative">
                            <div className="border-b border-zinc-800 bg-[#18181b] relative h-10 w-full shrink-0 flex items-center">
                                <div className="absolute left-4 flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/90 shadow-[0_0_8px_rgba(239,68,68,0.3)]" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/90 shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/90 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                                </div>

                                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none w-max">
                                    <Terminal className="w-4 h-4 text-zinc-500 hidden sm:block" />
                                    <span className="text-xs font-semibold text-zinc-400 tracking-wider">
                                        bash ~ bnet-sync
                                    </span>
                                </div>

                                {isSyncing && (
                                    <span className="absolute right-4 flex items-center gap-2 text-xs text-emerald-400 font-medium tracking-wide">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span className="hidden sm:inline">Sincronizando</span>
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden relative p-1 md:p-2 bg-transparent">
                                <div className="h-full w-full overflow-y-auto px-4 py-3 md:px-5 font-mono text-[13px] leading-relaxed [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-zinc-700/50 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                                    <div className="flex flex-col min-h-full">
                                        {logs.map((log, i) => (
                                            <div
                                                key={i}
                                                className={`
                                                        break-words
                                                        ${log.includes("[ERROR]") ? "text-red-400" : ""}
                                                        ${log.startsWith("=>") ? "text-cyan-400 font-bold mt-4 mb-2" : ""}
                                                        ${log.startsWith("--->") ? "text-fuchsia-400 mt-2 font-medium" : ""}
                                                        ${log.startsWith("----->") ? "text-amber-300" : ""}
                                                        ${log.startsWith("✅") ? "text-emerald-400 font-bold mt-4 text-sm" : ""}
                                                        ${!log.match(/^[=\->\[✅]/) ? "text-zinc-400" : ""}
                                                    `}
                                            >
                                                {log}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
