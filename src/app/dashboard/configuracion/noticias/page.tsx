import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { IconNews, IconTags, IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/shared/ui/button";
import React from "react";
import { Forbidden } from "@/shared/components/forbidden";
import { getAppPermission } from "@/shared/auth/permissions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/auth/auth-options";

export default async function NewsPortalPage() {
  const session = await getServerSession(authOptions);
  const roleLevel = session?.user?.roleLevel ?? "invitado";
  const { canView } = await getAppPermission(roleLevel, "settings-news");

  if (!canView) {
    return <Forbidden />;
  }

  const options = [
    {
      title: "Gestión de Noticias",
      description:
        "Crea, edita y publica artículos para la landing page y la aplicación.",
      icon: IconNews,
      href: "/dashboard/configuracion/noticias/editor",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Gestión de Categorías",
      description:
        "Personaliza las etiquetas y categorías disponibles para organizar el contenido.",
      icon: IconTags,
      href: "/dashboard/configuracion/noticias/categories",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
      <div className="flex items-start sm:items-center gap-4">
        <Link href="/dashboard/configuracion">
          <Button
            variant="outline"
            size="icon"
            className="size-10 sm:size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl flex-shrink-0"
          >
            <IconArrowLeft className="size-5 sm:size-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold leading-tight uppercase italic font-black tracking-tighter">
            Portal de Noticias
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Elige qué sección de comunicación deseas gestionar
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-8 max-w-5xl">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <Link href={option.href} key={option.href} className="group h-full">
              <Card className="h-full border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 overflow-hidden backdrop-blur-sm group-hover:border-primary/30 group-hover:translate-y-[-2px]">
                <CardHeader className="flex flex-row items-center gap-5 py-8 px-6">
                  <div
                    className={`p-4 rounded-2xl ${option.bg} ${option.color} shrink-0 shadow-lg border border-white/5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-${option.color.split("-")[1]}-500/20`}
                  >
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col text-left">
                    <CardTitle className="text-lg font-black italic tracking-tighter uppercase group-hover:text-primary transition-colors">
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
