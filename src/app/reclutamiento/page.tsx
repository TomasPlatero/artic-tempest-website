"use client"

import { useSession, signIn } from "next-auth/react"
import { LandingNavigation } from "@/components/landing/navigation"
import { WantedClasses } from "@/components/landing/wanted-classes"
import { Button } from "@/components/ui/button"
import { IconArrowRight, IconShieldCheck, IconClock, IconFlame } from "@tabler/icons-react"
import Link from "next/link"

export default function RecruitmentPage() {
    const { data: session } = useSession()
    return (
        <main className="min-h-screen bg-black overflow-x-hidden">
            <LandingNavigation />

            <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-12 items-start">
                    <div className="flex-1">
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tight">
                            Únete a Artic <span className="text-blue-500">Tempest</span>
                        </h1>
                        <p className="text-xl text-blue-100/60 mb-8 max-w-2xl">
                            ¿Tienes lo que se necesita para raidear en el nivel más alto? Buscamos jugadores comprometidos, con mentalidad de progreso y capacidad de análisis.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                            <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 h-fit">
                                    <IconClock className="size-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Horario</h4>
                                    <p className="text-sm text-white/50">Lunes a Jueves, 22:00 - 00:15 (Hora servidor).</p>
                                    <p className="text-sm text-white/50">Cada mes de la primera temporada también raideamos los Viernes.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 h-fit">
                                    <IconShieldCheck className="size-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Estabilidad</h4>
                                    <p className="text-sm text-white/50">Grupo formado con gente en Experiencia Mítico y con compromiso.</p>
                                </div>
                            </div>
                        </div>

                        {session ? (
                            <Button size="xl" className="rounded-xl px-10 group" asChild>
                                <Link href="/reclutamiento/apply">
                                    Empezar Aplicación
                                    <IconArrowRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        ) : (
                            <Button
                                size="xl"
                                className="rounded-xl px-10 group"
                                onClick={() => signIn('discord')}
                            >
                                Inicia Sesión para Aplicar
                                <IconArrowRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        )}
                    </div>

                    <div className="w-full md:w-[450px] space-y-4">
                        <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <IconFlame className="size-20" />
                            </div>
                            <h3 className="text-blue-400 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                Prioridades de Reclutamiento
                            </h3>
                            <p className="text-sm text-blue-100/70 mb-4 italic">
                                &quot;Valoramos el rendimiento, el compromiso y .&quot;
                            </p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <h4 className="text-white font-bold mb-4 flex items-center gap-2">Requisitos Mínimos</h4>
                            <ul className="space-y-3">
                                {[
                                    "Experiencia previa en contenido Mítico.",
                                    "Uso obligatorio de addons (WeakAuras, DBM/LittleWigs, Methos).",
                                    "Preparación previa de los encuentros (consumibles, guías).",
                                    "Micrófono funcional y presencia en Discord."
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-2 text-sm text-white/60">
                                        <div className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-950/50 py-20 border-t border-white/5">
                <WantedClasses />
            </div>
        </main>
    )
}
