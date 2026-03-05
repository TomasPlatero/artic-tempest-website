import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Fecha fija del último deploy/actualización significativa
    // Evita que cada request genere un lastModified diferente
    const lastUpdate = new Date('2026-03-05')

    return [
        {
            url: baseUrl,
            lastModified: lastUpdate,
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/reclutamiento`,
            lastModified: lastUpdate,
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/streamers`,
            lastModified: lastUpdate,
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/ayuda`,
            lastModified: lastUpdate,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/privacidad`,
            lastModified: lastUpdate,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/aviso-legal`,
            lastModified: lastUpdate,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/cookies`,
            lastModified: lastUpdate,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ]
}
