import { Metadata } from "next"
import { HomePageClient } from "@/components/landing/home-page-client"
import { sb } from "@/infrastructure/auth/auth-options"

export async function generateMetadata(): Promise<Metadata> {
  const { data: guild } = await sb
    .from("guilds_managed")
    .select("name, icon_url")
    .limit(1)
    .single()

  const title = guild ? `${guild.name}` : "Artic Tempest"
  const desc = `Sitio web oficial de la hermandad ${guild?.name || 'Artic Tempest'} (World of Warcraft). Consulta nuestro progreso en Midnight y únete al roster.`

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "website",
      images: guild?.icon_url ? [guild.icon_url] : [],
    }
  }
}

export default function HomePage() {
  return <HomePageClient />
}
