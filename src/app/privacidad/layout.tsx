import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Política de Privacidad - Artic Tempest",
    description: "Política de privacidad y protección de datos de la hermandad Artic Tempest según el RGPD.",
    robots: {
        index: false,
        follow: true
    }
}

export default function PrivacidadLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
