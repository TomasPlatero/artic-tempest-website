"use client"

import { useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { IconBrandDiscord, IconShieldCheck, IconArrowLeft, IconInfoCircle, IconUserCheck, IconLock } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export function LoginPageClient() {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/")
        }
    }, [status, router])

    if (status === "loading") {
        return <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
    }

    return (
        <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden dark font-sans">
            {/* Background Image & Decor */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden h-full w-full">
                <Image
                    src="/assets/images/midnight-cinematic.webp"
                    alt="Background"
                    fill
                    className="object-cover blur-[2px] opacity-40 scale-105"
                    sizes="100vw"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/95 via-black/30 to-blue-900/10" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

                {/* Floating Bokeh / Lights */}
                <div className="absolute top-1/4 left-1/4 size-96 bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 size-96 bg-purple-500/5 blur-[120px] rounded-full animate-pulse [animation-delay:1s]" />
            </div>

            {/* Main Login Container */}
            <div className="relative z-10 w-full max-w-2xl px-4 animate-in fade-in zoom-in duration-700">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-full flex items-center justify-between md:justify-center mb-8 gap-4">
                        {/* Back Button - Responsive Positioning */}
                        <Link
                            href="/"
                            className="group flex items-center gap-2 text-white/50 hover:text-white transition-all font-black uppercase text-[10px] tracking-[0.2em] backdrop-blur-md bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 md:fixed md:top-10 md:left-10"
                        >
                            <IconArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="md:hidden">Volver</span>
                            <span className="hidden md:inline">Volver al Inicio</span>
                        </Link>

                        {/* Logo Wrapper */}
                        <div className="relative w-36 h-12 md:w-64 md:h-24 drop-shadow-[0_0_35px_rgba(59,130,246,0.3)]">
                            <Image
                                src="/assets/brand/logo-texto.webp"
                                alt="Artic Tempest Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>

                        {/* Spacer for symmetry on mobile */}
                        <div className="w-16 md:hidden pointer-events-none opacity-0" />
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none mb-4">
                        Conéctate a <br /> Artic <span className="text-blue-400"> Tempest</span>
                    </h1>
                    <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs max-w-sm italic">
                        Acceso para miembros y aspirantes a la hermandad
                    </p>
                </div>

                <Card className="mt-4 bg-zinc-950/40 border-white/[0.08] backdrop-blur-3xl rounded-[3rem] p-8 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.8)] ring-1 ring-white/10 overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

                    <div className="space-y-8">
                        <section className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <IconInfoCircle className="size-5 text-blue-400" />
                                </div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Acceso Unificado</h3>
                            </div>
                            <p className="text-white/60 leading-relaxed text-sm font-medium">
                                Para una experiencia fluida, utilizamos <strong className="text-white">Discord</strong> tanto para el registro inicial como para el acceso diario. No necesitamos contraseñas adicionales.
                            </p>
                        </section>

                        <div className="space-y-4 py-4">
                            <Button
                                onClick={() => signIn('discord', { callbackUrl: '/' })}
                                className="w-full flex h-16 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-black uppercase text-xs tracking-[0.2em] shadow-[0_15px_40px_rgba(88,101,242,0.3)] hover:shadow-[0_15px_60px_rgba(88,101,242,0.5)] transition-all duration-500 active:scale-95 gap-3 group"
                            >
                                <IconBrandDiscord className="size-6 group-hover:rotate-12 transition-transform" />
                                Continuar con Discord
                            </Button>

                            <p className="text-center text-[10px] text-white/30 font-bold uppercase tracking-widest px-8">
                                Al continuar, aceptas que vinculemos tu perfil de Discord con tu cuenta de la Hermandad.
                            </p>
                        </div>

                        <Separator className="bg-white/10" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2">
                                    <IconUserCheck className="size-3" />
                                    Datos que recibimos
                                </h4>
                                <ul className="space-y-2 p-0 m-0 list-none">
                                    {['ID Único', 'Nombre de Usuario', 'Avatar / Perfil', 'Roles de Servidor'].map((item, i) => (
                                        <li key={i} className="text-[11px] font-bold text-white/40 flex items-center gap-2">
                                            <div className="size-1 rounded-full bg-blue-500/40" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-2">
                                    <IconLock className="size-3" />
                                    Seguridad RGPD
                                </h4>
                                <p className="text-[10px] leading-relaxed text-white/40 font-medium">
                                    Tus datos se tratan bajo cumplimiento del RGPD. No compartimos información con terceros y puedes revocar el acceso en cualquier momento.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 text-center">
                            <Link
                                href="/privacidad"
                                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors underline underline-offset-4 decoration-white/10 hover:decoration-white/40"
                            >
                                Ver Política de Privacidad Completa
                            </Link>
                        </div>
                    </div>
                </Card>

                {/* Footer Info */}
                <div className="mt-12 flex flex-col items-center gap-4 text-center">
                    <p className="max-w-xs text-[9px] text-white/20 font-medium leading-loose uppercase tracking-[0.1em]">
                        Si tienes problemas al iniciar sesión, visita nuestra <Link href="/ayuda" className="text-white/40 hover:text-white underline underline-offset-4 decoration-white/10 transition-colors font-bold">Página de Ayuda</Link> o contacta con un oficial en Discord.
                    </p>
                </div>
            </div>
        </main>
    )
}
