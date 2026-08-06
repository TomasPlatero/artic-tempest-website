import { SettingsNotificationsClient } from "@/domains/settings/components/settings-notifications";
import React from "react";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";

import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

const pageTitle = "Notificaciones de Sistema | Artic Tempest";
const pageDescription =
  "Configura las notificaciones del sistema de Artic Tempest.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: 'https://artictempest.es/zona-raider/configuracion/notificaciones' },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    url: "https://artictempest.es/zona-raider/configuracion/notificaciones",
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

export default async function SettingsNotificationsPage() {
  const session = await getCachedServerSession();
  const roleLevel = session?.user?.roleLevel ?? "invitado";
  const { canEdit } = await getAppPermission(
    roleLevel,
    "settings-notifications",
  );

  if (!canEdit) {
    return <Forbidden />;
  }

  return <SettingsNotificationsClient />;
}
