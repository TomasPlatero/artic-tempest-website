import { RecruitmentPageClient } from "@/domains/landing/components/recruitment-page-client"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Reclutamiento | Artic Tempest',
    description: 'Únete al roster de Artic Tempest. Buscamos jugadores excepcionales para nuestros grupos de raideo y contenido competitivo en World of Warcraft.',
    alternates: {
        canonical: '/reclutamiento',
    },
    openGraph: {
        title: 'Reclutamiento | Artic Tempest',
        description: 'Únete a las filas de Artic Tempest. Vacantes de reclutamiento abiertas.',
        type: 'website',
    }
}

export default function RecruitmentPage() {
    return <RecruitmentPageClient />
}
