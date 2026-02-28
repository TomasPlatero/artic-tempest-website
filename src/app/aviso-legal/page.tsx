// src/app/aviso-legal/page.tsx
import { LandingNavigation } from "@/components/landing/navigation"
import { LandingFooter } from "@/components/landing/footer"
import { IconScale, IconUsers, IconCopyright, IconAlertTriangle, IconBriefcase } from "@tabler/icons-react"

import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Aviso Legal | Artic Tempest",
    description: "Marco legal, términos de uso y propiedad intelectual del portal oficial de Artic Tempest."
}

export default function AvisoLegalPage() {
    return (
        <main className="min-h-screen bg-black flex flex-col relative overflow-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 bg-[url('/assets/images/raids/voidspire.webp')] bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none" />
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none" />

            <LandingNavigation />

            <div className="relative z-10 flex-1 py-32 px-6 max-w-4xl mx-auto">
                <header className="mb-16 text-center">
                    <div className="inline-flex bg-emerald-500/10 p-4 rounded-3xl border border-emerald-500/20 mb-6">
                        <IconScale className="size-10 text-emerald-500" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">Aviso Legal</h1>
                    <p className="text-white/40 font-medium uppercase tracking-[0.2em] text-sm italic">Marco normativo y profesionalidad</p>
                </header>

                <div className="prose prose-invert max-w-none space-y-16">
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <IconBriefcase className="text-emerald-500 size-6" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight m-0">1. Datos del Responsable</h2>
                        </div>
                        <div className="bg-zinc-900/50 p-8 rounded-[32px] border border-white/5 space-y-4">
                            <p className="text-zinc-400 leading-relaxed text-sm">
                                En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa que:
                            </p>
                            <ul className="list-none p-0 m-0 space-y-3">
                                <li className="text-sm font-bold text-white/50 border-b border-white/5 pb-2">PROPIETARIO: <span className="text-white ml-2 text-base">Tomas Platero (Zatosh) / Artic Tempest</span></li>
                                <li className="text-sm font-bold text-white/50 border-b border-white/5 pb-2">DOMINIO: <span className="text-emerald-400 ml-2">artictempest.es</span></li>
                                <li className="text-sm font-bold text-white/50 border-b border-white/5 pb-2">CONTACTO: <span className="text-white ml-2">taplatero@outlook.es</span></li>
                                <li className="text-sm font-bold text-white/50">FINALIDAD: <span className="text-white ml-2">Gestión de comunidad competitiva de WoW y panel de herramientas para miembros.</span></li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <IconCopyright className="text-emerald-500 size-6" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight m-0">2. Propiedad Intelectual e Industrial</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed">
                            Artic Tempest es el titular de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma. Queda expresamente prohibida la reproducción total o parcial de los textos o recursos gráficos propios sin consentimiento.
                        </p>
                        <div className="mt-6 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4 items-start">
                            <IconAlertTriangle className="size-6 text-amber-500 shrink-0" />
                            <p className="text-xs text-amber-200/60 leading-relaxed italic">
                                <strong>Nota sobre Blizzard:</strong> World of Warcraft y Blizzard Entertainment son marcas comerciales o marcas comerciales registradas de Blizzard Entertainment, Inc. en los EE. UU. y/o otros países. Los recursos visuales de WoW utilizados en esta web pertenecen a sus respectivos dueños.
                            </p>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <IconUsers className="text-emerald-500 size-6" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight m-0">3. Condiciones de Uso</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed">
                            El acceso a este portal implica la aceptación de las normas de convivencia de la Hermandad. El usuario se compromete a hacer un uso adecuado de los contenidos y servicios (como los formularios de feedback y reclutamiento), comprometiéndose a no emplearlos para actividades ilícitas o contrarias a la buena fe y al orden público.
                        </p>
                    </section>

                    <footer className="text-center pt-10 text-white/20 text-[10px] uppercase font-black tracking-[0.3em]">
                        Documento actualizado bajo LSSI-CE 2026
                    </footer>
                </div>
            </div>

            <LandingFooter />
        </main>
    )
}
