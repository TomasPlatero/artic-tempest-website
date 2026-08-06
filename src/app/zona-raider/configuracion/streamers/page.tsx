import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { StreamersSettings } from "@/domains/settings/components/settings-streamers";
import { getAppPermission } from "@/shared/auth/permissions";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { Forbidden } from "@/shared/components/forbidden";

const pageTitle = "Ajustes de Streamers | Artic Tempest";
const pageDescription =
  "Configura los streamers destacados de la hermandad Artic Tempest.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: 'https://artictempest.es/zona-raider/configuracion/streamers' },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    url: "https://artictempest.es/zona-raider/configuracion/streamers",
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

export default async function StreamersPage() {
  const session = await getCachedServerSession();

  if (!session) {
    redirect("/login");
  }

  const authz = await getAuthzSnapshot(session);
  const { canEdit } = await getAppPermission(authz.roleSlug ?? session.user?.roleLevel ?? "invitado", "settings-streamers");

  if (!canEdit) {
    return <Forbidden />;
  }

  return <StreamersSettings />;
}
