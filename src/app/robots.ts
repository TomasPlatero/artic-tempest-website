import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/dashboard/',
                    '/admin/',
                    '/login/',
                    '/mis-personajes/',
                    '/notificaciones/',
                    '/editor-00/',
                    '/api/',
                    '/cdn-cgi/',
                ],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
