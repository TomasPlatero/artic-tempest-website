import type { NextConfig } from 'next';
import withVercelToolbar from '@vercel/toolbar/plugins/next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Configuración para el túnel NGROK en desarrollo
  serverExternalPackages: ['tweetnacl'],
  experimental: {
    serverSourceMaps: false,
  },
  allowedDevOrigins: [
    'cataractous-overharshly-keshia.ngrok-free.dev',
    'localhost:3000',
    '127.0.0.1:3000',
    '127.0.0.1',
    '192.168.1.108',
    '192.168.1.108:3000',
  ],

  // --- PERFORMANCE & SECURITY: ANTIGRAVITY STACK (Native) ---

  // 1. Minificación Extrema (Uses SWC by default in Next.js 13+)
  // 2. Control de Logs: Limpieza total de consola en producción
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  // 3. Source Maps Fantasma: No se exponen en el navegador
  productionBrowserSourceMaps: false,

  // 4. WebP Pro: Soporte nativo y optimizado para responsive
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    remotePatterns: [
      { protocol: 'https', hostname: 'www.google.com' },
      { protocol: 'https', hostname: 'vrniyndhfaawwqzcrqng.supabase.co' },
      { protocol: 'https', hostname: 'render.worldofwarcraft.com' },
      { protocol: 'https', hostname: 'cdn.discordapp.com' },
      { protocol: 'https', hostname: 'wow.zamimg.com' },
      { protocol: 'https', hostname: 'community.restedxp.com' },
      { protocol: 'https', hostname: 'shop.restedxp.com' },
      { protocol: 'https', hostname: 'artictempest.es' },
    ],
    qualities: [50, 75, 90], // NextJS 15+ Image qualities allowed
  },

  // 5. Compresión: Next.js + Vercel ya incluyen Gzip/Brotli en el Edge
  compress: true,

  // 6. Seguridad: Content Security Policy (CSP) robusta
  async redirects() {
    return [
      {
        source: '/dashboard/settings/apps/:path*',
        destination: '/dashboard/aplicaciones/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/settings/news-settings/:path*',
        destination: '/dashboard/configuracion/noticias/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/settings/recruitment/:path*',
        destination: '/dashboard/configuracion/reclutamiento/:path*',
        permanent: true,
      },
      {
        source: '/dashboard/settings/accounts',
        destination: '/dashboard/configuracion/cuentas',
        permanent: true,
      },
      {
        source: '/dashboard/settings/notifications',
        destination: '/dashboard/configuracion/notificaciones',
        permanent: true,
      },
      {
        source: '/dashboard/settings/:path*',
        destination: '/dashboard/configuracion/:path*',
        permanent: true,
      },
      {
        source: '/admin/backup/:path*',
        destination: '/dashboard/configuracion/backup/:path*',
        permanent: true,
      },
      {
        source: '/api/admin/backup/:path*',
        destination: '/api/configuracion/backup/:path*',
        permanent: true,
      },
    ];
  },

  async headers() {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Skipping security headers in development mode');
      return [];
    }
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' va.vercel-scripts.com wow.zamimg.com *.wowhead.com *.googletagmanager.com *.google-analytics.com",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com wow.zamimg.com",
              "img-src 'self' blob: data: cdn.discordapp.com render.worldofwarcraft.com wow.zamimg.com *.supabase.co *.google.com *.akamaihd.net *.raider.io *.warcraftlogs.com bnetcmsus-a.akamaihd.net static-cdn.jtvnw.net *.googletagmanager.com *.google-analytics.com community.restedxp.com shop.restedxp.com artictempest.es",
              "font-src 'self' data: fonts.gstatic.com",
              "connect-src 'self' *.supabase.co wss://*.supabase.co discord.com *.discordapp.com vitals.vercel-insights.com raider.io *.raider.io warcraftlogs.com *.warcraftlogs.com *.supabase.in wss://*.supabase.in wow.zamimg.com *.wowhead.com *.google-analytics.com *.analytics.google.com *.googletagmanager.com",
              "frame-src 'self' player.twitch.tv",
              "frame-ancestors 'none'",
              ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default withVercelToolbar()(nextConfig);
