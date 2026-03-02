import { MetadataRoute } from 'next'
import { sb } from "@/infrastructure/auth/auth-options"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const { data: guild } = await sb
        .from("guilds_managed")
        .select("name, icon_url")
        .limit(1)
        .single();

    const title = guild?.name ? `${guild.name}` : "Artic Tempest";

    // PWA specifications accept any standard web image format including Google's webp
    // which Discord attachments natively use.
    const iconBase = guild?.icon_url || '/icon-512x512.png';
    const iconType = iconBase.endsWith('.webp') ? 'image/webp' :
        iconBase.endsWith('.jpg') || iconBase.endsWith('.jpeg') ? 'image/jpeg' :
            'image/png';

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
                src: iconBase,
                sizes: '192x192',
                type: iconType,
                // The "any maskable" string signals Android to dynamically crop it nicely
                purpose: 'maskable'
            },
            {
                src: iconBase,
                sizes: '512x512',
                type: iconType,
                purpose: 'maskable'
            },
        ],
    }
}
