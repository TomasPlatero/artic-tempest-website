// src/app/cookies/page.tsx
import { LandingNavigation } from "@/components/landing/navigation"
import { LandingFooter } from "@/components/landing/footer"
import { IconCookie, IconCheck, IconSettings, IconInfoCircle } from "@tabler/icons-react"

import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Política de Cookies | Artic Tempest",
    description: "Detalles sobre las cookies técnicas y de personalización utilizadas en la web de Artic Tempest."
}

export default function CookiesPage() {
    return (
        <main className="min-h-screen bg-black flex flex-col relative overflow-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 bg-[url('/assets/images/raids/voidspire.webp')] bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none" />
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none" />

            <LandingNavigation />

            <div className="relative z-10 flex-1 py-32 px-6 max-w-4xl mx-auto">
                <header className="mb-16 text-center">
                    <div className="inline-flex bg-amber-500/10 p-4 rounded-3xl border border-amber-500/20 mb-6">
                        <IconCookie className="size-10 text-amber-500" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">Política de Cookies</h1>
                    <p className="text-white/40 font-medium uppercase tracking-[0.2em] text-sm italic">Transparencia en cada bit</p>
                </header>

                <div className="prose prose-invert max-w-none space-y-16">
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <IconInfoCircle className="text-amber-500 size-6" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight m-0">1. ¿Qué son las Cookies?</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            Las cookies son pequeños ficheros de datos que se descargan en tu navegador al acceder a nuestra web. En Artic Tempest las usamos exclusivamente para que el sitio funcione (mantener tu sesión) y para recordar tus preferencias de personalización.
                        </p>
                    </section>

                    <section className="bg-zinc-900/80 p-8 md:p-12 rounded-[40px] border border-white/5 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-8">
                            <IconSettings className="text-amber-500 size-6" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight m-0">2. Cookies que utilizamos</h2>
                        </div>
                        <div className="space-y-8">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <IconCheck className="size-12 text-green-400" />
                                </div>
                                <h3 className="text-white font-black text-sm uppercase tracking-[0.2em] mb-3">Técnicas y Necesarias</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed max-w-xl">
                                    Son esenciales para que puedas iniciar sesión con Discord/Battle.net. No pueden desactivarse ya que la web dejaría de funcionar. No recogen información con fines comerciales.
                                </p>
                            </div>
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5  relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <IconSettings className="size-12 text-blue-400" />
                                </div>
                                <h3 className="text-white font-black text-sm uppercase tracking-[0.2em] mb-3">Personalización</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed max-w-xl">
                                    Se utilizan para recordar si has aceptado este aviso o tu modo de visualización preferido en el dashboard.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <IconSettings className="text-amber-500 size-6" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight m-0">3. Cómo gestionar las cookies</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed">
                            Puedes restringir, bloquear o borrar las cookies de cualquier sitio web utilizando tu navegador. Cada navegador tiene una configuración diferente, pero normalmente se encuentra en el menú de &quot;Preferencias&quot; o &quot;Herramientas&quot;.
                        </p>
                    </section>

                    <footer className="text-center pt-10 text-white/20 text-[10px] uppercase font-black tracking-[0.3em]">
                        Esta web no utiliza cookies de terceros con fines publicitarios.
                    </footer>
                </div>
            </div>

            <LandingFooter />
        </main>
    )
}
