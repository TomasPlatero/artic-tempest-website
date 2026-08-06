import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

let withVercelToolbar:
  | ((opts?: Record<string, unknown>) => (config: NextConfig) => NextConfig)
  | undefined;
try {
  withVercelToolbar = require("@vercel/toolbar/plugins/next").default;
} catch {
  withVercelToolbar = undefined;
}

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  turbopack: {
    resolveAlias: {
      react: "react",
      "react-dom": "react-dom",
    },
  },
  // Configuración para el túnel NGROK en desarrollo
  serverExternalPackages: [
    "@radix-ui/react-context",
    "@radix-ui/react-direction",
    "@radix-ui/react-dismissable-layer",
  ],

  allowedDevOrigins: [
    "cataractous-overharshly-keshia.ngrok-free.dev",
    "localhost:3000",
    "127.0.0.1:3000",
    "127.0.0.1",
    "192.168.1.108",
    "192.168.1.108:3000",
  ],

  // --- PERFORMANCE & ANTIGRAVITY STACK ---

  // React 19 Compiler — auto-memoiza donde beneficie
  reactCompiler: true,

  // Optimización de imports
  experimental: {
    optimizePackageImports: [
      "@tabler/icons-react",
      "date-fns",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-switch",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
    ],
  },

  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  productionBrowserSourceMaps: false,

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    remotePatterns: [
      { protocol: "https", hostname: "www.google.com" },
      { protocol: "https", hostname: "vrniyndhfaawwqzcrqng.supabase.co" },
      { protocol: "https", hostname: "render.worldofwarcraft.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "wow.zamimg.com" },
      { protocol: "https", hostname: "community.restedxp.com" },
      { protocol: "https", hostname: "media.restedxp.com" },
      { protocol: "https", hostname: "shop.restedxp.com" },
      { protocol: "https", hostname: "vpncdn.protonweb.com" },
      { protocol: "https", hostname: "media.forgecdn.net" },
      { protocol: "https", hostname: "artictempest.es" },
      { protocol: "https", hostname: "cdn.raider.io" },
      { protocol: "https", hostname: "cdnassets.raider.io" },
      { protocol: "https", hostname: "raider.io" },
      { protocol: "https", hostname: "static-cdn.jtvnw.net" },
      { protocol: "https", hostname: "wowutils.com" },
      { protocol: "https", hostname: "render.worldofwarcraft.blizzard.com" },
    ],
    qualities: [30, 50, 60, 75, 90],
  },

  compress: true,
  trailingSlash: false,
};

import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const isDev = process.env.NODE_ENV === "development";

const devToolbarConnectSrc = isDev
  ? "http://localhost:* http://127.0.0.1:*"
  : "";

// Vercel Toolbar / Live domains — allowed in all environments
const vercelLiveSrc = "vercel.live *.vercel.live";
const vercelStylesSrc = "vercel.live";
const vercelImgSrc = "vercel.live vercel.com";
const vercelFontSrc = "vercel.live assets.vercel.com";
const vercelFrameSrc = "vercel.live";

const googleAdsSourceHosts =
  "pagead2.googlesyndication.com *.googlesyndication.com *.google.com *.googleadservices.com *.doubleclick.net *.g.doubleclick.net googleads.g.doubleclick.net fundingchoicesmessages.google.com *.fundingchoicesmessages.google.com ep1.adtrafficquality.google ep2.adtrafficquality.google *.adtrafficquality.google";

const devSecuritySrc = isDev ? "'unsafe-eval'" : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' ${devSecuritySrc} ${vercelLiveSrc} consent.cookiebot.com consentcdn.cookiebot.com *.cookiebot.com wow.zamimg.com *.wowhead.com *.googletagmanager.com *.google-analytics.com ${googleAdsSourceHosts} www.instant-gaming.com ${isDev ? "va.vercel-scripts.com" : ""}`,
  `style-src 'self' fonts.googleapis.com wow.zamimg.com ${vercelStylesSrc} www.instant-gaming.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  `img-src 'self' blob: data: authjs.dev *.authjs.dev cdn.discordapp.com render.worldofwarcraft.com wow.zamimg.com *.supabase.co *.google.com *.google.es ${googleAdsSourceHosts} *.akamaihd.net *.raider.io https://cdnassets.raider.io cdnassets.raider.io *.warcraftlogs.com bnetcmsus-a.akamaihd.net static-cdn.jtvnw.net *.googletagmanager.com *.google-analytics.com community.restedxp.com shop.restedxp.com media.restedxp.com artictempest.es ${vercelImgSrc} www.instant-gaming.com vpncdn.protonweb.com consent.cookiebot.com consentcdn.cookiebot.com *.cookiebot.com`,
  `font-src 'self' data: fonts.gstatic.com ${vercelFontSrc} www.instant-gaming.com`,
  `connect-src 'self' ${devToolbarConnectSrc} *.supabase.co wss://*.supabase.co discord.com *.discordapp.com vitals.vercel-insights.com ${vercelLiveSrc} wss://ws-us3.pusher.com consent.cookiebot.com consentcdn.cookiebot.com *.cookiebot.com stats.g.doubleclick.net raider.io *.raider.io warcraftlogs.com *.warcraftlogs.com *.supabase.in wss://*.supabase.in wow.zamimg.com *.wowhead.com *.google-analytics.com *.analytics.google.com *.googletagmanager.com ${googleAdsSourceHosts} fundingchoicesmessages.google.com *.fundingchoicesmessages.google.com *.ingest.de.sentry.io https://*.ingest.de.sentry.io wss://*.ingest.de.sentry.io api.websitecarbon.com`,
  `frame-src 'self' player.twitch.tv ${vercelFrameSrc} www.youtube-nocookie.com www.youtube.com youtube.com m.youtube.com consent.cookiebot.com consentcdn.cookiebot.com *.cookiebot.com ${googleAdsSourceHosts}`,
  "frame-ancestors 'none'",
  "worker-src 'self'",
  "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

// Only wrap with vercel toolbar on Vercel (preview/production), never in local dev
const baseConfig =
  withVercelToolbar &&
  (process.env.VERCEL === "1" || process.env.VERCEL_ENV === "preview")
    ? withAnalyzer(withVercelToolbar()(nextConfig))
    : withAnalyzer(nextConfig);

const oneYearInSeconds = 60 * 60 * 24 * 365;
const imageCacheHeaders = [
  {
    key: "Cache-Control",
    value: `public, max-age=${oneYearInSeconds}, immutable`,
  },
  {
    key: "Expires",
    value: new Date(Date.now() + oneYearInSeconds * 1000).toUTCString(),
  },
];

const sentryWebpackOptions = {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options
  org: "75910561g",
  project: "artictempest-web",
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,
  // Tunnel client-side Sentry requests through our server to avoid CORS and ad-blockers.
  // Creates a rewrite rule and injects `tunnel` into the client SDK config automatically.
  tunnelRoute: "/monitoring",
  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
} as const;

const config = process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(baseConfig, sentryWebpackOptions)
  : baseConfig;

config.headers = async () => [
  {
    source: "/_next/static/:path*",
    headers: [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ],
  },
  {
    source: "/:path((?!_next|api|assets).*)",
    headers: [
      { key: "Content-Security-Policy", value: contentSecurityPolicy },
      { key: "X-Powered-By", value: "" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      },
      {
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=(), display-capture=()",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      // Cache-Control sin no-store para permitir bfcache
      { key: "Cache-Control", value: "private, max-age=0, must-revalidate" },
      // Preconnect a orígenes esenciales para el rendering inicial
      {
        key: "Link",
        value: "<https://vrniyndhfaawwqzcrqng.supabase.co>; rel=preconnect",
      },
      {
        key: "Link",
        value: "<https://www.googletagmanager.com>; rel=preconnect",
      },
      {
        key: "Link",
        value: "<https://consent.cookiebot.com>; rel=preconnect",
      },
      {
        key: "Link",
        value: "<https://consentcdn.cookiebot.com>; rel=preconnect",
      },
      {
        key: "Link",
        value: "<https://www.google-analytics.com>; rel=preconnect",
      },
      {
        key: "Link",
        value: "<https://pagead2.googlesyndication.com>; rel=preconnect",
      },
    ],
  },
  {
    source: "/assets/:path*",
    headers: imageCacheHeaders,
  },
  {
    source: "/favicon.ico",
    headers: imageCacheHeaders,
  },
];

export default config;
