import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  IconBell,
  IconApi,
  IconBuildingStore,
  IconDeviceGamepad,
  IconUsers,
  IconLayoutCards,
  IconSearch,
  IconBrandDiscord,
  IconBrandTwitch,
} from "@tabler/icons-react";
import { AppSidebar } from "@/shared/layout/app-sidebar";
import { SiteHeader } from "@/shared/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/shared/components/sidebar";
import { AdminPageHeader } from "@/shared/components/admin-page-header";
import React from "react";

import { Forbidden } from "@/shared/components/forbidden";
import { getAppPermission } from "@/shared/auth/permissions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/auth/auth-options";

export default async function SettingsHubPage() {
  const session = await getServerSession(authOptions);
  const roleLevel = session?.user?.roleLevel ?? "member";
  const { canView } = await getAppPermission(roleLevel, "settings");

  if (!canView) {
    return (
      <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
        <Forbidden />
      </div>
    );
  }

  const settingsPermission = await getAppPermission(roleLevel, "settings");
  const discordPermission = await getAppPermission(
    roleLevel,
    "settings-discord",
  );
  const bnetPermission = await getAppPermission(roleLevel, "settings-bnet");
  const accountsPermission = await getAppPermission(
    roleLevel,
    "settings-accounts",
  );
  const apiPermission = await getAppPermission(roleLevel, "settings-api");
  const menuPermission = await getAppPermission(roleLevel, "settings-menu");
  const widgetsPermission = await getAppPermission(
    roleLevel,
    "settings-widgets",
  );
  const recruitmentPermission = await getAppPermission(
    roleLevel,
    "settings-recruitment",
  );
  const newsPermission = await getAppPermission(roleLevel, "settings-news");
  const notificationsPermission = await getAppPermission(
    roleLevel,
    "settings-notifications",
  );
  const streamersPermission = await getAppPermission(
    roleLevel,
    "settings-streamers",
  );

  const internalSettings = [
    {
      title: "Configuración del Dashboard",
      description:
        "Información de la hermandad, logotipo y visibilidad de rangos de World of Warcraft.",
      icon: IconBuildingStore,
      href: "/dashboard/configuracion/general",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      visible:
        settingsPermission.canView ||
        discordPermission.canView ||
        bnetPermission.canView ||
        apiPermission.canView,
    },
    {
      title: "Personalización del Menú",
      description:
        "Gestiona los enlaces de la barra lateral, su orden, iconos y permisos de visibilidad por rol.",
      icon: IconLayoutCards,
      href: "/dashboard/configuracion/menu",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      visible: menuPermission.canEdit,
    },
    {
      title: "Widgets del Dashboard",
      description:
        "Configura el orden, visibilidad y contenido de los widgets (Banner, Raid, Custom, etc.) de la portada.",
      icon: IconLayoutCards,
      href: "/dashboard/configuracion/widgets",
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      visible: widgetsPermission.canEdit,
    },
    {
      title: "Configuración de Battle.net",
      description:
        "Sincronización del roster de la banda desde la Armería oficial, tokens API y reseteo.",
      icon: IconDeviceGamepad,
      href: "/dashboard/configuracion/bnet",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      visible: bnetPermission.canEdit,
    },
    {
      title: "Gestión de Cuentas",
      description:
        "Estado de vinculación Discord/Battle.net, tokens y verificación manual de miembros.",
      icon: IconUsers,
      href: "/dashboard/configuracion/cuentas",
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      visible: accountsPermission.canEdit,
    },
    {
      title: "Roles y Accesos",
      description:
        "Configuración de permisos (CRUD y visibilidad) para cada rol del sistema.",
      icon: IconLayoutCards,
      href: "/dashboard/configuracion/roles",
      color: "text-green-500",
      bg: "bg-green-500/10",
      visible: settingsPermission.canManage,
    },
    {
      title: "Configuración de Apps",
      description:
        "Ajustes específicos para cada módulo del dashboard (Roster, Calendario, etc.).",
      icon: IconLayoutCards,
      href: "/dashboard/aplicaciones",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      visible: apiPermission.canView,
    },
    {
      title: "Notificaciones del Sistema",
      description:
        "Envía comunicados y avisos globales a todos los usuarios de la plataforma.",
      icon: IconBell,
      href: "/dashboard/configuracion/notificaciones",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      visible: notificationsPermission.canEdit,
    },
    {
      title: "Documentación API",
      description:
        "Información técnica sobre los endpoints del sistema (estilo Swagger) para consultas externas.",
      icon: IconApi,
      href: "/dashboard/configuracion/api",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      visible: settingsPermission.canEdit,
    },
  ];

  const publicSettings = [
    {
      title: "Noticias de la Hermandad",
      description:
        "Publica y gestiona las noticias que aparecen en la landing page y en la app de escritorio.",
      icon: IconLayoutCards,
      href: "/dashboard/configuracion/noticias",
      color: "text-primary",
      bg: "bg-primary/10",
      visible: newsPermission.canView,
    },
    {
      title: "Bot de Discord",
      description:
        "Vinculación de la App, gestión de Slash Commands y sincronización de comandos.",
      icon: IconBrandDiscord,
      href: "/dashboard/configuracion/discord",
      color: "text-[#5865F2]",
      bg: "bg-[#5865F2]/10",
      visible: discordPermission.canEdit,
    },
    {
      title: "Twitch Streamers",
      description:
        "Añade a los creadores de contenido de la hermandad para su promoción en la web.",
      icon: IconBrandTwitch,
      href: "/dashboard/configuracion/streamers",
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      visible: streamersPermission.canEdit,
    },
    {
      title: "Reclutamiento",
      description:
        "Gestiona las vacantes de clase, prioridades y el formulario de aplicación público.",
      icon: IconSearch,
      href: "/dashboard/configuracion/reclutamiento",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      visible: recruitmentPermission.canView,
    },
  ];

  const renderCards = (items: typeof internalSettings) => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 w-full">
      {items
        .filter((category) => category.visible)
        .map((category) => {
          const Icon = category.icon;
          return (
            <Link
              href={category.href}
              key={category.href}
              className="transition-all hover:scale-[1.02]"
            >
              <Card className="h-full hover:border-primary/50 cursor-pointer overflow-hidden border-border/40 bg-card/40 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center gap-4 py-4 px-5">
                  <div
                    className={`p-2.5 rounded-xl ${category.bg} ${category.color} shrink-0 shadow-sm border border-white/5`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col text-left">
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription className="mt-1.5 leading-snug">
                      {category.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
      <AdminPageHeader
        title="AJUSTES"
        description="Panel de control centralizado para guild master y oficiales."
      />

      <div className="flex flex-col gap-8 mt-4">
        <section>
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-4">
            Gestión Interna
          </h2>
          {renderCards(internalSettings)}
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 mb-4">
            Parte Pública
          </h2>
          {renderCards(publicSettings)}
        </section>
      </div>
    </div>
  );
}
