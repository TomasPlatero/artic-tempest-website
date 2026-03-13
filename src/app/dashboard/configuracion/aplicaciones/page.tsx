import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import {
  IconArrowLeft,
  IconUsers,
  IconCalendar,
  IconChartBar,
  IconId,
  IconStethoscope,
  IconLayoutCards,
  IconCamera,
} from "@tabler/icons-react";
import React from "react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/shared/auth/auth-options";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

export default async function AppsSettingsHubPage() {
  const session = await getServerSession(authOptions);
  const roleLevel = session?.user?.roleLevel ?? "invitado";
  const { canView } = await getAppPermission(roleLevel, "settings");

  if (!canView) {
    return <Forbidden />;
  }

  const rosterPermission = await getAppPermission(roleLevel, "roster");
  const calendarPermission = await getAppPermission(roleLevel, "calendar");
  const bisPermission = await getAppPermission(roleLevel, "bis-admin");
  const plannerPermission = await getAppPermission(
    roleLevel,
    "planificador-cds",
  );
  const weeklyVaultPermission = await getAppPermission(
    roleLevel,
    "weekly-vault-admin",
  );

  const apps = [
    {
      title: "Gestión de Roster",
      description:
        "Configura qué rangos son visibles en la lista pública de la hermandad.",
      icon: IconUsers,
      href: "/dashboard/configuracion/aplicaciones/roster",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      visible: rosterPermission.canEdit,
    },
    {
      title: "Calendario de Eventos",
      description:
        "Ajustes de visibilidad y comportamiento del calendario de banda.",
      icon: IconCalendar,
      href: "/dashboard/configuracion/aplicaciones/calendario",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      visible: calendarPermission.canEdit,
    },
    {
      title: "Estadísticas y Logs",
      description:
        "Configuración de la integración con WarcraftLogs y visualización de datos.",
      icon: IconChartBar,
      href: "/dashboard/configuracion/aplicaciones/stats",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      disabled: true,
      visible: false,
    },
    {
      title: "BiS List (Best in Slot)",
      description:
        "Gestión de listas BiS e importación de botín desde Wowhead.",
      icon: IconId,
      href: "/dashboard/configuracion/aplicaciones/bis",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      visible: bisPermission.canView,
    },
    {
      title: "Planificador de CD's",
      description:
        "Gestión de habilidades de raid y configuración de notas para MRT.",
      icon: IconStethoscope,
      href: "/dashboard/configuracion/aplicaciones/planificador-cds",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      visible: plannerPermission.canEdit,
    },
    {
      title: "Cámara Semanal",
      description:
        "Revisa las capturas de la Gran Cámara subidas por los miembros.",
      icon: IconCamera,
      href: "/dashboard/configuracion/aplicaciones/camara-semanal",
      color: "text-teal-500",
      bg: "bg-teal-500/10",
      visible: weeklyVaultPermission.canView,
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/configuracion">
          <Button
            variant="outline"
            size="icon"
            className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl"
          >
            <IconArrowLeft className="size-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black font-heading italic tracking-tight uppercase flex items-center gap-3">
            CONFIGURACIÓN DE APPS
          </h1>
          <p className="text-sm font-medium text-white/40 mt-2 uppercase tracking-widest leading-tight">
            Ajustes específicos para cada módulo del Dashboard.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8 [&_a]:hover:scale-[1.02] w-full">
        {apps
          .filter((app) => app.visible)
          .map((app) => {
            const Icon = app.icon;
            return app.disabled ? (
              <Card
                key={app.href}
                className="h-full overflow-hidden border-border/40 bg-card/20 backdrop-blur-sm opacity-50 cursor-not-allowed border-dashed"
              >
                <CardHeader className="flex flex-row items-center gap-4 p-5 grayscale">
                  <div
                    className={`p-3 rounded-xl ${app.bg} ${app.color} shrink-0 shadow-sm border border-white/5 flex-shrink-0`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-semibold leading-none mb-2">
                        {app.title}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="text-[8px] sm:text-[9px] uppercase tracking-widest px-1.5 py-0 h-4"
                      >
                        Beta
                      </Badge>
                    </div>
                    <CardDescription className="mt-1 sm:mt-1.5 leading-snug text-sm sm:text-base">
                      {app.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ) : (
              <Link href={app.href} key={app.href} className="block">
                <Card className="h-full hover:border-primary/50 cursor-pointer overflow-hidden border-border/40 bg-card/40 backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-card/50">
                  <CardHeader className="flex flex-row items-center gap-4 p-5">
                    <div
                      className={`p-3 rounded-xl ${app.bg} ${app.color} shrink-0 shadow-sm border border-white/5 flex-shrink-0`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col text-left">
                      <CardTitle className="text-base font-semibold leading-none mb-2">
                        {app.title}
                      </CardTitle>
                      <CardDescription className="mt-1 sm:mt-1.5 leading-snug text-sm sm:text-base">
                        {app.description}
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
