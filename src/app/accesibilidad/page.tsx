import { LandingNavigation } from "@/domains/landing/components/navigation"
import { LandingFooter } from "@/domains/landing/components/footer"

export const metadata = {
  title: "Declaración de Accesibilidad | Artic Tempest",
  description: "Declaración de accesibilidad de Artic Tempest conforme a las pautas WCAG 2.1 y la normativa europea.",
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
            <h2 id="compromise-title" className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">Nuestro Compromiso</h2>
            <p>
              Artic Tempest se ha comprometido a hacer accesible su sitio web, de conformidad con el Real Decreto 1112/2018, de 7 de septiembre (transposición de la Directiva UE 2016/2102). 
              Nuestro objetivo es que el sitio sea usable para el mayor número de personas posible, independientemente de su tecnología o capacidad.
            </p>
          </section>

          <section aria-labelledby="situation-title">
            <h2 id="situation-title" className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">Situación de Cumplimiento</h2>
            <p>
              Este sitio web es **parcialmente conforme** con las pautas WCAG 2.1 nivel AA. Estamos trabajando activamente para alcanzar el nivel de cumplimiento total y preparándonos para la nueva normativa WCAG 2.2.
            </p>
          </section>

          <section aria-labelledby="features-title">
            <h2 id="features-title" className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">Mejoras Implementadas</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>**Navegación por teclado**: Inclusión de un enlace de "Saltar al contenido" y visibilidad clara del foco.</li>
              <li>**Estructura Semántica**: Uso correcto de hitos (landings) y jerarquía de encabezados.</li>
              <li>**Contraste de Color**: Optimización de colores para asegurar la legibilidad del texto sobre fondos oscuros.</li>
              <li>**Diseño Responsive**: Adaptación fluida a diferentes tamaños de pantalla y dispositivos.</li>
            </ul>
          </section>

          <section aria-labelledby="contact-title">
            <h2 id="contact-title" className="text-2xl font-bold text-white mb-4 uppercase tracking-tight">Contacto y Sugerencias</h2>
            <p>
              Si encuentras alguna barrera de accesibilidad o tienes sugerencias para mejorar la experiencia, no dudes en contactar con nosotros a través de nuestro 
              <a href="https://discord.gg/artictempest" className="text-blue-400 font-bold hover:underline ml-1">Discord Oficial</a>.
            </p>
          </section>

          <p className="text-sm italic pt-8 border-t border-white/10">
            Última revisión: 17 de marzo de 2026.
          </p>
        </div>
      </div>

      <LandingFooter />
    </div>
  )
}
