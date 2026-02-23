import Link from "next/link"
import { IconArrowLeft, IconCookie } from "@tabler/icons-react"

export default function CookiesPolicyPage() {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 bg-[url('/assets/images/wow-raid-hero.jpg')] bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none" />
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />

            <div className="relative z-10 flex-1 container mx-auto max-w-4xl p-6 md:p-12">
                <header className="mb-10 flex items-center gap-4">
                    <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                        <IconArrowLeft className="size-6" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <IconCookie className="size-8 text-amber-500" />
                        <h1 className="text-3xl md:text-4xl font-bold font-serif text-amber-500 drop-shadow-md">
                            Política de Cookies
                        </h1>
                    </div>
                </header>

                <main className="prose prose-invert prose-amber max-w-none space-y-6">
                    <section className="bg-white/5 p-6 rounded-lg border border-white/10 shadow-lg backdrop-blur-sm">
                        <h2 className="text-2xl font-semibold mb-4 text-white">1. ¿Qué son las cookies?</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Las cookies son pequeños archivos de texto que los sitios web que visitas colocan en tu ordenador o dispositivo móvil. Se utilizan ampliamente para hacer que los sitios web funcionen, o funcionen de manera más eficiente, así como para proporcionar información a los propietarios del sitio. Todo de acuerdo al RGPD (Reglamento General de Protección de Datos) y la LOPD.
                        </p>
                    </section>

                    <section className="bg-white/5 p-6 rounded-lg border border-white/10 shadow-lg backdrop-blur-sm">
                        <h2 className="text-2xl font-semibold mb-4 text-white">2. Qué cookies utilizamos</h2>
                        <ul className="space-y-4">
                            <li className="flex gap-4 items-start">
                                <div className="mt-1 bg-amber-500/20 p-2 rounded shrink-0">
                                    <IconCookie className="size-5 text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-amber-300">Cookies Técnicas o Estrictamente Necesarias</h3>
                                    <p className="text-muted-foreground mt-1">
                                        Estas cookies son esenciales para que puedas navegar por la aplicación y usar sus funciones, como acceder a áreas seguras o mantener tu sesión activa con Battle.net/Discord. No se puede rechazar el uso de estas cookies ya que son imprescindibles para prestar el servicio.
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-4 items-start">
                                <div className="mt-1 bg-blue-500/20 p-2 rounded shrink-0">
                                    <IconCookie className="size-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-blue-300">Cookies de Preferencias y Análisis</h3>
                                    <p className="text-muted-foreground mt-1">
                                        Permiten a la aplicación recordar información que cambia la forma en que esta se comporta o se ve. También nos ayudan indirectamente a entender de forma anónima cómo interactúan los visitantes mediante informes estadísticos de carga, sin identificar personalmente a nadie.
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </section>

                    <section className="bg-white/5 p-6 rounded-lg border border-white/10 shadow-lg backdrop-blur-sm">
                        <h2 className="text-2xl font-semibold mb-4 text-white">3. Cómo gestionar o rechazar las cookies</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            En el momento en que entras a la aplicación, se te mostrará un aviso permitiéndote "Aceptar todas" o usar "Solo Esenciales". Al guardar "Solo esenciales", el sistema memorizará en tu navegador que has declinado todo lo que no sea necesario para logearte. Si deseas revocar este consentimiento en el futuro, puedes simplemente limpiar el almacenamiento local o las cookies desde las configuraciones de seguridad de tu propio navegador web.
                        </p>
                    </section>
                </main>
            </div>
        </div>
    )
}
