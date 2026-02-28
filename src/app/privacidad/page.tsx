// src/app/privacidad/page.tsx
import { LandingNavigation } from "@/components/landing/navigation"
import { LandingFooter } from "@/components/landing/footer"
import { IconShieldCheck } from "@tabler/icons-react"

export default function PrivacidadPage() {
    return (
        <main className="min-h-screen bg-black flex flex-col relative overflow-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 bg-[url('/assets/images/wow-raid-hero.jpg')] bg-cover bg-center bg-no-repeat opacity-10 pointer-events-none" />
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

            <LandingNavigation />

            <div className="relative z-10 flex-1 py-24 px-6 max-w-7xl mx-auto">
                <header className="mb-12 flex items-center gap-4">
                    <div className="bg-blue-500/20 p-3 rounded-2xl border border-blue-500/20">
                        <IconShieldCheck className="size-8 text-blue-400" />
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tight">Política de Privacidad</h1>
                </header>

                <section className="space-y-12 text-zinc-400 leading-relaxed">
                    <p className="text-lg">
                        Artic Tempest se compromete a proteger la privacidad de sus miembros y usuarios cumpliendo con el <strong>Reglamento General de Protección de Datos (RGPD)</strong> y la <strong>LOPD-GDD</strong>.
                    </p>

                    <div className="grid gap-6">
                        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-2">
                                <span className="text-blue-400">1.</span> Datos Recopilados
                            </h2>
                            <p className="mb-4">Para el funcionamiento de la plataforma, tratamos datos obtenidos exclusivamente a través de los proveedores oficiales de autenticación:</p>
                            <ul className="list-disc pl-6 space-y-2 text-sm italic">
                                <li><strong>Discord:</strong> ID de usuario, nombre de usuario y roles del servidor.</li>
                                <li><strong>Battle.net:</strong> ID de cuenta, BattleTag y personajes del WoW.</li>
                            </ul>
                        </div>

                        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-2">
                                <span className="text-blue-400">2.</span> Finalidad
                            </h2>
                            <p>Sus datos se utilizan para la gestión del roster, asignación de rangos según su jerarquía en Discord/WoW y visualización de estadísticas de raideo. <strong>Nunca</strong> comercializamos ni cedemos sus datos a terceros fuera de los servicios necesarios para alojar esta web.</p>
                        </div>

                        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h2 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-2">
                                <span className="text-blue-400">3.</span> Conservación y Derechos
                            </h2>
                            <p>Los datos de vinculación se conservan mientras formes parte de la comunidad. Puedes desvincular tus cuentas en cualquier momento desde los ajustes de tu perfil, lo cual eliminará tus datos de personajes de nuestra base de datos. Para cualquier otra consulta, contacta con nosotros en admin@artictempest.es o vía Discord.</p>
                        </div>
                    </div>
                </section>
            </div>

            <LandingFooter />
        </main>
    )
}
