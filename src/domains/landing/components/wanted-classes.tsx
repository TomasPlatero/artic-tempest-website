"use client"

import { useState, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import Link from "next/link"
import { supabase } from "@/shared/supabase/client"
import { ChevronRight, Check } from "lucide-react"

type Spot = {
    class_id: string
    spec_name: string
    urgency: string
}

type ClassData = {
    id: string
    name: string
    color: string
    spots: Spot[]
}

export function WantedClasses() {
    const [classesWithSpots, setClassesWithSpots] = useState<ClassData[]>([])
    const [loading, setLoading] = useState(true)
    const [hasApplied, setHasApplied] = useState(false)

    const { data: session } = useSession()

    useEffect(() => {
        async function fetchData() {
            // Fetch only non-closed spots
            const { data: spotsData } = await supabase
                .from("recruitment_spots")
                .select("*")
                .neq("urgency", "closed")
                .order("urgency", { ascending: false })

            // Fetch class constants
            const { data: constants } = await supabase
                .from("game_constants")
                .select("key, value, metadata")
                .eq("category", "wow_class")

            const classMap = new Map()
            constants?.forEach(c => classMap.set(c.key, { name: c.value, color: c.metadata?.color, spots: [] }))

            // Group spots by class
            spotsData?.forEach(s => {
                const classInfo = classMap.get(s.class_id)
                if (classInfo) {
                    classInfo.spots.push(s)
                }
            })

            // Only keep classes that have at least one active spot
            const enriched = Array.from(classMap.entries())
                .map(([id, info]) => ({
                    id,
                    name: info.name,
                    color: info.color,
                    spots: info.spots
                }))
                .filter(c => c.spots.length > 0)
                .sort((a, b) => Number(a.id) - Number(b.id))

            setClassesWithSpots(enriched)
            setLoading(false)
        }

        async function checkApplication() {
            if (!session?.user?.id) return
            const { data } = await supabase
                .from("recruitment_applications")
                .select("id")
                .eq("user_id", session.user.id)
                .in("status", ["pending", "reviewing", "interview"])
                .limit(1)

            if (data && data.length > 0) setHasApplied(true)
        }

        fetchData()
        checkApplication()
    }, [session])

    const urgencyColors: Record<string, string> = {
        high: "bg-red-500/10 text-red-500 border-red-500/20",
        medium: "bg-orange-500/10 text-orange-500 border-orange-500/20",
        low: "bg-blue-500/10 text-blue-500 border-blue-500/20"
    }

    const urgencyLabels: Record<string, string> = {
        high: "🔴 ALTA",
        medium: "🟡 MEDIA",
        low: "🔵 BAJA"
    }


    return (
        <section className="py-24 px-6 max-w-7xl mx-auto w-full">
            <div className="flex flex-col items-center mb-16 text-center">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter uppercase">
                    Reclutamiento
                </h2>
                <div className="h-1 w-20 bg-blue-500 rounded-full mb-6" />
                <p className="text-blue-100/60 max-w-2xl text-lg font-medium">
                    Buscamos jugadores excepcionales para completar nuestro roster de Midnight. Revisa nuestras prioridades actuales.
                </p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse h-48 bg-white/5 rounded-2xl border border-white/10" />
                    ))}
                </div>
            ) : classesWithSpots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {classesWithSpots.map((cls, idx) => (
                        <motion.div
                            key={cls.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            viewport={{ once: true }}
                        >
                            <Card className="bg-zinc-950/40 border-white/5 hover:border-blue-500/30 transition-all duration-500 overflow-hidden backdrop-blur-md group h-full pt-0">
                                <CardHeader className="pt-6 pb-4 border-b border-white/5 flex flex-row items-center gap-3 bg-white/5">
                                    <div className="relative size-10 rounded shadow-inner overflow-hidden border border-white/10 group-hover:scale-110 transition-transform flex-shrink-0">
                                        <Image
                                            src={`/assets/images/classes/${cls.id}.webp`}
                                            alt={cls.name}
                                            fill
                                            className="object-cover"
                                            sizes="40px"
                                        />
                                    </div>
                                    <CardTitle className="text-lg font-black uppercase tracking-tighter" style={{ color: cls.color }}>
                                        {cls.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-white/5">
                                        {cls.spots.map((spot) => (
                                            <div key={spot.spec_name} className="flex items-center justify-between p-4 px-5 hover:bg-white/5 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white leading-tight">
                                                        {spot.spec_name}
                                                    </span>
                                                    {spot.spec_name === 'Devorador' && (
                                                        <span className="text-[9px] text-blue-400 uppercase font-black tracking-tighter">
                                                            🌌 Midnight
                                                        </span>
                                                    )}
                                                </div>
                                                <Badge variant="outline" className={`text-[10px] uppercase font-black py-0.5 px-2 tracking-widest ${urgencyColors[spot.urgency]}`}>
                                                    {urgencyLabels[spot.urgency]}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                    <p className="text-blue-100/40 text-lg font-medium italic">
                        No hay vacantes abiertas actualmente, pero siempre revisamos aplicaciones excelentes.
                    </p>
                </div>
            )}

            <div className="mt-16 flex flex-col items-center">
                {session && hasApplied && (
                    <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest animate-bounce">
                        <Check className="size-3.5" />
                        Ya has enviado tu solicitud
                    </div>
                )}
                <div className="text-center">
                    {session ? (
                        hasApplied ? (
                            <Button
                                size="xl"
                                variant="glow"
                                className="rounded-full px-8 md:px-12 font-black uppercase tracking-widest group shadow-xl hover:shadow-2xl transition-all duration-500 w-full max-w-sm sm:w-auto"
                                asChild
                            >
                                <Link href="/reclutamiento/apply-en-curso">
                                    Ver Mi Aplicación
                                    <ChevronRight className="size-5 md:size-6 group-hover:translate-x-1 transition-transform ml-2" />
                                </Link>
                            </Button>
                        ) : (
                            <Button
                                size="xl"
                                className="rounded-full px-8 md:px-12 font-black uppercase tracking-widest group shadow-xl hover:shadow-2xl transition-all duration-500 w-full max-w-sm sm:w-auto"
                                asChild
                            >
                                <Link href="/reclutamiento">
                                    Aplica Ya!
                                    <ChevronRight className="size-5 md:size-6 group-hover:translate-x-1 transition-transform ml-2" />
                                </Link>
                            </Button>
                        )
                    ) : (
                        <Button
                            asChild
                            size="xl"
                            className="rounded-full px-8 md:px-12 font-black uppercase tracking-widest group shadow-xl hover:shadow-2xl transition-all duration-500 w-full max-w-sm sm:w-auto mx-auto flex sm:inline-flex"
                        >
                            <Link href="/login">
                                Inicia Sesión para Aplicar
                                <ChevronRight className="size-5 md:size-6 group-hover:translate-x-1 transition-transform ml-2" />
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </section>
    );
}
