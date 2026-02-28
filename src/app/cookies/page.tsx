// src/app/cookies/page.tsx
import { LandingNavigation } from "@/components/landing/navigation"
import { LandingFooter } from "@/components/landing/footer"
import { IconCookie } from "@tabler/icons-react"

export default function CookiesPage() {
    return (
        <main className="min-h-screen bg-black flex flex-col relative overflow-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 bg-[url('/assets/images/wow-raid-hero.jpg')] bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none" />
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

            <LandingNavigation />

            <div className="relative z-10 flex-1 py-24 px-6 max-w-7xl mx-auto">
                <header className="mb-12 flex items-center gap-4">
                    <div className="bg-amber-500/20 p-3 rounded-2xl border border-amber-500/20">
                        <IconCookie className="size-8 text-amber-500" />
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tight">Política de Cookies</h1>
                </header>

                <section className="space-y-12 text-zinc-400 leading-relaxed">
                    <p className="text-lg">
                        Este sitio web utiliza cookies para mejorar la experiencia del usuario y garantizar el funcionamiento seguro de la plataforma, cumpliendo con el <strong>RGPD</strong>, la <strong>LOPD-GDD</strong> y las directrices de la <strong>AEPD de 2024</strong>.
                    </p>

                    <div className="grid gap-6">
                        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-2">
                                <span className="text-amber-500">1.</span> ¿Qué son las cookies?
                            </h2>
                            <p>
                                Las cookies son pequeños archivos de texto que se almacenan en su navegador. Se utilizan para que la web funcione correctamente, para personalizar tu experiencia (como recordar tu idioma o BattleTag) y para obtener datos estadísticos anónimos.
                            </p>
                        </div>

                        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-xl font-bold text-white uppercase mb-6 flex items-center gap-2">
                                <span className="text-amber-500">2.</span> Tipos de cookies y base legal
                            </h2>
                            <div className="space-y-6">
                                <div className="border-l-2 border-amber-500 pl-6">
                                    <h3 className="text-white font-bold mb-2">Cookies Técnicas (Necesarias)</h3>
                                    <p className="text-sm">
                                        Estas cookies son esenciales para el funcionamiento del sitio y no requieren consentimiento. Incluyen la gestión de sesiones (NextAuth) y tus preferencias de privacidad. También se consideran técnicas las de <strong>personalización</strong> cuando son elegidas expresamente por ti (ej: cambio de idioma).
                                    </p>
                                </div>
                                <div className="border-l-2 border-blue-500 pl-6">
                                    <h3 className="text-white font-bold mb-2">Cookies de Análisis y Publicidad</h3>
                                    <p className="text-sm">
                                        Solo se activarán si pulsas en &quot;Aceptar Todas&quot;. Nos permiten medir el rendimiento del sitio y mostrarte contenido relevante. Tienes el derecho de rechazarlas con la misma facilidad con la que las aceptas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-2">
                                <span className="text-amber-500">3.</span> Gestión y Revocación
                            </h2>
                            <p>
                                En cumplimiento con las directivas de la AEPD, nuestro panel de consentimiento presenta las opciones <strong>&quot;Aceptar Todas&quot;</strong> y <strong>&quot;Solo Esenciales&quot;</strong> al mismo nivel jerárquico y visual. Puedes cambiar tu elección en cualquier momento borrando las cookies de tu navegador.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <LandingFooter />
        </main>
    )
}
