"use client"

import { useState, useEffect } from "react"
import { LandingNavigation } from "@/components/landing/navigation"
import { LandingHero } from "@/components/landing/hero"
import { WantedClasses } from "@/components/landing/wanted-classes"
import { Separator } from "@/components/ui/separator"

interface RaidProgression {
  name: string
  tier?: string
  expansion?: string
  progress: string
  rank: string
  status: string
}

export default function HomePage() {
  const [progression, setProgression] = useState<RaidProgression[]>([
    { name: "La Aguja del Vacío", tier: "Temporada 1", progress: "0/5 M", rank: "-", status: "Próximamente" },
    { name: "La Falla del Sueño", tier: "Temporada 1", progress: "0/1 M", rank: "-", status: "Próximamente" },
    { name: "Marcha sobre Quel'Danas", tier: "Temporada 1", progress: "0/2 M", rank: "-", status: "Próximamente" }
  ])

  useEffect(() => {
    fetch("/api/progression")
      .then(res => res.json())
      .then(data => {
        if (data.progression) setProgression(data.progression)
      })
      .catch(() => { })
  }, [])

  return (
    <main className="min-h-screen bg-black selection:bg-blue-500/30">
      <LandingNavigation />

      <LandingHero />

      <div id="reclutamiento" className="relative z-10 bg-black">
        <WantedClasses />
      </div>

      <Separator className="bg-white/5 max-w-7xl mx-auto" />

      {/* Progress Section */}
      <section id="progreso" className="py-24 px-6 max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-black text-white mb-12 uppercase tracking-tight">Progreso en Midnight</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {progression.map((raid, i) => (
            <div key={raid.name} className={`bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-blue-500/30 transition-all ${raid.status === 'Próximamente' ? 'opacity-50 grayscale blur-[1px]' : ''}`}>
              <p className="text-blue-400 font-bold mb-2 uppercase tracking-widest text-[10px]">{raid.tier || raid.expansion}</p>
              <h3 className="text-xl font-bold text-white mb-4">{raid.name}</h3>
              <div className="text-5xl font-black text-white tracking-tighter mb-2">{raid.progress}</div>
              <p className="text-white/40 text-sm font-medium">{raid.rank !== '-' ? raid.rank : raid.status}</p>
            </div>
          ))}
        </div>
        <p className="mt-12 text-zinc-500 text-xs uppercase tracking-[0.3em] font-bold flex items-center justify-center gap-2">
          <span className="size-1.5 bg-red-500 rounded-full animate-pulse" />
          Live Data from WarcraftLogs
        </p>
      </section>

      <Separator className="bg-white/5 max-w-7xl mx-auto" />

      {/* History Section Placeholder */}
      <section id="historia" className="py-24 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-black text-white mb-8 uppercase">Nuestra Historia</h2>
        <p className="text-lg text-blue-100/60 leading-relaxed mb-6">
          Fundada en el fragor de batallas legendarias, **Artic Tempest** nació con un único propósito: alcanzar la excelencia sin perder la camaradería. Con más de 5 años de trayectoria en el WoW competitivo, somos una de las hermandades más estables y comprometidas de nuestro servidor.
        </p>
        <p className="text-lg text-blue-100/60 leading-relaxed">
          No solo buscamos jugadores con habilidad, buscamos personas que compartan nuestra visión: puntualidad, preparación y el deseo constante de mejorar. Si crees que encajas en este entorno, el frío de la tempestad te espera.
        </p>
      </section>

      <footer className="py-12 border-t border-white/5 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/40 text-sm">
            © {new Date().getFullYear()} Artic Tempest. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">Discord</a>
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">Raider.io</a>
            <a href="#" className="text-white/40 hover:text-white transition-colors text-sm">WarcraftLogs</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
