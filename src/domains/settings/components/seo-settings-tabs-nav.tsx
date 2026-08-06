"use client";

import { TabsList, TabsTrigger } from "@/shared/ui/tabs";

const tabs = [
  { value: "site" as const, label: "Mi sitio" },
  { value: "analytics" as const, label: "Analítica y anuncios" },
];

const triggerClass =
  "rounded-2xl border border-white/10 bg-card/30 p-3 text-center "
  + "data-[state=active]:border-blue-400/40 data-[state=active]:bg-blue-500/10 data-[state=active]:text-white";

export function SeoSettingsTabsNav() {
  return (
    <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0">
      {tabs.map((tab) => (
        <TabsTrigger key={tab.value} value={tab.value} className={triggerClass}>
          <span className="block text-xs font-medium">{tab.label}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
