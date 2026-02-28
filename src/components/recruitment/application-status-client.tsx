"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconCheck, IconClock, IconX, IconMessageCircle, IconInfoCircle, IconEdit, IconLoader2 } from "@tabler/icons-react"
import { supabase } from "@/infrastructure/supabase/client"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Answer = {
    id: string
    question_id: string
    answer_text: string
    question: {
        label: string
        type: string
    }
}

type Application = {
    id: string
    status: string
    created_at: string
    character_name: string
    character_realm: string
    character_class: string
    character_spec: string
    answers: Answer[]
}

export function ApplicationStatusClient({ application }: { application: Application }) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>(
        application.answers.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.answer_text }), {})
    )
    const [isSaving, setIsSaving] = useState(false)

    const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
        pending: { label: "Pte. Revisión", color: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: IconClock },
        reviewing: { label: "En Revisión", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: IconInfoCircle },
        interview: { label: "Entrevista", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: IconMessageCircle },
        accepted: { label: "Aceptado", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: IconCheck },
        rejected: { label: "Rechazado", color: "bg-rose-500/10 text-rose-500 border-rose-500/20", icon: IconX },
    }

    const config = statusConfig[application.status] || statusConfig.pending
    const canEdit = application.status === 'pending'

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const updates = Object.entries(editedAnswers).map(([ansId, text]) =>
                supabase.from("application_answers").update({ answer_text: text }).eq("id", ansId)
            )

            await Promise.all(updates)

            toast.success("Aplicación actualizada correctamente")
            setIsEditing(false)
            router.refresh()
        } catch (err) {
            console.error("Error saving answers:", err)
            toast.error("Error al actualizar la aplicación")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header / Status Banner */}
            <Card className="bg-zinc-950/40 border-white/5 backdrop-blur-md overflow-hidden">
                <div className={`h-1.5 w-full ${config.color.split(' ')[0]}`} />
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className={`size-16 rounded-2xl flex items-center justify-center border ${config.color}`}>
                            <config.icon className="size-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Estado: {config.label}</h2>
                            <p className="text-zinc-500 text-sm mt-1 font-medium">
                                Enviada el {new Date(application.created_at).toLocaleDateString()} · ID: {application.id.split('-')[0].toUpperCase()}
                            </p>
                        </div>
                    </div>
                    {canEdit && !isEditing && (
                        <Button
                            variant="glass"
                            className="rounded-xl px-6 group"
                            onClick={() => setIsEditing(true)}
                        >
                            <IconEdit className="size-4 mr-2 group-hover:rotate-12 transition-transform" />
                            Editar Respuestas
                        </Button>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Character Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-zinc-950 border-white/5 overflow-hidden h-full">
                        <CardHeader className="bg-white/5 py-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400">Tu Personaje</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 text-center">
                            <div className="relative size-32 rounded-3xl overflow-hidden mx-auto mb-6 shadow-2xl border-2 border-white/10 ring-4 ring-white/5">
                                <Image
                                    src={`/assets/images/classes/${application.character_class}.jpg`}
                                    alt="Clase"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <h3 className="text-2xl font-black text-white leading-none mb-2">{application.character_name}</h3>
                            <p className="text-blue-400 font-bold text-sm uppercase tracking-tight mb-4">
                                {application.character_spec} {application.character_class}
                            </p>
                            <Badge variant="outline" className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-500 uppercase font-black py-1 px-3">
                                {application.character_realm}
                            </Badge>

                            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-3">
                                <Button variant="outline" className="w-full rounded-xl text-xs h-10" asChild>
                                    <a href={`https://raider.io/characters/eu/${application.character_realm.toLowerCase()}/${application.character_name.toLowerCase()}`} target="_blank" rel="noopener noreferrer">
                                        Ver Raider.io
                                    </a>
                                </Button>
                                <Button variant="outline" className="w-full rounded-xl text-xs h-10" asChild>
                                    <a href={`https://www.warcraftlogs.com/character/eu/${application.character_realm.toLowerCase()}/${application.character_name.toLowerCase()}`} target="_blank" rel="noopener noreferrer">
                                        Ver Warcraft Logs
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Answers / Summary */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-zinc-950 border-white/5 overflow-hidden">
                        <CardHeader className="bg-white/5 py-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-400">Resumen de la Aplicación</CardTitle>
                            {isEditing && (
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancelar</Button>
                                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                        {isSaving && <IconLoader2 className="size-3 mr-2 animate-spin" />}
                                        Guardar
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-white/5">
                                {application.answers.map((ans) => (
                                    <div key={ans.id} className="p-6 space-y-3">
                                        <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">
                                            {ans.question.label}
                                        </Label>
                                        {isEditing ? (
                                            <Textarea
                                                className="bg-black/40 border-zinc-800 text-white min-h-[80px] rounded-xl text-sm"
                                                value={editedAnswers[ans.id]}
                                                onChange={(e) => setEditedAnswers(prev => ({ ...prev, [ans.id]: e.target.value }))}
                                            />
                                        ) : (
                                            <p className="text-zinc-200 text-sm whitespace-pre-wrap leading-relaxed">
                                                {ans.answer_text}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                        <IconInfoCircle className="size-5 text-blue-400 shrink-0" />
                        <p className="text-xs text-blue-100/60 leading-normal italic">
                            Esta información solo es visible para ti y para los oficiales de la hermandad. Si necesitas retirar tu aplicación o tienes dudas, puedes contactar con un oficial por Discord.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <Button variant="ghost" className="text-zinc-500 hover:text-white" onClick={() => router.push("/")}>
                    Volver al Inicio
                </Button>
            </div>
        </div>
    )
}
