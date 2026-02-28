// src/app/aviso-legal/page.tsx
import { LandingNavigation } from "@/components/landing/navigation"
import { LandingFooter } from "@/components/landing/footer"
import { IconScale } from "@tabler/icons-react"

export default function AvisoLegalPage() {
    return (
        <main className="min-h-screen bg-black flex flex-col relative overflow-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 bg-[url('/assets/images/wow-raid-hero.jpg')] bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none" />
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

            <LandingNavigation />

            <div className="relative z-10 flex-1 py-24 px-6 max-w-7xl mx-auto">
                <header className="mb-12 flex items-center gap-4">
                    <div className="bg-emerald-500/20 p-3 rounded-2xl border border-emerald-500/20">
                        <IconScale className="size-8 text-emerald-500" />
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tight">Aviso Legal</h1>
                </header>

                <section className="space-y-12 text-zinc-400 leading-relaxed">
                    <p className="text-lg">
                        En cumplimiento con el artículo 10 de la Ley 34/2002 (LSSI-CE), se identifican los responsables de la gestión de este sitio web.
                    </p>

                    <div className="grid gap-6">
                        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-2">
                                <span className="text-emerald-500">1.</span> Información General
                            </h2>
                            <ul className="list-disc pl-6 space-y-2 text-sm">
                                <li><strong>Titular:</strong> Hermandad &quot;Artic Tempest&quot; (EU-Dun Modr)</li>
                                <li><strong>Actividad:</strong> Organización de actividades recreativas en World of Warcraft.</li>
                                <li><strong>Contacto:</strong> admin@artictempest.es o a través de nuestro servidor de Discord.</li>
                            </ul>
                        </div>

                        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-2">
                                <span className="text-emerald-500">2.</span> Propiedad Intelectual
                            </h2>
                            <p>
                                Los contenidos propios (textos, logos de la hermandad) son propiedad de Artic Tempest. Las marcas y contenidos visuales de <strong>World of Warcraft</strong> son propiedad de Blizzard Entertainment, Inc.
                            </p>
                        </div>

                        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-2">
                                <span className="text-emerald-500">3.</span> Responsabilidad
                            </h2>
                            <p>
                                Este portal es una herramienta de gestión para la hermandad. No nos hacemos responsables de las interrupciones del servicio ni de las opiniones vertidas por los usuarios en sus perfiles de personajes.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <LandingFooter />
        </main>
    )
}
