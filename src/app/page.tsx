import { Metadata } from "next"
import { HomePageClient } from "@/domains/landing/components/home-page-client"
import { OrganizationJsonLd, WebSiteJsonLd } from "@/shared/seo/json-ld"
import { supabaseAdmin } from "@/shared/auth/auth-options"
import { getEnrichedStreamers } from "@/domains/streamers/lib/server-actions"

interface RaidProgression {
  name: string
  tier?: string
  expansion?: string
  progress: string
  rank: string
  status: string
  imageUrl?: string
}

export async function generateMetadata(): Promise<Metadata> {
  const { data: guild } = await supabaseAdmin
    .from("guilds_managed")
    .select("name, icon_url")
    .limit(1)
    .single()

  const title = guild ? `${guild.name} – Hermandad WoW | Progreso Mítico` : "Artic Tempest – Hermandad WoW | Progreso Mítico"
  const desc = "Hermandad de WoW en Dun Modr centrada en el progreso PvE Mítico. Un equipo con experiencia para completar el contenido más exigente de cada temporada.";

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
      images: ['/assets/images/artic-tempest-og.webp'],
    }
  }
}

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://artictempest.com'

  const { data: guild } = await supabaseAdmin
    .from("guilds_managed")
    .select("name, icon_url")
    .limit(1)
    .single()

  const guildName = guild?.name || "Artic Tempest"

  // --- Start Progression Data Fetching ---
  let progression: RaidProgression[] = [
    { name: "La Aguja del Vacío", tier: "Temporada 1", progress: "0/5 M", rank: "-", status: "Próximamente", expansion: "Midnight", imageUrl: "/assets/images/raids/voidspire.webp" },
    { name: "La Falla del Sueño", tier: "Temporada 1", progress: "0/1 M", rank: "-", status: "Próximamente", expansion: "Midnight", imageUrl: "/assets/images/raids/dreamrift.webp" },
    { name: "Marcha sobre Quel'Danas", tier: "Temporada 1", progress: "0/2 M", rank: "-", status: "Próximamente", expansion: "Midnight", imageUrl: "/assets/images/raids/marchonqueldanas.webp" }
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
        const normalizedKey = r.key.toLowerCase().trim()
          .replace(/['"']/g, "")
          .replace(/\s+/g, "");

        const imageMap: Record<string, string> = {
          "voidspire": "/assets/images/raids/voidspire.webp",
          "dreamwell": "/assets/images/raids/dreamrift.webp",
          "dreamrift": "/assets/images/raids/dreamrift.webp",
          "sunwell": "/assets/images/raids/marchonqueldanas.webp",
          "marchonqueldanas": "/assets/images/raids/marchonqueldanas.webp"
        };

        return {
          name: r.value,
          expansion: r.metadata?.expansion || "Midnight",
          tier: r.metadata?.tier || "Temporada 1",
          progress: `0/${bossCount} M`,
          rank: "-",
          status: "Próximamente",
          imageUrl: imageMap[normalizedKey] || "/assets/images/raids/all-raids.webp"
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

  // --- News Data Fetching ---
  let news: any[] = [];
  try {
    const { data } = await supabaseAdmin
      .from('news')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(6);
    news = data || [];
  } catch (e) {
    console.error("Error fetching news on server:", e);
  }

  // --- Recruitment Data Fetching ---
  let recruitmentClasses: any[] = [];
  try {
    const { data: spotsData } = await supabaseAdmin
      .from("recruitment_spots")
      .select("*")
      .neq("urgency", "closed")
      .order("urgency", { ascending: false });

    const { data: constants } = await supabaseAdmin
      .from("game_constants")
      .select("key, value, metadata")
      .eq("category", "wow_class");

    const classMap = new Map();
    constants?.forEach(c => classMap.set(c.key, { name: c.value, color: c.metadata?.color, spots: [] }));

    spotsData?.forEach(s => {
      const classInfo = classMap.get(s.class_id);
      if (classInfo) classInfo.spots.push(s);
    });

    recruitmentClasses = Array.from(classMap.entries())
      .map(([id, info]) => ({
        id,
        name: info.name,
        color: info.color,
        spots: info.spots
      }))
      .filter(c => c.spots.length > 0)
      .sort((a, b) => Number(a.id) - Number(b.id));
  } catch (e) {
    console.error("Error fetching recruitment on server:", e);
  }

  // --- Streamers Data Fetching ---
  let streamers: any[] = [];
  try {
    streamers = await getEnrichedStreamers();
  } catch (e) {
    console.error("Error fetching streamers on server:", e);
  }

  return (
    <HomePageClient 
      initialProgression={progression} 
      initialNews={news}
      initialRecruitment={recruitmentClasses}
      initialStreamers={streamers}
    />
  )
}

