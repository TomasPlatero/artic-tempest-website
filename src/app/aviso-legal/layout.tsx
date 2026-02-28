import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Aviso Legal - Artic Tempest",
    description: "Información legal y términos de uso del sitio web de la hermandad Artic Tempest.",
    robots: {
        index: false,
        follow: true
    }
}

export default function AvisoLegalLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
