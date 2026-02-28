"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { IconCheck, IconAlertCircle, IconLoader2, IconUserCode, IconArrowRight, IconArrowLeft } from "@tabler/icons-react"
import { toast } from "sonner"
import { supabase } from "@/infrastructure/supabase/client"

type Question = {
    id: string
    label: string
    type: string
    options?: string[]
    is_required: boolean
    help_text?: string
}

type Props = {
    user: any
    characters: any[]
    questions: Question[]
    classConstants: any[]
}

export function ApplyClient({ user, characters, questions, classConstants }: Props) {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [selectedChar, setSelectedChar] = useState<any>(null)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [showAllChars, setShowAllChars] = useState(false)

    const classMap = new Map()
    classConstants.forEach(c => classMap.set(Number(c.key), c.value))

    const handleNext = () => {
        if (step === 1 && !selectedChar) {
            toast.error("Debes seleccionar un personaje")
            return
        }
        setStep(step + 1)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const handleBack = () => {
        setStep(step - 1)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const handleSubmit = async () => {
        // Enforce required fields
        const missing = questions.find(q => q.is_required && !answers[q.id])
        if (missing) {
            toast.error(`El campo "${missing.label}" es obligatorio`)
            return
        }

        setIsSubmitting(true)

        try {
            // 0. Final safety check
            const { data: activeApps } = await supabase
                .from("recruitment_applications")
                .select("id")
                .eq("user_id", user.id)
                .in("status", ["pending", "reviewing", "interview"])
                .limit(1)

            if (activeApps && activeApps.length > 0) {
                toast.error("Ya tienes una solicitud activa")
                router.push("/reclutamiento/apply-en-curso")
                return
            }

            // 1. Create Application
            const { data: application, error: appError } = await supabase
                .from("recruitment_applications")
                .insert({
                    user_id: user.id,
                    character_name: selectedChar.name,
                    character_realm: selectedChar.realm,
                    character_class: selectedChar.class_id,
                    character_spec: selectedChar.spec || "Unknown",
                    status: "pending"
                })
                .select()
                .single()

            if (appError) throw appError

            // 2. Create Answers
            const answersToInsert = Object.entries(answers).map(([qId, val]) => ({
                application_id: application.id,
                question_id: qId,
                answer_text: val
            }))

            const { error: ansError } = await supabase
                .from("application_answers")
                .insert(answersToInsert)

            if (ansError) throw ansError

            setIsSuccess(true)
            toast.success("Solicitud enviada correctamente")

            // Notification (future) would be triggered here by a DB Webhook or Edge Function

        } catch (error: any) {
            console.error("Error submitting application:", error)
            toast.error("Error al enviar la solicitud", {
                description: error.message
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSuccess) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-950 border border-emerald-500/20 rounded-3xl p-12 text-center"
            >
                <div className="size-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IconCheck className="size-10" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 uppercase">¡SOLICITUD RECIBIDA!</h2>
                <p className="text-zinc-400 max-w-sm mx-auto mb-8">
                    Tu aplicación ha sido enviada a los oficiales de Artic Tempest. Revisaremos tu perfil y nos pondremos en contacto contigo pronto.
                </p>
                <Button variant="outline" className="rounded-xl" onClick={() => router.push("/")}>
                    Volver al Inicio
                </Button>
            </motion.div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Progress breadcrumb */}
            <div className="flex items-center gap-4 mb-8">
                <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${step >= 1 ? 'text-blue-500' : 'text-zinc-600'}`}>
                    <span className={`size-6 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-blue-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>1</span>
                    Personaje
                </div>
                <div className="h-px bg-zinc-800 flex-1" />
                <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${step >= 2 ? 'text-blue-500' : 'text-zinc-600'}`}>
                    <span className={`size-6 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-blue-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>2</span>
                    Preguntas
                </div>
                <div className="h-px bg-zinc-800 flex-1" />
                <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${step >= 3 ? 'text-blue-500' : 'text-zinc-600'}`}>
                    <span className={`size-6 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-blue-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>3</span>
                    Finalizar
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <Label className="text-lg font-bold">Selecciona tu personaje principal</Label>
                                {characters.length > 5 && (
                                    <div className="relative w-full sm:w-64">
                                        <Input
                                            placeholder="Buscar personaje..."
                                            className="bg-zinc-900/50 border-zinc-800 text-xs h-9 rounded-lg"
                                            onChange={(e) => {
                                                const term = e.target.value.toLowerCase()
                                                const cards = document.querySelectorAll('.char-card')
                                                cards.forEach((card: any) => {
                                                    const name = card.getAttribute('data-name').toLowerCase()
                                                    if (name.includes(term)) {
                                                        card.style.display = 'block'
                                                    } else {
                                                        card.style.display = 'none'
                                                    }
                                                })
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {characters.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                                        {(showAllChars ? characters : characters.slice(0, 6)).map(char => (
                                            <Card
                                                key={char.id}
                                                data-name={char.name}
                                                className={`char-card cursor-pointer transition-all border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/60 ${selectedChar?.id === char.id ? 'border-primary ring-1 ring-primary/50 bg-primary/5' : ''}`}
                                                onClick={() => setSelectedChar(char)}
                                            >
                                                <CardContent className="p-3 flex items-center gap-3">
                                                    <div className="relative size-10 rounded-lg overflow-hidden border border-white/5 shrink-0">
                                                        <Image
                                                            src={`/assets/images/classes/${char.class_id}.jpg`}
                                                            alt="Clase"
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm text-white truncate">{char.name}</p>
                                                        <p className="text-[10px] text-zinc-500 truncate">{char.realm} · Lvl {char.level}</p>
                                                    </div>
                                                    <div className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${selectedChar?.id === char.id ? 'bg-primary border-primary' : 'border-zinc-700'}`}>
                                                        {selectedChar?.id === char.id && <IconCheck className="size-2.5 text-black" />}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    {!showAllChars && characters.length > 6 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAllChars(true)}
                                            className="w-full py-3 rounded-xl border border-dashed border-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-widest hover:bg-white/5 hover:text-zinc-300 transition-colors"
                                        >
                                            Ver todos los personajes ({characters.length})
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
                                    <IconAlertCircle className="size-10 text-orange-400 mx-auto mb-4" />
                                    <p className="text-zinc-300 font-bold mb-2">No tienes personajes vinculados</p>
                                    <p className="text-sm text-zinc-500 mb-6">Debes vincular tu cuenta de Battle.net en el dashboard para poder aplicar.</p>
                                    <Button variant="outline" asChild>
                                        <a href="/dashboard/cuenta">Ir a mi cuenta</a>
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button size="xl" className="rounded-xl px-10 group" onClick={handleNext} disabled={!selectedChar}>
                                Siguiente
                                <IconArrowRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        {questions.map((q) => (
                            <div key={q.id} className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-1">
                                    <Label className="text-base font-bold text-zinc-200">
                                        {q.label}
                                        {q.is_required && <span className="text-blue-500 ml-1">*</span>}
                                    </Label>
                                    {q.help_text && (
                                        <p className="text-xs text-zinc-500 italic">{q.help_text}</p>
                                    )}
                                </div>

                                {q.type === 'text' && (
                                    <Input
                                        className="bg-black/40 border-zinc-800 text-white h-12 rounded-xl focus:border-blue-500/50"
                                        placeholder="Escribe tu respuesta..."
                                        value={answers[q.id] || ""}
                                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    />
                                )}

                                {q.type === 'number' && (
                                    <Input
                                        type="number"
                                        className="bg-black/40 border-zinc-800 text-white h-12 rounded-xl focus:border-blue-500/50"
                                        placeholder="Ej: 25"
                                        value={answers[q.id] || ""}
                                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    />
                                )}

                                {q.type === 'textarea' && (
                                    <Textarea
                                        className="bg-black/40 border-zinc-800 text-white min-h-[120px] rounded-xl focus:border-blue-500/50"
                                        placeholder="Danos detalles..."
                                        value={answers[q.id] || ""}
                                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    />
                                )}

                                {q.type === 'boolean' && (
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-black/40 border border-zinc-800 cursor-pointer" onClick={() => setAnswers(prev => ({ ...prev, [q.id]: prev[q.id] === 'Sí' ? 'No' : 'Sí' }))}>
                                        <Checkbox
                                            id={`q-${q.id}`}
                                            checked={answers[q.id] === 'Sí'}
                                            onCheckedChange={(val) => setAnswers(prev => ({ ...prev, [q.id]: val ? 'Sí' : 'No' }))}
                                        />
                                        <label htmlFor={`q-${q.id}`} className="text-sm font-medium text-zinc-300 cursor-pointer">
                                            Acepto / Sí
                                        </label>
                                    </div>
                                )}

                                {q.type === 'select' && (
                                    <Select
                                        value={answers[q.id] || ""}
                                        onValueChange={(val) => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                                    >
                                        <SelectTrigger className="bg-black/40 border-zinc-800 text-white h-12 rounded-xl focus:border-blue-500/50">
                                            <SelectValue placeholder="Selecciona una opción" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                            {q.options?.map((opt: any) => (
                                                <SelectItem key={opt} value={opt} className="focus:bg-white/5 focus:text-white">
                                                    {opt}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                {q.type === 'multiselect' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {q.options?.map((opt: any) => {
                                            const current = answers[q.id]?.split(", ").filter(Boolean) || []
                                            const isChecked = current.includes(opt)
                                            return (
                                                <div
                                                    key={opt}
                                                    className={`flex items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer ${isChecked ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-black/20 border-zinc-800 text-zinc-500'}`}
                                                    onClick={() => {
                                                        const next = isChecked ? current.filter(x => x !== opt) : [...current, opt]
                                                        setAnswers(prev => ({ ...prev, [q.id]: next.join(", ") }))
                                                    }}
                                                >
                                                    <Checkbox checked={isChecked} />
                                                    <span className="text-sm">{opt}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" className="rounded-xl px-10 text-zinc-500 hover:text-white" onClick={handleBack}>
                                <IconArrowLeft className="size-5 mr-2" />
                                Atrás
                            </Button>
                            <Button size="xl" className="rounded-xl px-10 group" onClick={handleNext}>
                                Siguiente
                                <IconArrowRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="p-8 rounded-3xl bg-blue-600/5 border border-blue-500/20">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 italic">
                                <IconUserCode className="size-6 text-blue-500" />
                                Resumen de tu aplicación
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Personaje</p>
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="relative size-14 rounded-xl overflow-hidden shadow-2xl">
                                            <Image
                                                src={`/assets/images/classes/${selectedChar.class_id}.jpg`}
                                                alt="Clase" fill className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-white leading-tight">{selectedChar.name}</p>
                                            <p className="text-[10px] text-zinc-400 font-medium uppercase">{selectedChar.spec || "Unknown"} {classMap.get(selectedChar.class_id)}</p>
                                            <p className="text-[10px] text-xs mt-1 text-zinc-500">{selectedChar.realm}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Estado</p>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-sm text-zinc-300">
                                            Al pulsar enviar, tu perfil de **Raider.io** y **Warcraft Logs** será vinculado automáticamente para que los oficiales lo revisen.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" className="rounded-xl px-10 text-zinc-500 hover:text-white" onClick={handleBack} disabled={isSubmitting}>
                                <IconArrowLeft className="size-5 mr-2" />
                                Atrás
                            </Button>
                            <Button
                                size="xl"
                                className="rounded-xl px-12 font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <IconLoader2 className="size-5 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    "Enviar Aplicación"
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
