import { Metadata } from "next"
import { LandingNavigation } from "@/components/landing/navigation"
import { LandingStreamers } from "@/components/landing/streamers"
import { LandingFooter } from "@/components/landing/footer"

export const metadata: Metadata = {
    title: "Streamers | Artic Tempest",
    description: "Sigue en directo a los creadores de contenido de Artic Tempest y disfruta de nuestro progreso en vivo.",
}

export default function StreamersPage() {
    return (
        <main className="min-h-screen bg-black selection:bg-blue-500/30 dark flex flex-col">
            <LandingNavigation />

            <div className="flex-1 mt-20">
                <LandingStreamers />
            </div>

            <LandingFooter />
        </main>
    )
}
