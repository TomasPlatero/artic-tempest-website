import type { Metadata } from "next";
import NotificationsPage from "./notificaciones-client";

const pageTitle = "Notificaciones | Artic Tempest";
const pageDescription = "Consulta tus mensajes y avisos de la hermandad.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: 'https://artictempest.es/notificaciones' },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    url: "https://artictempest.es/notificaciones",
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

export default function Page() {
  return <NotificationsPage />;
}
