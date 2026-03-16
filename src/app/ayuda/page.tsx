import { Metadata } from "next"
import { SupportContent } from "@/domains/support/components/support-content"
import { LandingNavigation } from "@/domains/landing/components/navigation"
import { LandingFooter } from "@/domains/landing/components/footer"

export const metadata: Metadata = {
    title: "Centro de Ayuda | Artic Tempest – Soporte y Guías",
    description: "Soporte técnico, guías de la hermandad, primeros pasos y buzón de sugerencias de Artic Tempest. Resuelve tus dudas sobre la guild.",
    alternates: {
        canonical: '/ayuda',
    },
    openGraph: {
        title: "Centro de Ayuda – Artic Tempest",
        description: "Soporte técnico, guías de la hermandad y buzón de sugerencias de Artic Tempest.",
        type: "website",
    }
}

export default function AyudaPage() {
    return (
        <main className="min-h-screen bg-black selection:bg-blue-500/30 dark flex flex-col">
            <LandingNavigation />
            <div className="flex-1 pt-24">
                <SupportContent />
            </div>
            <LandingFooter />
        </main>
    )
}
