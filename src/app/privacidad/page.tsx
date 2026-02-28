// src/app/privacidad/page.tsx
import { LandingNavigation } from "@/components/landing/navigation"
import { LandingFooter } from "@/components/landing/footer"
import Link from "next/link"
import Image from "next/image"
import { IconShieldCheck, IconLock, IconEye, IconTrash, IconFileText } from "@tabler/icons-react"

import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Política de Privacidad | Artic Tempest",
    description: "Información sobre cómo tratamos tus datos personales en cumplimiento con el RGPD y la LOPD."
}

export default function PrivacidadPage() {
    return (
        <main className="min-h-screen bg-black flex flex-col relative overflow-hidden dark">
            {/* Background Image & Decor */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden h-full w-full">
                <Image
                    src="/assets/images/housing-contact.webp"
                    alt="Background"
                    fill
                    className="object-cover blur-[2px] opacity-30 scale-105"
                    sizes="100vw"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
            </div>

            <LandingNavigation />

            <div className="relative z-10 flex-1 py-32 px-6 max-w-4xl mx-auto">
                <header className="mb-16 text-center">
                    <div className="inline-flex bg-blue-500/10 p-4 rounded-3xl border border-blue-500/20 mb-6">
                        <IconShieldCheck className="size-10 text-blue-400" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">Política de Privacidad</h1>
                    <p className="text-white/40 font-medium uppercase tracking-[0.2em] text-sm italic">Protegiendo tu identidad en la tempestad</p>
                </header>

                <div className="prose prose-invert max-w-none space-y-16">
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <IconFileText className="text-blue-400 size-6" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight m-0">1. Compromiso RGPD</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            Artic Tempest (en adelante, &quot;la Hermandad&quot;) se compromete a proteger la privacidad de sus miembros y usuarios cumpliendo estrictamente con el <strong>Reglamento General de Protección de Datos (RGPD)</strong> UE 2016/679 y la Ley Orgánica 3/2018 (LOPD-GDD). Tratamos tus datos con la máxima confidencialidad y solo para los fines necesarios de la comunidad.
                        </p>
                    </section>

                    <section className="bg-white/5 p-8 md:p-12 rounded-[40px] border border-white/10 backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-8">
                            <IconEye className="text-blue-400 size-6" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight m-0">2. Información que recopilamos</h2>
                        </div>
                        <div className="grid gap-8">
                            <div className="space-y-4">
                                <h3 className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-blue-500" />
                                    Autenticación Oficial
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    No almacenamos contraseñas. Utilizamos OAuth2 de Discord y Battle.net. Al vincular tus cuentas, recibimos un ID único, tu nombre de usuario y roles. Esta es la base legal de <strong>interés legítimo</strong> para el funcionamiento de la hermandad.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-blue-500" />
                                    Formularios y Sugerencias
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    Al usar el formulario de Feedback o Reclutamiento, recogemos los datos que nos facilitas (nombre, email, mensajes e imágenes). Estos datos se usan exclusivamente para dar respuesta a tu solicitud bajo tu <strong>consentimiento explícito</strong>.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <IconLock className="text-blue-400 size-6" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight m-0">3. Seguridad de los datos</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed">
                            Implementamos medidas técnicas de alto nivel para evitar la pérdida o alteración de tus datos. Nuestra infraestructura se apoya en <strong>Supabase (PostgreSQL)</strong> con cifrado en reposo y tránsito (SSL/TLS v1.3). El acceso a la información sensible está restringido exclusivamente a los Administradores y Officers de la Hermandad.
                        </p>
                    </section>

                    <section className="bg-blue-500/5 p-10 rounded-[40px] border border-blue-500/10">
                        <div className="flex items-center gap-3 mb-6">
                            <IconTrash className="text-blue-400 size-6" />
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight m-0 text-blue-100">4. Tus Derechos (ARCO)</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed mb-6 italic">
                            Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al tratamiento de tus datos.
                        </p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
                            {[
                                "Desvinculación instantánea desde Ajustes.",
                                "Derecho al olvido (borrado completo).",
                                "Portabilidad de tus estadísticas.",
                                "Limitación del tratamiento."
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-white/50 font-bold uppercase tracking-tighter">
                                    <IconShieldCheck className="size-5 text-blue-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <div className="mt-8 pt-8 border-t border-blue-500/20">
                            <p className="text-xs text-blue-400 font-bold uppercase tracking-widest leading-relaxed">
                                Para ejercer estos derechos o informar de una brecha de seguridad, contacta inmediatamente con nosotros desde <Link href="/feedback" className="text-white hover:text-blue-300 underline decoration-blue-500/30 transition-colors">este enlace</Link>.
                            </p>
                        </div>
                    </section>

                    <footer className="text-center pt-10 text-white/20 text-[10px] uppercase font-black tracking-[0.3em]">
                        Última actualización: 28 de Febrero, 2026
                    </footer>
                </div>
            </div>

            <LandingFooter />
        </main>
    )
}
