import { Metadata } from "next"
import { LandingNavigation } from "@/components/landing/navigation"
import { LandingStreamers } from "@/components/landing/streamers"
import { LandingFooter } from "@/components/landing/footer"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { getEnrichedStreamers } from "@/infrastructure/streamers/server-actions"

const baseUrl = process.env.NEXTAUTH_URL || 'https://artictempest.com'

export const metadata: Metadata = {
    title: "Streamers | Artic Tempest – Creadores de Contenido WoW",
    description: "Sigue en directo a los creadores de contenido de Artic Tempest. Streams de progreso mítico, guías y entretenimiento de World of Warcraft.",
    alternates: {
        canonical: '/streamers',
    },
    openGraph: {
        title: "Streamers – Artic Tempest",
        description: "Sigue en directo a los creadores de contenido de Artic Tempest y disfruta de nuestro progreso en vivo.",
        type: "website",
        url: `${baseUrl}/streamers`,
    }
}

export default async function StreamersPage() {
    const streamers = await getEnrichedStreamers();

    return (
        <main className="min-h-screen bg-black selection:bg-blue-500/30 dark flex flex-col">
            <BreadcrumbJsonLd items={[
                { name: "Inicio", url: baseUrl },
                { name: "Streamers", url: `${baseUrl}/streamers` },
            ]} />
            <LandingNavigation />

            <div className="flex-1 mt-20">
                <LandingStreamers initialStreamers={streamers} />
            </div>

            <LandingFooter />
        </main>
    )
}
