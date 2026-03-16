"use client"

import { motion } from "framer-motion"
import { Button } from "@/shared/ui/button"
import { IconChevronDown, IconChevronRight, IconSword } from "@tabler/icons-react"
import Link from "next/link"
import Image from "next/image"

export function LandingHero() {
    return (
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
            {/* Background Image Layer with Native Next.js Optimization */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none scale-110 animate-[slow-zoom_20s_infinite_alternate]">
                <Image
                    src="/assets/images/midnight-battle.webp"
                    alt="Midnight Battle Hero"
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                    quality={75}
                />
            </div>
            {/* Advanced Overlays for Maximum Readability */}
            <div className="absolute inset-0 z-1 bg-black/50 pointer-events-none" aria-hidden="true" />
            <div className="absolute inset-0 z-1 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" aria-hidden="true" />

            {/* Central Glow / Blur for Text Focus */}
            <div className="absolute inset-0 z-1 flex items-center justify-center" aria-hidden="true">
                <div className="w-full max-w-4xl h-[400px] bg-blue-900/20 rounded-full blur-[160px] opacity-60" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <h1 className="text-6xl md:text-9xl font-black text-white mb-6 uppercase tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                        Artic <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">Tempest</span>
                    </h1>
                    <div className="relative inline-block mb-10">
                        <div className="absolute inset-0 bg-black/40 blur-2xl rounded-full -m-6" />
                        <p className="relative text-xl md:text-3xl text-blue-50/90 max-w-3xl mx-auto font-bold drop-shadow-2xl leading-tight">
                            Disciplina, progreso y compromiso real. Una hermandad consolidada en Azeroth donde la constancia y el trabajo en equipo convierten objetivos en resultados.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="xl" className="rounded-full w-full sm:w-64 text-lg font-bold group" asChild>
                            <Link href="/reclutamiento">
                                <IconSword className="size-5 mr-2 group-hover:rotate-12 transition-transform" />
                                Únete a nosotros
                                <IconChevronRight className="size-5 ml-1 opacity-50" />
                            </Link>
                        </Button>
                        <Button variant="glass" size="xl" className="rounded-full w-full sm:w-64 text-lg font-bold" asChild>
                            <Link href="#progreso">
                                Ver Progreso
                            </Link>
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.button
                onClick={() => document.getElementById('reclutamiento')?.scrollIntoView({ behavior: 'smooth' })}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors cursor-pointer group z-20 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 8, 0] }}
                transition={{
                    opacity: { duration: 1, delay: 1 },
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                aria-label="Explorar hacia abajo"
            >
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/90 group-hover:text-blue-400 transition-colors">Explorar</span>
                <IconChevronDown className="size-6 text-blue-400 group-hover:text-blue-400 transition-colors" />
            </motion.button>
        </section>
    )
}
