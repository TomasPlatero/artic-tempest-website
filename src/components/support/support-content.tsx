"use client"

import { FeedbackClient } from "@/components/feedback/feedback-client"
import { useSession } from "next-auth/react"
import {
    IconMessageCircle,
    IconHelp,
    IconBook,
    IconLifebuoy,
    IconUser,
    IconCalendar,
    IconSword,
    IconUsers,
    IconApi,
    IconLock
} from "@tabler/icons-react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"
import { LandingNavigation } from "@/components/landing/navigation"
import { LandingFooter } from "@/components/landing/footer"
import Link from "next/link"

export function SupportContent() {
    const { data: session } = useSession()
    const isMember = !!session?.user

    return (
        <main className="min-h-screen bg-black flex flex-col dark overflow-x-hidden">
            <LandingNavigation />

            {/* Hero Section */}
            <div className="pt-40 pb-20 px-6 relative">
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent opacity-50" />

                <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in duration-500">
                        <IconLifebuoy className="size-4" />
                        Support Hub
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                        ¿Cómo podemos <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">ayudarte?</span>
                    </h1>
                    <p className="text-lg text-white/40 font-medium max-w-2xl mx-auto leading-relaxed">
                        Envíanos tus sugerencias para seguir mejorando o revisa nuestras guías si ya eres parte de la hermandad.
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 pb-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <Tabs defaultValue="feedback" className="w-full">
                        <div className="flex justify-center mb-16">
                            <TabsList className="bg-zinc-900/50 p-1.5 rounded-[2rem] border border-white/5 h-auto gap-2 inline-flex backdrop-blur-3xl shadow-2xl overflow-x-auto no-scrollbar">
                                <TabsTrigger
                                    value="feedback"
                                    className="px-8 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-zinc-950 shadow-xl transition-all gap-3"
                                >
                                    <IconMessageCircle className="size-4" />
                                    Buzón de Sugerencias
                                </TabsTrigger>
                                <TabsTrigger
                                    value="guides"
                                    className="px-8 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-zinc-950 shadow-xl transition-all gap-3"
                                >
                                    <IconBook className="size-4" />
                                    Guías Rápidas
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Feedback Content */}
                        <TabsContent value="feedback" className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                                <div className="lg:col-span-12 xl:col-span-5 space-y-8">
                                    <div className="space-y-4 text-center lg:text-left">
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Tu opinión cuenta</h2>
                                        <p className="text-white/50 leading-relaxed font-medium">
                                            ¿Has encontrado un error? ¿Tienes una idea brillante? Cuéntanoslo. Revisamos todos los mensajes que recibimos a través de este formulario.
                                        </p>
                                    </div>

                                    <div className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 space-y-4 shadow-2xl backdrop-blur-3xl">
                                        <div className="size-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                            <IconHelp className="size-6" />
                                        </div>
                                        <h4 className="text-white font-black text-sm uppercase tracking-widest italic">¿Qué ocurre después?</h4>
                                        <p className="text-sm text-white/40 leading-relaxed font-medium">
                                            Tu mensaje llega directamente al equipo de hermandad. Si es un error crítico, lo arreglaremos lo antes posible. Si es una sugerencia, se discutirá en la próxima reunión de oficiales.
                                        </p>
                                    </div>
                                </div>
                                <div className="lg:col-span-12 xl:col-span-7 bg-zinc-900/40 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl">
                                    <FeedbackClient />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Guides Content */}
                        <TabsContent value="guides" className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {!isMember ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-8 animate-in zoom-in duration-500">
                                    <div className="size-24 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-3xl">
                                        <IconLock className="size-10" />
                                    </div>
                                    <div className="space-y-3">
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Acceso Restringido</h2>
                                        <p className="text-white/40 font-medium max-w-md mx-auto leading-relaxed">
                                            Las guías rápidas y manuales de la hermandad solo están disponibles para miembros verificados de Artic Tempest.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/20">
                                        Inicia sesión para desbloquear este contenido
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        { title: "Primeros Pasos", desc: "Cómo vincular tu cuenta de Discord y Battle.net correctamente.", icon: <IconUser className="size-6" />, color: "text-blue-400", href: "/ayuda/guias/primeros-pasos" },
                                        { title: "Calendario Raid", desc: "Uso del calendario y cómo confirmar tu asistencia en segundos.", icon: <IconCalendar className="size-6" />, color: "text-emerald-400", href: "/ayuda/guias/asistencia-raid" },
                                        { title: "Best-in-Slot", desc: "Cómo gestionar tu Wishlist y sincronizarla con el bot.", icon: <IconSword className="size-6" />, color: "text-amber-400", href: "/ayuda/guias/best-in-slot" },
                                    ].map((guide, idx) => (
                                        <Link href={guide.href} key={idx} className="block group">
                                            <Card className="bg-zinc-900/40 border-white/5 group-hover:border-white/10 transition-all rounded-[2rem] overflow-hidden group-hover:bg-white/[0.03] shadow-2xl backdrop-blur-3xl h-full">
                                                <CardHeader className="p-8">
                                                    <div className={cn("size-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", guide.color)}>
                                                        {guide.icon}
                                                    </div>
                                                    <CardTitle className="text-xl font-black text-white uppercase tracking-tight">{guide.title}</CardTitle>
                                                    <CardDescription className="text-white/40 font-medium leading-relaxed pt-2">{guide.desc}</CardDescription>
                                                </CardHeader>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <LandingFooter />
        </main>
    )
}
