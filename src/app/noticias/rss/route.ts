import { supabaseAdmin } from '@/shared/lib/supabase-admin';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://artictempest.es';
const feedUrl = `${siteUrl.replace(/\/$/, '')}/noticias/rss`;

function escapeXml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapCdata(input: string) {
  return `<![CDATA[${input.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function stripHtml(input: string) {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getMimeType(url: string) {
  const extension = url.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    default:
      return 'image/jpeg';
  }
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('news')
    .select(
      'id,title,slug,summary,content,image_url,category,author,created_at',
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[RSS] Error fetching news', error);
    return new Response('RSS unavailable', { status: 500 });
  }

  const publishedNews = data || [];
  const lastBuildDate = publishedNews[0]?.created_at
    ? new Date(publishedNews[0].created_at).toUTCString()
    : new Date().toUTCString();

  const items = (data || [])
    .map((item) => {
      const url = `${siteUrl.replace(/\/$/, '')}/noticias/${item.slug || item.id}`;
      const description = stripHtml(item.summary || item.content || '');
      const content = item.content || item.summary || '';
      const pubDate = new Date(item.created_at).toUTCString();
      const imageUrl = item.image_url;
      return `\n    <item>
      <title>${escapeXml(item.title || 'Actualización')}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${wrapCdata(description)}</description>
      ${imageUrl ? `<enclosure url="${escapeXml(imageUrl)}" type="${getMimeType(imageUrl)}" />` : ''}
      <content:encoded>${wrapCdata(content)}</content:encoded>
      <category>${escapeXml(item.category || 'Artic Tempest')}</category>
      <author>${escapeXml(item.author || 'Oficial Artic Tempest')}</author>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Noticias – Artic Tempest</title>
    <link>${siteUrl}</link>
    <description>Últimas noticias y comunicados oficiales de Artic Tempest.</description>
    <language>es-ES</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <ttl>30</ttl>
    <docs>https://validator.w3.org/feed/docs/rss2.html</docs>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return new Response(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
