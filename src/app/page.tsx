import { Metadata } from "next"
import { HomePageClient } from "@/components/landing/home-page-client"
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld"
import { sb } from "@/infrastructure/auth/auth-options"

export async function generateMetadata(): Promise<Metadata> {
  const { data: guild } = await sb
    .from("guilds_managed")
    .select("name, icon_url")
    .limit(1)
    .single()

  const title = guild ? `${guild.name} – Hermandad WoW` : "Artic Tempest – Hermandad WoW"
  const desc = `Sitio web oficial de la hermandad ${guild?.name || 'Artic Tempest'} (World of Warcraft). Consulta nuestro progreso en Midnight, vacantes de reclutamiento y únete al roster.`

  return {
    title,
    description: desc,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title,
      description: desc,
      type: "website",
      images: guild?.icon_url ? [guild.icon_url] : [],
    }
  }
}

export default async function HomePage() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://artictempest.com'

  const { data: guild } = await sb
    .from("guilds_managed")
    .select("name, icon_url")
    .limit(1)
    .single()

  const guildName = guild?.name || "Artic Tempest"

  return (
    <>
      <OrganizationJsonLd
        name={guildName}
        url={baseUrl}
        logo={guild?.icon_url || `${baseUrl}/favicon.ico`}
        description={`Hermandad de World of Warcraft en el servidor Dun Modr. Progreso PvE Mítico, reclutamiento activo para Midnight.`}
      />
      <WebSiteJsonLd
        name={guildName}
        url={baseUrl}
        description={`Sitio web oficial de ${guildName}. Dashboard de hermandad, roster, calendario y progresión de raids.`}
      />
      <HomePageClient />
    </>
  )
}

