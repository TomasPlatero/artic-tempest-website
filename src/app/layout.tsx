import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider"
import { ThemedToaster } from "@/components/ui/sonner"
import { SessionProvider } from "@/components/layout/session-provider"
import { CookieConsentLoader } from "@/components/common/cookie-consent"
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

  const title = guild ? `GuildBoard – ${guild.name}` : "GuildBoard";
  const icon = guild?.icon_url || "/favicon.ico";

  return {
    title,
    description: "Dashboard de hermandad para World of Warcraft",
    icons: {
      icon,
      apple: icon,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
            {children}
          </SessionProvider>
          <CookieConsentLoader />
          <ThemedToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
