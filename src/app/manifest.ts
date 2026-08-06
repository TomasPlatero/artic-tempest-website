import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const { data: guild } = await supabaseAdmin
        .from("settings")
        .select("name, icon_url")
        .eq("id", 1)
        .maybeSingle();

    const title = guild?.name ? `${guild.name}` : "Artic Tempest";

    const icon192 = `/api/app-icon?size=192`;
    const icon512 = `/api/app-icon?size=512`;

    return {
        name: `${title} Guild`,
        short_name: title,
        description: `Apps y herramientas para la hermandad ${title}`,
        start_url: '/',
        display: 'standalone',
        background_color: '#09090b',
        theme_color: '#09090b',
        icons: [
            {
                src: icon192,
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable'
            },
            {
                src: icon512,
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
            },
        ],
    }
}
