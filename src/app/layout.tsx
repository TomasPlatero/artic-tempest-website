import type { Metadata } from "next";
import { Geist, Geist_Mono, Montserrat, Oswald, Bebas_Neue, Cinzel } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider"
import { ThemedToaster } from "@/components/ui/sonner"
import { SessionProvider } from "@/components/layout/session-provider"
import { CookieConsentLoader } from "@/components/common/cookie-consent"
import { NotificationToastListener } from "@/components/notifications/notification-toast-listener"
import { NotificationPermissionModal } from "@/components/notifications/notification-permission-modal"
import { Analytics } from "@vercel/analytics/next"
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import { ScrollToTop } from "@/components/ui/scroll-to-top"
import { PwaPrompt } from "@/components/pwa-prompt"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  weight: "900",
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const oswald = Oswald({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-oswald",
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const cinzel = Cinzel({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-cinzel",
});

import { supabaseAdmin } from "@/infrastructure/auth/auth-options";

export async function generateMetadata(): Promise<Metadata> {
  const { data: guild } = await supabaseAdmin
    .from("guilds_managed")
    .select("name, icon_url")
    .limit(1)
    .single();

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
    metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      {process.env.NEXT_PUBLIC_GTM_ID && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      )}
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} ${oswald.variable} ${bebas.variable} ${cinzel.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <NotificationToastListener />
            <NotificationPermissionModal />
            <ScrollToTop />
            {children}
          </SessionProvider>
          <CookieConsentLoader />
          <PwaPrompt />
          <ThemedToaster />
          <Analytics />
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
