import { MetadataRoute } from 'next'
import { createAdminClient } from '@/infrastructure/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://artictempest.es'
    const supabase = await createAdminClient()

    // Static routes
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/noticias`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/reclutamiento`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/streamers`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/ayuda`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ]

    // Dynamic news routes
    const { data: news } = await supabase
        .from('news')
        .select('slug, id, created_at')
        .eq('status', 'published')

    const newsRoutes: MetadataRoute.Sitemap = (news || []).map((item) => ({
        url: `${baseUrl}/noticias/${item.slug || item.id}`,
        lastModified: new Date(item.created_at),
        changeFrequency: 'monthly',
        priority: 0.6,
    }))

    return [...staticRoutes, ...newsRoutes]
}
