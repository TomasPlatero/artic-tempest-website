import { Metadata } from "next"
import { HomePageClient } from "@/components/landing/home-page-client"
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld"
import { supabaseAdmin } from "@/infrastructure/auth/auth-options"
import { getEnrichedStreamers } from "@/infrastructure/streamers/server-actions"

interface RaidProgression {
  name: string
  tier?: string
  expansion?: string
  progress: string
  rank: string
  status: string
}

export async function generateMetadata(): Promise<Metadata> {
  const { data: guild } = await supabaseAdmin
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

  const { data: guild } = await supabaseAdmin
    .from("guilds_managed")
    .select("name, icon_url")
    .limit(1)
    .single()

  const guildName = guild?.name || "Artic Tempest"

  // --- Start Progression Data Fetching ---
  let progression: RaidProgression[] = [
    { name: "La Aguja del Vacío", tier: "Temporada 1", progress: "0/5 M", rank: "-", status: "Próximamente", expansion: "Midnight" },
    { name: "La Falla del Sueño", tier: "Temporada 1", progress: "0/1 M", rank: "-", status: "Próximamente", expansion: "Midnight" },
    { name: "Marcha sobre Quel'Danas", tier: "Temporada 1", progress: "0/2 M", rank: "-", status: "Próximamente", expansion: "Midnight" }
  ];

  try {
    // 1. Fetch Raid Constants from DB
    const { data: raids } = await supabaseAdmin
      .from("game_constants")
      .select("key, value, metadata")
      .eq("category", "wow_raid");

    if (raids && raids.length > 0) {
      progression = raids.filter((r: any) => r.key !== 'Todas las Raids').sort((a: any, b: any) => {
        const keys = ['Voidspire', 'Dreamrift', "March on Quel'Danas"];
        return keys.indexOf(a.key) - keys.indexOf(b.key);
      }).map((r: any) => {
        const bossCount = r.metadata?.boss_count || r.metadata?.bosses?.length || 0;
        return {
          name: r.value,
          expansion: r.metadata?.expansion || "Midnight",
          tier: r.metadata?.tier || "Temporada 1",
          progress: `0/${bossCount} M`,
          rank: "-",
          status: "Próximamente"
        };
      });
    }

    // Progreso histórico de The War Within
    const now = new Date();
    const cutoffDate = new Date("2026-03-17T00:00:00Z");

    if (now < cutoffDate) {
      progression.push(
        {
          name: "Palacio Nerub'ar",
          expansion: "The War Within",
          tier: "Temporada 1",
          progress: "6/8 M",
          rank: "Top 5 Dun Modr",
          status: "AotC (En Progreso)"
        },
        {
          name: "Liberación de Minahonda",
          expansion: "The War Within",
          tier: "Temporada 2",
          progress: "5/8 M",
          rank: "Top 9 Dun Modr",
          status: "AotC (En Progreso)"
        },
        {
          name: "Forja de Maná Omega",
          expansion: "The War Within",
          tier: "Temporada 3",
          progress: "8/8 M",
          rank: "Top 2 Dun Modr",
          status: "Cutting Edge"
        }
      );
    }
  } catch (e) {
    console.error("Error fetching progression on server:", e);
  }
  // --- End Progression Data Fetching ---

  const streamers = await getEnrichedStreamers();

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
      <HomePageClient initialProgression={progression} initialStreamers={streamers} />
    </>
  )
}

