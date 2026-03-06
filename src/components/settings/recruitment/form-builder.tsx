"use client"

import { useState } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
    IconPlus,
    IconTrash,
    IconEdit,
    IconHelp,
    IconLock,
    IconLockOpen,
    IconDeviceFloppy,
    IconForms,
    IconAsterisk
} from "@tabler/icons-react"
import { toast } from "sonner"

export function FormBuilder({ initialQuestions }: any) {
    const [questions, setQuestions] = useState(initialQuestions)
    const [saving, setSaving] = useState<string | null>(null)

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingQuestion, setEditingQuestion] = useState<any>(null)

    const openAddModal = () => {
        setEditingQuestion({
            id: `temp-${Date.now()}`,
            label: "",
            type: "text",
            is_required: true,
            order_index: questions.length,
            options: [],
            help_text: ""
        })
        setIsModalOpen(true)
    }

    const openEditModal = (q: any) => {
        setEditingQuestion({ ...q })
        setIsModalOpen(true)
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

    const saveQuestionFromModal = async () => {
        if (!editingQuestion || !editingQuestion.label) {
            toast.error("La etiqueta de la pregunta es obligatoria")
            return
        }

        setSaving(editingQuestion.id)
        try {
            const res = await fetch("/api/recruitment/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "question_save",
                    data: editingQuestion
                })
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Error al guardar")

            // If it was a new question, it might have a new DB ID now
            const isNew = editingQuestion.id.startsWith('temp-')
            if (isNew) {
                setQuestions([...questions.filter((q: any) => q.id !== editingQuestion.id), result])
            } else {
                setQuestions(questions.map((prev: any) => prev.id === editingQuestion.id ? result : prev))
            }

            toast.success("Pregunta guardada")
            setIsModalOpen(false)
        } catch (error: any) {
            console.error("Error saving question:", error)
            toast.error("Error al guardar", {
                description: error.message || "Error desconocido"
            })
        } finally {
            setSaving(null)
        }
    }

    const getTypeLabel = (type: string) => {
        const types: any = {
            text: "Texto corto",
            textarea: "Párrafo",
            number: "Número",
            select: "Selección única",
            multiselect: "Múltiple",
            boolean: "Checkbox"
        }
        return types[type] || type
    }

    return (
        <div className="space-y-8 w-full max-w-full pb-24">
            <Card className="border-white/5 bg-zinc-950/40 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl overflow-hidden ring-1 ring-white/5">
                <CardHeader className="p-8 md:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                        <CardTitle className="text-2xl font-black uppercase tracking-widest text-primary flex items-center gap-3">
                            <IconForms className="size-7" />
                            Constructor de Formulario
                        </CardTitle>
                        <CardDescription className="text-sm font-medium text-white/40 mt-2">
                            Diseña las preguntas que los aspirantes deben responder al aplicar.
                        </CardDescription>
                    </div>
                    <Button
                        onClick={openAddModal}
                        className="w-full sm:w-auto h-14 rounded-2xl bg-primary hover:bg-primary/90 text-zinc-950 font-black uppercase tracking-widest text-[10px] px-8 shadow-[0_10px_30px_rgba(var(--primary),0.2)] transition-all active:scale-95 gap-3"
                    >
                        <IconPlus className="size-5" />
                        Añadir Pregunta
                    </Button>
                </CardHeader>
                <CardContent className="p-4 md:p-10 pt-0">
                    <div className="space-y-4">
                        {questions.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                                <IconForms className="size-12 text-white/10 mx-auto mb-4" />
                                <p className="text-white/40 font-bold uppercase tracking-widest text-xs">No hay preguntas creadas</p>
                                <Button variant="link" onClick={openAddModal} className="text-primary mt-2">Crear la primera pregunta</Button>
                            </div>
                        ) : (
                            questions.map((q: any, idx: number) => (
                                <div
                                    key={q.id}
                                    className="group flex items-center justify-between p-6 rounded-[2rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 shadow-lg relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-5 min-w-0">
                                        <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-black font-mono text-white/30 border border-white/5">
                                            {idx + 1}
                                        </div>
                                        <div className="flex flex-col gap-1.5 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black uppercase tracking-wider text-white truncate">
                                                    {q.label}
                                                </span>
                                                {q.is_required && (
                                                    <IconAsterisk className="size-3 text-rose-500" />
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                                                    {getTypeLabel(q.type)}
                                                </Badge>
                                                {q.is_required && (
                                                    <Badge variant="outline" className="text-rose-500/60 border-rose-500/10 text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                                                        Obligatorio
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-10 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-white/60 hover:text-white transition-all shadow-xl active:scale-95"
                                            onClick={() => openEditModal(q)}
                                        >
                                            <IconEdit className="size-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-10 rounded-xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/20 text-rose-500/60 hover:text-rose-500 transition-all shadow-xl active:scale-95"
                                            onClick={() => removeQuestion(q.id)}
                                        >
                                            <IconTrash className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Edit/Add Question Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-xl bg-zinc-950 border-white/10 text-white rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] p-0 overflow-hidden outline-none">
                    {editingQuestion && (
                        <>
                            <DialogHeader className="p-8 pb-4">
                                <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <IconForms className="size-6 text-primary" />
                                    </div>
                                    {editingQuestion.id.startsWith('temp-') ? 'Nueva Pregunta' : 'Editar Pregunta'}
                                </DialogTitle>
                                <DialogDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mt-2">
                                    Personaliza los detalles del campo del formulario
                                </DialogDescription>
                            </DialogHeader>

                            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar scrollbar-hide">
                                {/* Label Input */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black text-white/30 ml-1 tracking-[0.22em]">Etiqueta / Enunciado</Label>
                                    <Input
                                        value={editingQuestion.label}
                                        onChange={(e) => setEditingQuestion({ ...editingQuestion, label: e.target.value })}
                                        className="bg-white/5 border-white/10 h-14 text-sm font-black uppercase tracking-wider rounded-2xl px-6 focus:ring-primary/20 transition-all"
                                        placeholder="Ej: ¿Por qué quieres unirte?"
                                    />
                                </div>

                                {/* Field Type */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black text-white/30 ml-1 tracking-[0.22em]">Tipo de Respuesta</Label>
                                    <Select
                                        value={editingQuestion.type}
                                        onValueChange={(val) => setEditingQuestion({ ...editingQuestion, type: val })}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 h-14 rounded-2xl px-6 text-[11px] font-black uppercase tracking-wider text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-white/10">
                                            <SelectItem value="text" className="text-[11px] font-bold uppercase tracking-widest py-3">Short Answer (Texto corto)</SelectItem>
                                            <SelectItem value="textarea" className="text-[11px] font-bold uppercase tracking-widest py-3">Paragraph (Párrafo)</SelectItem>
                                            <SelectItem value="number" className="text-[11px] font-bold uppercase tracking-widest py-3">Number (Número)</SelectItem>
                                            <SelectItem value="select" className="text-[11px] font-bold uppercase tracking-widest py-3">Single Choice (Selección única)</SelectItem>
                                            <SelectItem value="multiselect" className="text-[11px] font-bold uppercase tracking-widest py-3">Multiple Choice (Múltiple)</SelectItem>
                                            <SelectItem value="boolean" className="text-[11px] font-bold uppercase tracking-widest py-3">Checkbox (Sencilla/Sí-No)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Help Text */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] uppercase font-black text-white/30 ml-1 tracking-[0.22em]">Instrucciones / Ayuda (Opcional)</Label>
                                    <div className="relative">
                                        <Input
                                            value={editingQuestion.help_text || ""}
                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, help_text: e.target.value })}
                                            className="bg-white/5 border-white/10 h-14 text-sm font-bold rounded-2xl px-6 pl-12 focus:ring-primary/20 transition-all"
                                            placeholder="Detalla qué esperas en esta respuesta..."
                                        />
                                        <IconHelp className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-white/20" />
                                    </div>
                                </div>

                                {/* Options for Selects */}
                                {['select', 'multiselect'].includes(editingQuestion.type) && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Label className="text-[10px] uppercase font-black text-white/30 ml-1 tracking-[0.22em]">Opciones (Separadas por comas)</Label>
                                        <Input
                                            value={editingQuestion.options?.join(", ") || ""}
                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, options: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })}
                                            className="bg-white/5 border-white/10 h-14 text-sm font-bold rounded-2xl px-6 focus:ring-primary/20 transition-all"
                                            placeholder="Mañana, Tarde, Noche"
                                        />
                                    </div>
                                )}

                                {/* Required Toggle */}
                                <div className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 flex items-center justify-between group transition-colors hover:bg-white/[0.05]">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-[11px] font-black text-white uppercase tracking-wider cursor-pointer">Campo Obligatorio</Label>
                                            {editingQuestion.is_required ? (
                                                <IconLock className="size-4 text-emerald-500" />
                                            ) : (
                                                <IconLockOpen className="size-4 text-white/20" />
                                            )}
                                        </div>
                                        <span className="text-[9px] text-white/30 font-medium uppercase tracking-tight">Los aspirantes DEBEN responder esto</span>
                                    </div>
                                    <Checkbox
                                        id="req-modal"
                                        checked={editingQuestion.is_required}
                                        onCheckedChange={(val) => setEditingQuestion({ ...editingQuestion, is_required: !!val })}
                                        className="size-6 rounded-lg border-white/10 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="p-8 pt-4 flex gap-4 sm:justify-between items-center sm:flex-row flex-col-reverse">
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-auto px-8 bg-white/5 border-white/10 hover:bg-white/10 text-zinc-400 font-bold uppercase tracking-widest text-[10px] h-14 rounded-2xl"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-zinc-950 font-black uppercase tracking-widest text-[10px] h-14 rounded-2xl shadow-[0_10px_30px_rgba(var(--primary),0.2)] transition-all active:scale-95"
                                    onClick={saveQuestionFromModal}
                                    disabled={!!saving}
                                >
                                    {saving ? "Guardando..." : (
                                        <>
                                            <IconDeviceFloppy className="size-4 mr-2" />
                                            Guardar Pregunta
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
