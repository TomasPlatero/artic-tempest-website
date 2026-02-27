"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    IconUser,
    IconCalendar,
    IconCheck,
    IconX,
    IconExternalLink,
    IconTrendingUp,
    IconSword,
    IconShield,
    IconHeartHandshake,
    IconLoader2
} from "@tabler/icons-react"
import Image from "next/image"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { supabase } from "@/infrastructure/supabase/client"
import { fetchCharacterRIO } from "@/infrastructure/raiderio/raiderio-client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

type Props = {
    application: any
    answers: any[]
    classConstants: any[]
}

const statusConfig: Record<string, { label: string, color: string }> = {
    pending: { label: "Nuevo", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    reviewing: { label: "En Revisión", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    interview: { label: "Charla Pendiente", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    accepted: { label: "Aceptado", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    rejected: { label: "Rechazado", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" }
}

export function RecruitmentDetailClient({ application, answers, classConstants }: Props) {
    const router = useRouter()
    const [rioData, setRioData] = useState<any>(null)
    const [loadingRio, setLoadingRio] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(application.status)

    const classMap = new Map()
    classConstants.forEach((c: any) => classMap.set(Number(c.key), { name: c.value, color: c.metadata?.color }))
    const cls = classMap.get(application.character_class)

    useEffect(() => {
        async function getExternalData() {
            const data = await fetchCharacterRIO(application.character_name, application.character_realm)
            setRioData(data)
            setLoadingRio(false)
        }
        getExternalData()
    }, [application])

    const handleUpdateStatus = async (val: string) => {
        setCurrentStatus(val)
        setIsUpdating(true)
        try {
            const { error } = await supabase
                .from("recruitment_applications")
                .update({ status: val, updated_at: new Date().toISOString() })
                .eq("id", application.id)

            if (error) throw error
            toast.success(`Estado actualizado a: ${statusConfig[val].label}`)
            router.refresh()
        } catch (error) {
            toast.error("Error al actualizar estado")
        } finally {
            setIsUpdating(false)
        }
    }

    const mPlusScore = rioData?.mythic_plus_scores_by_season?.[0]?.scores?.all || 0
    const raidProg = rioData?.raid_progression?.["nerubar-palace"] || { summary: "0/8 N" }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex items-center gap-6">
                    <div className="relative size-20 md:size-24 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-blue-500/10">
                        <Image
                            src={`/assets/images/classes/${application.character_class}.jpg`}
                            alt="Clase" fill className="object-cover"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
                                {application.character_name}
                            </h2>
                            <Badge variant="outline" className={`uppercase font-bold ${statusConfig[currentStatus].color}`}>
                                {statusConfig[currentStatus].label}
                            </Badge>
                        </div>
                        <p className="text-lg font-medium" style={{ color: cls?.color }}>
                            {application.character_spec} {cls?.name}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            {application.character_realm} • {new Date(application.created_at).toLocaleDateString("es-ES")}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-64">
                    <Label className="text-[10px] uppercase font-bold text-zinc-500 ml-2">Cambiar Estado</Label>
                    <Select
                        value={currentStatus}
                        onValueChange={handleUpdateStatus}
                        disabled={isUpdating}
                    >
                        <SelectTrigger className="bg-zinc-950/50 border-white/10 h-10 rounded-xl focus:ring-blue-500/50">
                            <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/10 text-white">
                            {Object.entries(statusConfig).map(([key, cfg]) => (
                                <SelectItem key={key} value={key} className="focus:bg-white/5 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <div className={`size-2 rounded-full ${cfg.color.split(' ')[1].replace('text-', 'bg-')}`} />
                                        {cfg.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Summary Column */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="bg-card/40 border-border/40 overflow-hidden backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Resumen de iLvl / Scores</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <IconTrendingUp className="size-4 text-blue-400" />
                                    <span className="text-sm font-bold">M+ Score</span>
                                </div>
                                <span className={`font-black ${mPlusScore > 2500 ? 'text-orange-400' : 'text-white'}`}>
                                    {loadingRio ? <IconLoader2 className="size-3 animate-spin" /> : mPlusScore}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <IconSword className="size-4 text-rose-400" />
                                    <span className="text-sm font-bold">Raid Prog</span>
                                </div>
                                <span className="font-black text-white">
                                    {loadingRio ? <IconLoader2 className="size-3 animate-spin" /> : raidProg.summary}
                                </span>
                            </div>

                            <Separator className="bg-white/5" />

                            <div className="grid grid-cols-2 gap-2 mt-4">
                                <Button variant="glass" size="sm" className="w-full text-[10px] h-8" asChild>
                                    <a href={`https://raider.io/characters/eu/${application.character_realm}/${application.character_name}`} target="_blank" rel="noreferrer">
                                        Raider.io <IconExternalLink className="size-3 ml-1" />
                                    </a>
                                </Button>
                                <Button variant="glass" size="sm" className="w-full text-[10px] h-8" asChild>
                                    <a href={`https://www.warcraftlogs.com/character/eu/${application.character_realm}/${application.character_name}`} target="_blank" rel="noreferrer">
                                        WCL <IconExternalLink className="size-3 ml-1" />
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 border-border/40 overflow-hidden backdrop-blur-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Notas Internas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                className="w-full h-32 bg-black/20 border border-white/5 rounded-xl p-3 text-sm text-white resize-none outline-none focus:border-blue-500/50"
                                placeholder="Añadir nota para oficiales..."
                                defaultValue={application.internal_notes || ""}
                                onBlur={async (e) => {
                                    await supabase.from("recruitment_applications").update({ internal_notes: e.target.value }).eq("id", application.id)
                                    toast.success("Nota guardada")
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Answers Column */}
                <div className="md:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2 px-2">
                        <IconHeartHandshake className="size-5 text-blue-500" />
                        Respuestas del Formulario
                    </h3>

                    {answers.sort((a, b) => a.recruitment_questions.order_index - b.recruitment_questions.order_index).map((ans: any, idx: number) => (
                        <Card key={idx} className="bg-card/40 border-border/40 overflow-hidden backdrop-blur-sm shadow-xl">
                            <CardContent className="p-6">
                                <Label className="text-blue-400 font-bold mb-3 block text-xs uppercase tracking-[0.2em]">
                                    {ans.recruitment_questions.label}
                                </Label>
                                <div className="text-sm text-blue-50/90 leading-relaxed whitespace-pre-wrap">
                                    {ans.answer_text}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {answers.length === 0 && (
                        <div className="p-12 text-center text-muted-foreground border border-dashed border-border/40 rounded-3xl">
                            No hay respuestas registradas para esta aplicación.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
