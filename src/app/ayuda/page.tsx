import { Metadata } from "next"
import { SupportContent } from "@/domains/support/components/support-content"

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
    return <SupportContent />
}
