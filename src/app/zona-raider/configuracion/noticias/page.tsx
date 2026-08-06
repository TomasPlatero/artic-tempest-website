import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { IconNews, IconTags } from "@/shared/ui/tabler-icons";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import React from "react";
import { Forbidden } from "@/shared/components/forbidden";
import { getAppPermission } from "@/shared/auth/permissions";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { getAuthzSnapshot } from "@/shared/auth/authz";

const options = [
  {
    title: "Gestión de Noticias",
    description:
      "Crea, edita y publica artículos para la landing page y la aplicación.",
    icon: IconNews,
    href: "/zona-raider/configuracion/noticias/editor",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Gestión de Categorías",
    description:
      "Personaliza las etiquetas y categorías disponibles para organizar el contenido.",
    icon: IconTags,
    href: "/zona-raider/configuracion/noticias/categories",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

export default async function NewsPortalPage() {
  const session = await getCachedServerSession();
  const authz = session ? await getAuthzSnapshot(session) : null;
  const roleLevel = authz?.roleSlug ?? session?.user?.roleLevel ?? "invitado";
  const { canView } = await getAppPermission(roleLevel, "settings-news");

  if (!canView) {
    return <Forbidden />;
  }

  return (
    <div className="flex flex-col gap-4 py-6 px-4 lg:px-6 w-full animate-in fade-in duration-500">
      <AdminPageHeader
        title="AJUSTES DE NOTICIAS"
        description="Elige qué sección de comunicación deseas gestionar."
        backHref="/zona-raider/configuracion"
      />

      <div className="grid gap-4 md:grid-cols-2 mt-8 max-w-5xl">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <Link href={option.href} key={option.href} className="group h-full">
              <Card className="h-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.04]  overflow-hidden backdrop-blur-sm group-hover:border-primary/30 group-hover:translate-y-[-2px]">
                <CardHeader className="flex flex-row items-center gap-5 py-8 px-6">
                  <div
                    className={`p-4 rounded-2xl ${option.bg} ${option.color} shrink-0 shadow-lg border border-white/5  group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-${option.color.split("-")[1]}-500/20`}
                  >
                    <Icon className="size-8" />
                  </div>
                  <div className="flex flex-col text-left">
                    <CardTitle className="text-lg font-semibold italic tracking-tighter uppercase group-hover:text-primary transition-colors">
                      {option.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm line-clamp-2">
                      {option.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
