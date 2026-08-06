"use client";

import React from "react";
import Image from "next/image";
import { IconPlayerPlayFilled } from "@/shared/ui/tabler-icons";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { toSafeYouTubeEmbed } from "@/shared/lib/youtube";

export interface PovTabData {
  character_name: string;
  class_id: number;
  subtitle: string;
  youtube_url: string;
}

const CLASS_ICON_ROOT = "/assets/images/classes";

export function NewsPovTabsViewer({ tabs }: { tabs: PovTabData[] }) {
  const [activeIndexState, setActiveIndex] = React.useState(0);

  if (!tabs?.length) return null;

  const activeIndex =
    activeIndexState >= tabs.length
      ? Math.max(0, tabs.length - 1)
      : activeIndexState;

  const activeTab = tabs[activeIndex];
  const embedUrl = toSafeYouTubeEmbed(activeTab.youtube_url);

  return (
    <section className="mt-10 mb-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-linear-to-r from-transparent via-blue-500/20 to-transparent" />
        <h3 className="whitespace-nowrap text-xs font-semibold italic uppercase tracking-[0.28em] text-zinc-500">
          POV de Raiders
        </h3>
        <div className="h-px flex-1 bg-linear-to-r from-transparent via-blue-500/20 to-transparent" />
      </div>

      <div
        role="tablist"
        aria-label="POV de raiders"
        className="mb-3 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1"
      >
        {tabs.map((tab, index) => (
          <button
            key={`${tab.character_name}-${tab.class_id}-${tab.youtube_url}`}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-controls={`pov-panel-${index}`}
            id={`pov-tab-${index}`}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "flex flex-1 min-w-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left ",
              index === activeIndex
                ? "border-blue-500/20 bg-blue-500/15 text-zinc-100 shadow-sm"
                : "border-transparent text-zinc-500 hover:bg-white/[0.03] hover:text-zinc-300",
            )}
          >
            <Image
              src={`${CLASS_ICON_ROOT}/${tab.class_id}.webp`}
              alt={`Clase ${tab.class_id}`}
              width={28}
              height={28}
              className="size-7 shrink-0 rounded-md border border-white/10 object-cover"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold leading-relaxed">
                {tab.character_name || "Sin nombre"}
              </span>
              {tab.subtitle ? (
                <span
                  className={cn(
                    "block truncate text-[9px] uppercase tracking-[0.16em] leading-relaxed",
                    index === activeIndex ? "text-blue-300/80" : "text-zinc-600",
                  )}
                >
                  {tab.subtitle}
                </span>
              ) : null}
            </span>
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`pov-panel-${activeIndex}`}
        aria-labelledby={`pov-tab-${activeIndex}`}
        className="overflow-hidden rounded-2xl border border-white/10 bg-black/50 shadow-2xl shadow-black/30"
      >
        {embedUrl ? (
          <div className="aspect-video w-full">
            <iframe
              src={embedUrl}
              title={`${activeTab.character_name || "POV"} — ${activeTab.subtitle || "Video"}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center gap-3 text-zinc-500">
            <IconPlayerPlayFilled className="size-10 opacity-30" />
            <span className="text-xs uppercase tracking-[0.22em]">
              Video no disponible
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
