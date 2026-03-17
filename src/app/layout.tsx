import type { Metadata } from "next";
import { Geist, Montserrat } from "next/font/google";
import { ThemeProvider } from "@/shared/layout/theme-provider"
import { ThemedToaster } from "@/shared/ui/sonner"
import { SessionProvider } from "@/shared/layout/session-provider"
import { CookieConsentLoader } from "@/shared/components/cookie-consent"
import { NotificationToastListener } from "@/domains/notifications/components/notification-toast-listener"
import { NotificationPermissionModal } from "@/domains/notifications/components/notification-permission-modal"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import { ScrollToTop } from "@/shared/ui/scroll-to-top"
import { PwaPrompt } from "@/shared/components/pwa-prompt"
import { SkipLink } from "@/shared/components/skip-link"
import { FlagsProvider } from "@/shared/layout/flags-provider"
import { showBetaFeatures } from "@/flags"
import * as flagsList from "@/flags"
import { FlagValues } from 'flags/react';
import { VercelToolbar } from '@vercel/toolbar/next';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  weight: "900",
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

import { supabaseAdmin } from "@/shared/auth/auth-options";

export async function generateMetadata(): Promise<Metadata> {
  const { data: guild } = await supabaseAdmin
    .from("guilds_managed")
    .select("name, icon_url")
    .limit(1)
    .maybeSingle() as any;

  const title = guild ? `${guild.name}` : "Artic Tempest";
  const desc = "Sitio web oficial y Dashboard de la hermandad Artic Tempest (World of Warcraft). Gestiona tu roster, calendario y estadísticas de raideo.";
  const icon = guild?.icon_url || "/favicon.ico";

  return {
    title,
    description: desc,
    keywords: [
      "World of Warcraft", "WoW", "Guild", "Hermandad", "Dashboard",
      "Roster", "Raideo", "Midnight", "PvE", "Mítico", "Reclutamiento WoW",
      "Artic Tempest", "Dun Modr", "Cutting Edge", "Progreso raid",
    ],
    authors: [{ name: "Artic Tempest" }],
    creator: "Artic Tempest",
    publisher: "Artic Tempest",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://artictempest.es'),
    alternates: {
      canonical: '/',
    },
    verification: {
      ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION && {
        google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
      }),
      ...(process.env.NEXT_PUBLIC_BING_VERIFICATION && {
        other: {
          'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION,
        },
      }),
      ...(process.env.NEXT_PUBLIC_YANDEX_VERIFICATION && {
        yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
      }),
    },
    icons: {
      icon: [
        {
          url: icon,
          href: icon,
        }
      ],
      apple: [
        {
          url: icon,
          href: icon,
        }
      ],
    },
    openGraph: {
      title,
      description: desc,
      url: './',
      siteName: 'Artic Tempest',
      locale: 'es_ES',
      type: 'website',
      images: [
        {
          url: icon,
          width: 512,
          height: 512,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [icon],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve flags server-side
  const flags = {
    showBetaFeatures: (await showBetaFeatures()) as boolean,
    enableRoster: (await flagsList.enableRoster()) as boolean,
    enableCalendar: (await flagsList.enableCalendar()) as boolean,
    enableWishlist: (await flagsList.enableWishlist()) as boolean,
    enablePlanner: (await flagsList.enablePlanner()) as boolean,
    enableStatsLogs: (await flagsList.enableStatsLogs()) as boolean,
    enableWeeklyVault: (await flagsList.enableWeeklyVault()) as boolean,
    enableEconomy: (await flagsList.enableEconomy()) as boolean,
  };

  return (
    <html lang="es" suppressHydrationWarning>
      {process.env.NEXT_PUBLIC_GTM_ID && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      )}
      <head>
        <title>Artic Tempest – Hermandad WoW</title>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Artic Tempest",
              "url": "https://artictempest.es",
              "logo": "https://artictempest.es/favicon.ico",
              "sameAs": [
                "https://twitter.com/artictempest",
                "https://www.warcraftlogs.com/guild/id/743623"
              ],
              "description": "Hermandad competitiva de World of Warcraft en el servidor Dun Modr (EU)."
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${montserrat.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <FlagsProvider flags={flags}>
              <FlagValues values={flags} />
              <NotificationToastListener />
              <NotificationPermissionModal />
              <ScrollToTop />
              <SkipLink />
              <main id="main-content">
                {children}
              </main>
            </FlagsProvider>
          </SessionProvider>
          <CookieConsentLoader />
          <PwaPrompt />
          <ThemedToaster />
          <Analytics />
          <SpeedInsights />
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
          {process.env.NODE_ENV === 'development' && <VercelToolbar />}
        </ThemeProvider>
      </body>
    </html>
  );
}
