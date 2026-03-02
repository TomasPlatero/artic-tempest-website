// src/app/cookies/page.tsx
import { LandingNavigation } from "@/components/landing/navigation"
import { LandingFooter } from "@/components/landing/footer"
import Image from "next/image"
import { IconCookie, IconCheck, IconSettings, IconInfoCircle, IconChartBar } from "@tabler/icons-react"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Política de Cookies | Artic Tempest",
    description: "Detalles sobre las cookies técnicas, personalización y rendimiento utilizadas en la web de Artic Tempest."
}

export default function CookiesPage() {
    return (
        <main className="min-h-screen bg-black flex flex-col relative overflow-hidden">
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
                    <div className="inline-flex bg-amber-500/10 p-4 rounded-3xl border border-amber-500/20 mb-6">
                        <IconCookie className="size-10 text-amber-500" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">Política de Cookies</h1>
                    <p className="text-white/40 font-medium uppercase tracking-[0.2em] text-sm italic">Transparencia en cada bit</p>
                </header>

                <div className="prose prose-invert max-w-none space-y-16">
                    <section>
                        <div className="flex items-start gap-3 mb-6">
                            <IconInfoCircle className="text-amber-500 size-8 shrink-0 mt-1" />
                            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight !m-0 !leading-snug">1. ¿Qué son las Cookies?</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            Las cookies son pequeños ficheros de datos que se descargan en tu navegador al acceder a nuestra web. En Artic Tempest las usamos exclusivamente para que el sitio funcione de manera segura (mantener tu sesión), recordar tus preferencias y comprender cómo interactúas con nosotros para mejorar el servicio.
                        </p>
                    </section>

                    <section className="bg-zinc-900/80 p-6 md:p-12 rounded-[40px] border border-white/5 backdrop-blur-md">
                        <div className="flex items-start gap-3 mb-8">
                            <IconSettings className="text-amber-500 size-8 shrink-0 mt-1" />
                            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight !m-0 !leading-snug">2. Cookies que utilizamos</h2>
                        </div>
                        <div className="space-y-8">
                            <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <IconCheck className="size-16 text-green-400" />
                                </div>
                                <h3 className="text-white font-black text-sm md:text-base md:mb-4 uppercase tracking-[0.2em] mb-3 !mt-0">Técnicas y Necesarias</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl mb-6">
                                    Son esenciales para que puedas iniciar sesión con Discord o Battle.net. No pueden desactivarse ya que la web dejaría de funcionar de forma segura. No recogen información con fines comerciales.
                                </p>

                                <Accordion type="single" collapsible className="w-full space-y-2">
                                    <AccordionItem value="auth-1" className="bg-black/40 border-white/5 rounded-xl px-4 data-[state=open]:bg-black/60 transition-colors">
                                        <AccordionTrigger className="text-white hover:no-underline font-bold text-sm">
                                            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>__Secure-next-auth.session-token</span>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-zinc-400 text-sm leading-relaxed">
                                            <strong>Tipo:</strong> Necesaria (De origen)<br />
                                            <strong>Propósito:</strong> Mantiene tu sesión segura y encriptada al iniciar sesión en nuestro dashboard.<br />
                                            <strong>Duración:</strong> 30 días o hasta el cierre de sesión.
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="auth-2" className="bg-black/40 border-white/5 rounded-xl px-4 data-[state=open]:bg-black/60 transition-colors">
                                        <AccordionTrigger className="text-white hover:no-underline font-bold text-sm">
                                            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>__Host-next-auth.csrf-token</span>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-zinc-400 text-sm leading-relaxed">
                                            <strong>Tipo:</strong> Necesaria (De origen)<br />
                                            <strong>Propósito:</strong> Protección contra ataques de falsificación de peticiones en sitios cruzados (CSRF). Vital para la seguridad de autenticación.<br />
                                            <strong>Duración:</strong> Sesión.
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="auth-3" className="bg-black/40 border-white/5 rounded-xl px-4 data-[state=open]:bg-black/60 transition-colors">
                                        <AccordionTrigger className="text-white hover:no-underline font-bold text-sm">
                                            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>__Secure-next-auth.callback-url</span>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-zinc-400 text-sm leading-relaxed">
                                            <strong>Tipo:</strong> Necesaria (De origen)<br />
                                            <strong>Propósito:</strong> Almacena temporalmente la ruta previa para redirigirte correctamente tras hacer login.<br />
                                            <strong>Duración:</strong> Sesión.
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>

                            <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <IconSettings className="size-16 text-blue-400" />
                                </div>
                                <h3 className="text-white font-black text-sm md:text-base md:mb-4 uppercase tracking-[0.2em] mb-3 !mt-0">Personalización</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl mb-6">
                                    Se utilizan para recordar las opciones que has elegido en el sitio web (como el modo claro/oscuro) para brindarte una experiencia más adaptada.
                                </p>

                                <Accordion type="single" collapsible className="w-full space-y-2">
                                    <AccordionItem value="theme-1" className="bg-black/40 border-white/5 rounded-xl px-4 data-[state=open]:bg-black/60 transition-colors">
                                        <AccordionTrigger className="text-white hover:no-underline font-bold text-sm">
                                            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>theme / next-theme</span>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-zinc-400 text-sm leading-relaxed">
                                            <strong>Tipo:</strong> Funcional (De origen)<br />
                                            <strong>Propósito:</strong> Recuerda si seleccionaste la visualización con modo luz o modo oscuro en el dashboard (por defecto forzado oscuro en la landing).<br />
                                            <strong>Duración:</strong> Permanente, hasta ser borrada por el usuario.
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>

                            <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <IconChartBar className="size-16 text-purple-400" />
                                </div>
                                <h3 className="text-white font-black text-sm md:text-base md:mb-4 uppercase tracking-[0.2em] mb-3 !mt-0">Análisis y Rendimiento (Opcionales)</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl mb-6">
                                    Nos permiten realizar un seguimiento de cómo se comporta el sitio para medir nuestro impacto, detectar errores y analizar campañas de publicidad de la guild y la marca mediante Vercel / Google Tag Manager.
                                </p>

                                <Accordion type="single" collapsible className="w-full space-y-2">
                                    <AccordionItem value="analytics-1" className="bg-black/40 border-white/5 rounded-xl px-4 data-[state=open]:bg-black/60 transition-colors">
                                        <AccordionTrigger className="text-white hover:no-underline font-bold text-sm">
                                            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>_ga / _ga_*</span>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-zinc-400 text-sm leading-relaxed">
                                            <strong>Tipo:</strong> Analítica (Terceros: Google)<br />
                                            <strong>Propósito:</strong> Se utiliza para distinguir a visitantes, generar datos estadísticos agregados del comportamiento del usuario y medir el impacto.<br />
                                            <strong>Duración:</strong> 2 años.
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="analytics-2" className="bg-black/40 border-white/5 rounded-xl px-4 data-[state=open]:bg-black/60 transition-colors">
                                        <AccordionTrigger className="text-white hover:no-underline font-bold text-sm">
                                            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>_gid</span>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-zinc-400 text-sm leading-relaxed">
                                            <strong>Tipo:</strong> Analítica (Terceros: Google)<br />
                                            <strong>Propósito:</strong> Asigna un número único y aleatorio a las páginas visitadas para analizar la ruta o interacción del usuario dentro de una misma sesión (Google Analytics).<br />
                                            <strong>Duración:</strong> 24 horas.
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="analytics-3" className="bg-black/40 border-white/5 rounded-xl px-4 data-[state=open]:bg-black/60 transition-colors">
                                        <AccordionTrigger className="text-white hover:no-underline font-bold text-sm">
                                            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>_gcl_au / _gcl_aw</span>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-zinc-400 text-sm leading-relaxed">
                                            <strong>Tipo:</strong> Análisis Comercial (Terceros: Google)<br />
                                            <strong>Propósito:</strong> Usadas por Google AdSense o Google Ads para experimentar con la eficiencia publicitaria a través de la red.<br />
                                            <strong>Duración:</strong> 90 días.
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-start gap-3 mb-6">
                            <IconSettings className="text-amber-500 size-8 shrink-0 mt-1" />
                            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight !m-0 !leading-snug">3. Cómo gestionar las cookies</h2>
                        </div>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            Puedes restringir, bloquear o borrar las cookies de cualquier sitio web utilizando tu navegador. Cada navegador tiene una configuración diferente, pero normalmente se encuentra en el menú de &quot;Preferencias&quot; o &quot;Herramientas de privacidad&quot;.
                            Nuestra política cumple con la normativa actual RGPD (Reglamento General de Protección de Datos).
                        </p>
                    </section>

                    <footer className="text-center pt-10 text-white/20 text-xs uppercase font-black tracking-[0.2em]">
                        Las cookies de Artic Tempest están designadas para ofrecer la máxima seguridad e integridad a nuestros usuarios y Raideadores.
                    </footer>
                </div>
            </div>

            <LandingFooter />
        </main>
    )
}
