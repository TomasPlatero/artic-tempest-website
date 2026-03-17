import { LandingNavigation } from "@/domains/landing/components/navigation"
import { LandingFooter } from "@/domains/landing/components/footer"
import Link from "next/link"

export const metadata = {
  title: "Declaración de Accesibilidad | Artic Tempest",
  description: "Información detallada sobre el compromiso de accesibilidad de Artic Tempest y cómo solicitar asistencia técnica.",
}

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <LandingNavigation />
      
      <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8">
          Declaración de Accesibilidad
        </h1>

        <div className="space-y-8 text-blue-100/80 leading-relaxed text-lg">
          <section aria-labelledby="compromise-title">
            <h2 id="compromise-title" className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">Compromiso con la Inclusión</h2>
            <p>
              En Artic Tempest nos esforzamos por garantizar que nuestra plataforma digital sea accesible para todos los miembros de la comunidad, independientemente de sus capacidades físicas o cognitivas. Seguimos las pautas del Real Decreto 1112/2018 para asegurar un entorno digital equitativo y sin barreras.
            </p>
          </section>

          <section aria-labelledby="situation-title">
            <h2 id="situation-title" className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">Estado de Cumplimiento</h2>
            <p>
              Nuestro sitio web se encuentra actualmente en un estado de **Conformidad Parcial** con las pautas WCAG 2.1 nivel AA. Estamos en un proceso de auditoría y mejora continua para alcanzar el cumplimiento total y adaptarnos de forma proactiva a las nuevas exigencias de la Directiva Europea.
            </p>
          </section>

          <section aria-labelledby="features-title">
            <h2 id="features-title" className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">Funcionalidades de Apoyo</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>**Asistencia de Navegación**: Implementación de enlaces de salto para facilitar el acceso directo al contenido principal.</li>
              <li>**Interactividad Clara**: Diferenciación visual de elementos interactivos y gestión activa del foco de teclado.</li>
              <li>**Arquitectura de Información**: Organización jerárquica de contenidos para facilitar la lectura mediante tecnologías de asistencia.</li>
              <li>**Optimización de Contraste**: Garantía de niveles de legibilidad adecuados bajo cualquier modo de visualización.</li>
            </ul>
          </section>

          <section aria-labelledby="contact-title" className="bg-blue-500/5 border border-blue-500/10 p-8 rounded-3xl">
            <h2 id="contact-title" className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">¿Necesitas Ayuda o Reportar un Problema?</h2>
            <p className="mb-6">
              Si encuentras dificultades para acceder a cualquier parte de nuestro sitio o crees que algún contenido no cumple con los estándares de accesibilidad, estamos aquí para escucharte y ayudarte.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/ayuda" 
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-50 text-white hover:text-blue-900 font-bold rounded-xl transition-all uppercase text-sm tracking-widest"
              >
                Ir al Centro de Ayuda
              </Link>
            </div>
          </section>

          <p className="text-sm italic pt-8 border-t border-white/10">
            Esta declaración fue redactada el 22 de febrero de 2026 y actualizada tras la última auditoría técnica el 17 de marzo de 2026.
          </p>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
