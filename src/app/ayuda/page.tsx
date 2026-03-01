import { Metadata } from "next"
import { SupportContent } from "@/components/support/support-content"

export const metadata: Metadata = {
    title: "Centro de Ayuda | Artic Tempest",
    description: "Soporte técnico, guías de la hermandad y buzón de sugerencias de Artic Tempest."
}

export default function AyudaPage() {
    return <SupportContent />
}
