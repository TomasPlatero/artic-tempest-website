import type { Metadata } from "next";

import { BoostsContent } from "./boosts-content";
import { RAIDER_PAGE_FADE_IN_CLASSES } from "@/shared/components/raider-motion";

const pageTitle = "Bosteos | Zona Raider";
const pageDescription =
  "Guía informativa para los boosts de Artic Tempest y Team Pantalones.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: 'https://artictempest.es/zona-raider/bosteos' },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    url: "https://artictempest.es/zona-raider/bosteos",
    siteName: "Artic Tempest",
    images: ["/assets/images/artic-tempest-og.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: ["/assets/images/artic-tempest-og.webp"],
  },
};

export default function BoostsPage() {
  return <div className={RAIDER_PAGE_FADE_IN_CLASSES}><BoostsContent /></div>;
}
