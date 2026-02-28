import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Reclutamiento - Artic Tempest",
    description: "Únete a Artic Tempest. Buscamos jugadores comprometidos para raidear en Midnight. Consulta nuestras vacantes y requisitos.",
    openGraph: {
        title: "Reclutamiento - Artic Tempest",
        description: "Únete a Artic Tempest. Buscamos jugadores comprometidos para raidear en Midnight.",
        type: "website",
    }
}

export default function RecruitmentLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
