"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPlus, IconTrash, IconGripVertical, IconDeviceFloppy } from "@tabler/icons-react"
import { toast } from "sonner"

export function FormBuilder({ initialQuestions }: any) {
    const [questions, setQuestions] = useState(initialQuestions)
    const [saving, setSaving] = useState<string | null>(null)

    const addQuestion = () => {
        const newQ = {
            id: `temp-${Date.now()}`,
            label: "Nueva Pregunta",
            type: "text",
            is_required: true,
            order_index: questions.length,
            options: [],
            help_text: ""
        }
        setQuestions([...questions, newQ])
    }

    const removeQuestion = async (id: string) => {
        if (id.startsWith('temp-')) {
            setQuestions(questions.filter((q: any) => q.id !== id))
            return
        }

        try {
            const res = await fetch("/api/recruitment/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "question_delete",
                    data: { id }
                })
            })

            if (!res.ok) {
                const result = await res.json()
                throw new Error(result.error || "Error al eliminar")
            }

            setQuestions(questions.filter((q: any) => q.id !== id))
            toast.success("Pregunta eliminada")
        } catch (error: any) {
            console.error("Error deleting question:", error)
            toast.error("Error al eliminar pregunta", {
                description: error.message
            })
        }
    }

    const saveQuestion = async (q: any) => {
        setSaving(q.id)
        try {
            const res = await fetch("/api/recruitment/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "question_save",
                    data: q
                })
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Error al guardar")

            setQuestions(questions.map((prev: any) => prev.id === q.id ? result : prev))
            toast.success("Pregunta guardada")
        } catch (error: any) {
            console.error("Error saving question:", error)
            toast.error("Error al guardar", {
                description: error.message || "Error desconocido"
            })
        } finally {
            setSaving(null)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="bg-card/40 border-border/40">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Formulario de Aplicación</CardTitle>
                        <CardDescription>
                            Diseña las preguntas que los aspirantes deben responder.
                        </CardDescription>
                    </div>
                    <Button onClick={addQuestion} className="gap-2">
                        <IconPlus className="size-4" />
                        Añadir Pregunta
                    </Button>
                </CardHeader>
            </Card>

            <div className="space-y-4 max-w-4xl">
                {questions.map((q: any, idx: number) => (
                    <Card key={q.id} className="bg-card/40 border-border/40 overflow-hidden group animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <CardContent className="p-6">
                            <div className="flex gap-6">
                                <div className="hidden md:flex flex-col items-center gap-1 text-muted-foreground pt-1">
                                    <IconGripVertical className="size-5 cursor-grab" />
                                    <span className="text-[10px] font-bold">{idx + 1}</span>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Etiqueta de la pregunta</Label>
                                            <Input
                                                value={q.label}
                                                className="bg-black/20 border-white/5 focus:border-blue-500/50"
                                                onChange={(e) => setQuestions(questions.map((prev: any) => prev.id === q.id ? { ...prev, label: e.target.value } : prev))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Tipo de campo</Label>
                                            <Select
                                                value={q.type}
                                                onValueChange={(val) => setQuestions(questions.map((prev: any) => prev.id === q.id ? { ...prev, type: val } : prev))}
                                            >
                                                <SelectTrigger className="bg-black/20 border-white/5">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-950 border-zinc-800 text-white shadow-2xl">
                                                    <SelectItem value="text">Short Answer (Texto corto)</SelectItem>
                                                    <SelectItem value="textarea">Paragraph (Párrafo)</SelectItem>
                                                    <SelectItem value="number">Number (Número)</SelectItem>
                                                    <SelectItem value="select">Single Choice (Selección única)</SelectItem>
                                                    <SelectItem value="multiselect">Multiple Choice (Múltiple)</SelectItem>
                                                    <SelectItem value="boolean">Checkbox (Sencilla/Sí-No)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Texto de Ayuda (Opcional)</Label>
                                        <Input
                                            value={q.help_text || ""}
                                            placeholder="Ej: Introduce tu BattleTag completo incluyendo los números"
                                            className="bg-black/20 border-white/5 focus:border-blue-500/50"
                                            onChange={(e) => setQuestions(questions.map((prev: any) => prev.id === q.id ? { ...prev, help_text: e.target.value } : prev))}
                                        />
                                    </div>

                                    {['select', 'multiselect'].includes(q.type) && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <Label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Opciones (Separadas por comas)</Label>
                                            <Input
                                                value={q.options?.join(", ") || ""}
                                                placeholder="Opción 1, Opción 2, Opción 3"
                                                className="bg-black/20 border-white/5 focus:border-blue-500/50"
                                                onChange={(e) => setQuestions(questions.map((prev: any) => prev.id === q.id ? { ...prev, options: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) } : prev))}
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`req-${q.id}`}
                                                checked={q.is_required}
                                                onCheckedChange={(val) => setQuestions(questions.map((prev: any) => prev.id === q.id ? { ...prev, is_required: !!val } : prev))}
                                            />
                                            <label htmlFor={`req-${q.id}`} className="text-sm font-medium leading-none cursor-pointer text-blue-100/70">
                                                Campo obligatorio
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                onClick={() => removeQuestion(q.id)}
                                            >
                                                <IconTrash className="size-4 mr-2" />
                                                Eliminar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={saving === q.id}
                                                onClick={() => saveQuestion(q)}
                                                className="border-blue-500/20 hover:bg-blue-500/5 text-blue-400"
                                            >
                                                {saving === q.id ? "Guardando..." : (
                                                    <>
                                                        <IconDeviceFloppy className="size-4 mr-2" />
                                                        Guardar
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
