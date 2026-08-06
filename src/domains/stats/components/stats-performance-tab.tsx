"use client";

import type { ReactNode } from "react";
import type { CharacterPerformancePayload } from "@/domains/stats/types/performance";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  IconChartBar,
  IconExternalLink,
  IconSwords,
  IconTrophy,
} from "@/shared/ui/tabler-icons";

function formatMetricValue(value: number | null, decimals = 0) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function HighlightCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-border/40 bg-card/60">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="mt-1 text-2xl font-semibold leading-relaxed">{value}</p>
            {subtitle ? (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <div className="text-muted-foreground/60">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsPerformanceTab({
  performanceData,
}: {
  performanceData: CharacterPerformancePayload | null;
}) {
  if (!performanceData) {
    return (
      <Card className="border-border/40 bg-card/60">
        <CardHeader>
          <CardTitle>Mi Rendimiento</CardTitle>
          <CardDescription>
            No hemos podido resolver un personaje principal para tu cuenta.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { character, links, rio, wcl } = performanceData;

  return (
    <div className="space-y-6 animate-in fade-in-50 mb-10">
      <Card className="border-border/40 shadow-sm bg-card/60 overflow-hidden pt-0">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">
                {character.name}
                <span className="text-muted-foreground font-semibold">
                  {" "}
                  · {character.realm}
                </span>
              </CardTitle>
              <CardDescription className="mt-1">
                {character.className ?? "Clase desconocida"}
                {character.specName ? ` · ${character.specName}` : ""}
                {character.itemLevel
                  ? ` · ilvl ${formatMetricValue(character.itemLevel, 2)}`
                  : ""}
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={links.warcraftLogs}
                target="_blank"
                rel="noreferrer"
                className="h-9 px-3 rounded-md border border-border/50 bg-background/50 hover:bg-muted/40 text-xs font-semibold inline-flex items-center gap-2"
              >
                <IconSwords className="size-3.5" /> Warcraft Logs
                <IconExternalLink className="size-3" />
              </a>
              <a
                href={links.raiderIo}
                target="_blank"
                rel="noreferrer"
                className="h-9 px-3 rounded-md border border-border/50 bg-background/50 hover:bg-muted/40 text-xs font-semibold inline-flex items-center gap-2"
              >
                <IconChartBar className="size-3.5" /> Raider.IO
                <IconExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <HighlightCard
              title="M+ Score (RIO)"
              value={formatMetricValue(rio?.mythicPlusScore ?? null)}
              subtitle="Temporada actual"
              icon={<IconChartBar className="size-5" />}
            />
            <HighlightCard
              title={wcl?.mythicPlus?.label ?? "WCL Mythic+"}
              value={formatMetricValue(wcl?.mythicPlus?.score ?? null)}
              subtitle={`Rank ${formatMetricValue(wcl?.mythicPlus?.rank ?? null)}`}
              icon={<IconTrophy className="size-5" />}
            />
            <HighlightCard
              title={wcl?.raidAllStars?.label ?? "WCL Raid"}
              value={formatMetricValue(wcl?.raidAllStars?.score ?? null)}
              subtitle={`Rank ${formatMetricValue(wcl?.raidAllStars?.rank ?? null)}`}
              icon={<IconSwords className="size-5" />}
            />
            <HighlightCard
              title="Item Level"
              value={formatMetricValue(character.itemLevel, 2)}
              subtitle="Warcraft Logs"
              icon={<IconTrophy className="size-5" />}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border/40 bg-background/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Warcraft Logs</CardTitle>
                <CardDescription>
                  Datos exactos visibles en la página pública.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {wcl?.raidProgression?.length ? (
                  wcl.raidProgression.map((entry) => (
                    <div
                      key={entry}
                      className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{entry}</span>
                      <Badge variant="outline" className="text-[10px]">
                        WCL
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No hay progresión disponible todavía para este personaje.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-background/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Raider.IO</CardTitle>
                <CardDescription>
                  Resumen exacto del perfil público.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 px-3 py-2 text-sm">
                  <span className="font-medium">M+ Score</span>
                  <Badge variant="outline" className="text-[10px]">
                    {formatMetricValue(rio?.mythicPlusScore ?? null)}
                  </Badge>
                </div>
                {rio?.raidProgression ? (
                  <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 px-3 py-2 text-sm">
                    <span className="font-medium">Raid</span>
                    <Badge variant="outline" className="text-[10px]">
                      {rio.raidProgression}
                    </Badge>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
