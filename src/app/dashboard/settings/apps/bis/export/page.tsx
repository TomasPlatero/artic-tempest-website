"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Copy, Check, Terminal, Database, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function BisExportPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [exportData, setExportData] = useState<any>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const fetchExport = async () => {
            try {
                const res = await fetch("/api/bis/export")
                if (!res.ok) throw new Error("Error al obtener datos")
                const data = await res.json()
                setExportData(data)
            } catch (e: any) {
                toast.error("Error", { description: e.message })
            } finally {
                setIsLoading(false)
            }
        }
        fetchExport()
    }, [])

    const handleCopy = () => {
        if (!exportData) return
        navigator.clipboard.writeText(JSON.stringify(exportData))
        setCopied(true)
        toast.success("Copiado al portapapeles")
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8 w-full max-w-full">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings/apps/bis">
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5 border-white/10 shadow-xl transition-all">
                        <IconArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Exportar para Addon</h1>
                    <p className="text-muted-foreground mt-1">
                        Copia los datos de BiS para importarlos en RCLootCouncil_ArticTempest.
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-emerald-500">Paso 1</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                Haz clic en el botón inferior para copiar el código JSON generado automáticamente.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-blue-500">Paso 2</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                Abre World of Warcraft y accede a la configuración de <strong>RCLootCouncil_ArticTempest</strong>.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-purple-500">Paso 3</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                Pega el código en la sección de &quot;Importar BiS&quot; y presiona el botón de confirmación.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="export-code" className="border-emerald-500/20 bg-emerald-500/5 rounded-xl px-6 border">
                        <AccordionTrigger className="hover:no-underline py-6">
                            <div className="flex items-center gap-3 text-left">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                    <Terminal className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-emerald-500">Código de Exportación</h3>
                                    <p className="text-sm text-emerald-500/60 font-normal">Clic para desplegar el formato JSON para el addon.</p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6 pt-2 border-t border-emerald-500/10">
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleCopy}
                                        disabled={isLoading || !exportData}
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"
                                    >
                                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                        {copied ? "Copiado" : "Copiar a Portapapeles"}
                                    </Button>
                                </div>
                                <div className="relative group rounded-xl overflow-hidden border border-emerald-500/10 bg-black/40">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
                                    <pre className="p-6 font-mono text-[13px] leading-relaxed overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-emerald-500/20">
                                        {isLoading ? (
                                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                                <p className="text-emerald-500/60 font-medium">Generando...</p>
                                            </div>
                                        ) : exportData ? (
                                            <code className="text-emerald-400">
                                                {JSON.stringify(exportData, null, 4)}
                                            </code>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                                <Database className="w-8 h-8 text-muted-foreground opacity-20" />
                                                <p className="text-muted-foreground">Sin datos.</p>
                                            </div>
                                        )}
                                    </pre>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    )
}
