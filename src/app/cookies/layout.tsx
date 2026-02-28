import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Política de Cookies - Artic Tempest",
    description: "Información sobre el uso de cookies en la plataforma Artic Tempest.",
    robots: {
        index: false,
        follow: true
    }
}

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
