import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // --- PERFORMANCE & SECURITY: ANTIGRAVITY STACK (Native) ---

  // 1. Minificación Extrema (Uses SWC by default in Next.js 13+)
  // 2. Control de Logs: Limpieza total de consola en producción
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // 3. Source Maps Fantasma: No se exponen en el navegador
  productionBrowserSourceMaps: false,

  // 4. WebP Pro: Soporte nativo y optimizado para responsive
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    remotePatterns: [
      { protocol: "https", hostname: "www.google.com" },
      { protocol: "https", hostname: "vrniyndhfaawwqzcrqng.supabase.co" },
      { protocol: "https", hostname: "render.worldofwarcraft.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
    ],
  },

  // 5. Compresión: Next.js + Vercel ya incluyen Gzip/Brotli en el Edge
  compress: true,

  // 6. Seguridad: Content Security Policy (CSP) robusta
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "img-src 'self' blob: data: cdn.discordapp.com render.worldofwarcraft.com *.supabase.co *.google.com *.akamaihd.net *.raider.io *.warcraftlogs.com bnetcmsus-a.akamaihd.net",
              "font-src 'self' data: fonts.gstatic.com",
              "connect-src 'self' *.supabase.co wss://*.supabase.co discord.com *.discordapp.com vitals.vercel-insights.com raider.io *.raider.io warcraftlogs.com *.warcraftlogs.com *.supabase.in wss://*.supabase.in",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
