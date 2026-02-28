import { Metadata } from "next"
import Image from "next/image"
import { LandingNavigation } from "@/components/landing/navigation"
import { LandingFooter } from "@/components/landing/footer"
import { FeedbackClient } from "@/components/feedback/feedback-client"

export const metadata: Metadata = {
    title: "Feedback | Artic Tempest",
    description: "Ayúdanos a mejorar. Envía tus sugerencias, errores o ideas sobre la web de la hermandad Artic Tempest."
}

export default function FeedbackPage() {
    return (
        <main className="min-h-screen bg-black flex flex-col dark">
            <LandingNavigation />

            <div className="flex-1 pt-40 pb-20 px-6 relative overflow-hidden">
                <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden">
                    <Image
                        src="/assets/images/housing-contact.webp"
                        alt="Background"
                        fill
                        className="object-cover blur-[2px] opacity-70"
                        sizes="100vw"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-black/40 to-black/90" />
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
                        {/* Title & Info Column */}
                        <div className="flex-1 space-y-8">
                            <div className="space-y-4">
                                <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-tight text-left">
                                    Envíanos tu <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">Feedback</span>
                                </h1>
                                <p className="text-xl text-white/50 font-medium max-w-lg leading-relaxed">
                                    ¿Has encontrado un error? ¿Tienes una idea brillante para la web? Cuéntanoslo todo.
                                </p>
                            </div>

                            <div className="p-6 md:p-8 rounded-[32px] bg-white/5 border border-white/5 flex items-start gap-6 max-w-lg animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
                                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 shrink-0">
                                    <svg className="size-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-white font-black text-sm uppercase tracking-widest">Compromiso con la mejora</h4>
                                    <p className="text-sm text-white/40 leading-relaxed font-medium">
                                        Este proyecto está en constante evolución. Tu feedback llega directamente al equipo de desarrollo y nos ayuda a priorizar las mejoras más importantes para la hermandad.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Form Column */}
                        <div className="w-full lg:w-[600px] shrink-0">
                            <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
                                <FeedbackClient />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <LandingFooter />
        </main>
    )
}
