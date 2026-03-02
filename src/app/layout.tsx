import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider"
import { ThemedToaster } from "@/components/ui/sonner"
import { SessionProvider } from "@/components/layout/session-provider"
import { CookieConsentLoader } from "@/components/common/cookie-consent"
import { NotificationToastListener } from "@/components/notifications/notification-toast-listener"
import { NotificationPermissionModal } from "@/components/notifications/notification-permission-modal"
import { Analytics } from "@vercel/analytics/next"
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import { ScrollToTop } from "@/components/ui/scroll-to-top"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { sb } from "@/infrastructure/auth/auth-options";

export async function generateMetadata(): Promise<Metadata> {
  const { data: guild } = await sb
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
    keywords: ["World of Warcraft", "WoW", "Guild", "Hermandad", "Dashboard", "Roster", "Raideo"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
          <ThemedToaster />
          <Analytics />
        </ThemeProvider>
      </body>
      {process.env.NEXT_PUBLIC_GA_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      )}
    </html>
  );
}
