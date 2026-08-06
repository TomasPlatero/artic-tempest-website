import { unstable_cache } from "next/cache";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
export const runtime = "nodejs";

// ── Tipos ────────────────────────────────────────────────────────────────────

type NewsItem = {
  slug: string;
  id: string;
  created_at: string;
  image_url?: string | null;
};

// ── Datos dinámicos (cache 1h) ──────────────────────────────────────────────

const getSitemapNews = unstable_cache(
  async (): Promise<NewsItem[]> => {
    const { data } = await supabaseAdmin
      .from("news")
      .select("slug, id, created_at, image_url")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    return (data || []) as NewsItem[];
  },
  ["sitemap-news-v2"],
  { revalidate: 3600 },
);

// ── Utilidades ──────────────────────────────────────────────────────────────

function esc(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ── Generación XML ──────────────────────────────────────────────────────────

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artictempest.es";
  const now = new Date().toISOString();

  // ── Alto valor ────────────────────────────────────────────────────────

  const highPriority = [
    { loc: baseUrl, lastmod: now, changefreq: "weekly", priority: "1.0" },
    { loc: `${baseUrl}/noticias`, lastmod: now, changefreq: "daily", priority: "0.9" },
    { loc: `${baseUrl}/progreso`, lastmod: now, changefreq: "daily", priority: "0.85" },
    { loc: `${baseUrl}/reclutamiento`, lastmod: now, changefreq: "weekly", priority: "0.8" },
  ];

  // ── Comunidad ─────────────────────────────────────────────────────────

  const community = [
    { loc: `${baseUrl}/streamers`, lastmod: now, changefreq: "weekly", priority: "0.7" },
    { loc: `${baseUrl}/historia-y-cultura`, lastmod: now, changefreq: "weekly", priority: "0.7" },
  ];

  // ── Soporte ───────────────────────────────────────────────────────────

  const support = [
    { loc: `${baseUrl}/ayuda`, lastmod: now, changefreq: "monthly", priority: "0.5" },
    { loc: `${baseUrl}/accesibilidad`, lastmod: now, changefreq: "monthly", priority: "0.5" },
  ];

  // ── Legales ───────────────────────────────────────────────────────────

  const legal = [
    { loc: `${baseUrl}/aviso-legal`, lastmod: now, changefreq: "monthly", priority: "0.3" },
    { loc: `${baseUrl}/cookies`, lastmod: now, changefreq: "monthly", priority: "0.3" },
    { loc: `${baseUrl}/privacidad`, lastmod: now, changefreq: "monthly", priority: "0.3" },
  ];

  // ── Noticias dinámicas ────────────────────────────────────────────────

  const news = await getSitemapNews();
  const newsRoutes = news.map((item) => ({
    loc: `${baseUrl}/noticias/${item.slug || item.id}`,
    lastmod: new Date(item.created_at).toISOString(),
    changefreq: "monthly",
    priority: "0.6",
    image: item.image_url || null,
  }));

  // ── Construir XML ─────────────────────────────────────────────────────

  const urlElements = [...highPriority, ...community, ...support, ...legal]
    .map(
      (entry) =>
        `  <url>\n` +
        `    <loc>${esc(entry.loc)}</loc>\n` +
        `    <lastmod>${entry.lastmod}</lastmod>\n` +
        `    <changefreq>${entry.changefreq}</changefreq>\n` +
        `    <priority>${entry.priority}</priority>\n` +
        `  </url>`,
    )
    .join("\n");

  const newsElements = newsRoutes
    .map(
      (entry) =>
        `  <url>\n` +
        `    <loc>${esc(entry.loc)}</loc>\n` +
        `    <lastmod>${entry.lastmod}</lastmod>\n` +
        `    <changefreq>${entry.changefreq}</changefreq>\n` +
        `    <priority>${entry.priority}</priority>\n` +
        (entry.image
          ? `    <image:image>\n` +
            `      <image:loc>${esc(entry.image)}</image:loc>\n` +
            `    </image:image>\n`
          : "") +
        `  </url>`,
    )
    .join("\n");

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`,
    `<urlset`,
    `  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
    `  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`,
    `  xmlns:xhtml="http://www.w3.org/1999/xhtml"`,
    `>`,
    urlElements,
    newsElements,
    `</urlset>`,
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
