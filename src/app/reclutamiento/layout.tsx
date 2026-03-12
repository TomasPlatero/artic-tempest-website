import { Metadata } from "next"
import { BreadcrumbJsonLd } from "@/shared/seo/json-ld"

const baseUrl = process.env.NEXTAUTH_URL || 'https://artictempest.com'

export const metadata: Metadata = {
    title: "Reclutamiento – Artic Tempest | Hermandad WoW",
    description: "Únete a Artic Tempest. Buscamos jugadores comprometidos para raidear en Midnight. Consulta nuestras vacantes, requisitos y envía tu aplicación.",
    alternates: {
        canonical: '/reclutamiento',
    },
    openGraph: {
        title: "Reclutamiento – Artic Tempest",
        description: "Únete a Artic Tempest. Buscamos jugadores comprometidos para raidear en Midnight. Consulta nuestras vacantes y requisitos.",
        type: "website",
        url: `${baseUrl}/reclutamiento`,
    }
}

export default function RecruitmentLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <BreadcrumbJsonLd items={[
                { name: "Inicio", url: baseUrl },
                { name: "Reclutamiento", url: `${baseUrl}/reclutamiento` },
            ]} />
            {children}
        </>
    )
}
