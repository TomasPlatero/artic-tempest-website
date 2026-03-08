"use client"

import { useState, useEffect } from "react"
import { LandingNavigation } from "@/components/landing/navigation"
import { LandingHero } from "@/components/landing/hero"
import { LandingNoticias } from "@/components/landing/noticias"
import { WantedClasses } from "@/components/landing/wanted-classes"
import { Separator } from "@/components/ui/separator"
import { LandingFooter } from "@/components/landing/footer"
import { LandingStreamers } from "@/components/landing/streamers"

interface RaidProgression {
    name: string
    tier?: string
    expansion?: string
    progress: string
    rank: string
    status: string
}

export function HomePageClient({ initialProgression, initialStreamers }: { initialProgression?: RaidProgression[], initialStreamers?: any[] }) {
    const [progression, setProgression] = useState<RaidProgression[]>(initialProgression || [])

    useEffect(() => {
        if (initialProgression) return; // Skip if already provided by server

        fetch("/api/progression")
            .then(res => res.json())
            .then(data => {
                if (data.progression) setProgression(data.progression)
            })
            .catch(() => { })
    }, [initialProgression])

    return (
        <main className="min-h-screen bg-black selection:bg-blue-500/30 dark">
            <LandingNavigation />
            <LandingHero />
            <LandingNoticias />

            <div id="reclutamiento" className="relative z-10 bg-black">
                <WantedClasses />
            </div>

            <Separator className="bg-white/5 max-w-7xl mx-auto" />

            {/* Progress Section */}
            <section id="progreso" className="py-24 px-6 max-w-7xl mx-auto text-center">
                <h2 className="text-4xl font-black text-white mb-12 uppercase tracking-tight">Progreso en Midnight</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {progression.filter(r => r.expansion !== 'The War Within').map((raid) => (
                        <div key={raid.name} className={`bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-blue-500/30 transition-all ${raid.status === 'Próximamente' ? 'opacity-50 grayscale blur-[1px]' : ''}`}>
                            <p className="text-blue-400 font-bold mb-2 uppercase tracking-widest text-[10px]">{raid.tier || raid.expansion}</p>
                            <h3 className="text-xl font-bold text-white mb-4">{raid.name}</h3>
                            <div className="text-5xl font-black text-white tracking-tighter mb-2">{raid.progress}</div>
                            <p className="text-white/40 text-sm font-medium">{raid.rank !== '-' ? raid.rank : raid.status}</p>
                        </div>
                    ))}
                </div>

                {progression.some(r => r.expansion === 'The War Within') && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-black text-white/50 mb-8 uppercase tracking-tight">Progreso Pasado (TWW)</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {progression.filter(r => r.expansion === 'The War Within').map((raid) => (
                                <div key={raid.name} className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-blue-500/30 transition-all">
                                    <p className="text-blue-400 font-bold mb-2 uppercase tracking-widest text-[10px]">{raid.tier || raid.expansion}</p>
                                    <h3 className="text-xl font-bold text-white mb-4">{raid.name}</h3>
                                    <div className="text-5xl font-black text-white tracking-tighter mb-2">{raid.progress}</div>
                                    <p className="text-white/40 text-sm font-medium">{raid.rank !== '-' ? raid.rank : raid.status}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <p className="mt-12 text-zinc-500 text-xs uppercase tracking-[0.3em] font-bold flex items-center justify-center gap-2">
                    <span className="size-1.5 bg-red-500 rounded-full animate-pulse" />
                    Live Data from WarcraftLogs
                </p>
            </section>

            <Separator className="bg-white/5 max-w-7xl mx-auto" />

            <LandingStreamers limit={3} initialStreamers={initialStreamers} />

            <Separator className="bg-white/5 max-w-7xl mx-auto" />

            {/* History Section */}
            <section id="historia" className="py-24 px-6 max-w-4xl mx-auto text-center">
                <h2 className="text-4xl font-black text-white mb-8 uppercase tracking-tight">Nuestra Historia</h2>

                <div className="space-y-6">
                    <p className="text-lg text-blue-100/60 leading-relaxed">
                        <strong className="text-white font-black">Artic Tempest</strong> nace con una idea clara: progresar con seriedad sin perder el buen ambiente que hace que una hermandad funcione a largo plazo. No somos un proyecto improvisado; somos un grupo consolidado en <span className="text-blue-400 font-bold">Dun Modr</span>, con una estructura estable y un compromiso real con el progreso PvE.
                    </p>

                    <p className="text-lg text-blue-100/60 leading-relaxed">
                        Tras haber conseguido nuestro primer <span className="text-white font-bold">Cutting Edge en The War Within</span> y posicionarnos como una hermandad <span className="text-white font-bold">Top 25 de España</span>, hemos demostrado que sabemos competir a buen nivel sin perder nuestra identidad. Aquí no hay ruido innecesario: hay organización, constancia y trabajo bien hecho semana tras semana.
                    </p>

                    <p className="text-lg text-blue-100/60 leading-relaxed">
                        En <strong className="text-white font-black">Artic Tempest</strong> no buscamos únicamente rendimiento individual. Buscamos jugadores que entiendan lo que implica formar parte de un equipo serio: puntualidad, preparación previa de cada encuentro, mentalidad de mejora continua y capacidad de adaptación.
                    </p>

                    <p className="text-lg text-blue-100/60 leading-relaxed">
                        El objetivo es claro: seguir creciendo en <span className="text-white font-bold">Midnight</span>, consolidando lo conseguido y dando un paso más en nuestro nivel de juego, manteniendo lo que nos ha traído hasta aquí: estabilidad, constancia y cohesión de grupo.
                    </p>

                    <p className="text-lg text-blue-100/60 leading-relaxed">
                        Si encajas en este enfoque y buscas una hermandad seria, sin dramas y con ambición real, <strong className="text-white font-black">Artic Tempest</strong> es tu sitio.
                    </p>
                </div>
            </section>

            <LandingFooter />
        </main>
    )
}
