"use client";

import React from "react";
import Image from "next/image";
import {
  IconBrandYoutube,
  IconLoader2,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { isYouTubeUrl, toSafeYouTubeEmbed } from "@/shared/lib/youtube";
import useSWR from "swr";

export interface PovTab {
  _key: string;
  character_name: string;
  class_id: number;
  subtitle: string;
  youtube_url: string;
}

type MemberSearchResult = {
  id: string;
  character_name: string;
  class_id: number;
  role: string;
  rank: string;
};

const CLASS_ICON_ROOT = "/assets/images/classes";

function createTab(): PovTab {
  return {
    _key: crypto.randomUUID(),
    character_name: "",
    class_id: 0,
    subtitle: "",
    youtube_url: "",
  };
}

function MemberPicker({ tab, onChange }: { tab: PovTab; onChange: (next: PovTab) => void }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const shouldFetch = open && query.trim().length >= 2;

  const { data: results = [], isLoading } = useSWR<MemberSearchResult[]>(
    shouldFetch ? ["/api/guild/members/search", query] : null,
    async ([, searchQuery]) => {
      const q = String(searchQuery);
      const res = await fetch(`/api/guild/members/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  );

  const selectMember = (member: MemberSearchResult) => {
    onChange({
      ...tab,
      character_name: member.character_name,
      class_id: member.class_id,
      subtitle: tab.subtitle || member.role || "",
    });
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
        Miembro del roster
      </Label>
      {tab.character_name ? (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/60 px-3 py-2">
          {tab.class_id > 0 ? (
            <Image
              src={`${CLASS_ICON_ROOT}/${tab.class_id}.jpg`}
              alt="Clase"
              width={32}
              height={32}
              className="size-8 rounded-lg border border-white/10 object-cover"
            />
          ) : (
            <div className="size-8 rounded-lg border border-white/10 bg-white/5" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-zinc-100">
              {tab.character_name}
            </div>
            <div className="truncate text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              {tab.subtitle || "Sin subtítulo"}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg text-[10px] uppercase tracking-[0.18em] text-blue-300 hover:bg-blue-500/10 hover:text-blue-200"
            onClick={() => setOpen((v) => !v)}
          >
            Cambiar
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/10 px-3 py-2.5 text-left text-sm text-white/35 transition-colors hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-white/70"
        >
          <IconSearch className="size-4" /> Buscar miembro del roster
        </button>
      )}

      {open && (
        <div className="rounded-xl border border-white/10 bg-zinc-950/95 p-2 shadow-2xl shadow-black/60">
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/20" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar personaje…"
              className="h-10 rounded-lg border-white/10 bg-white/[0.03] pl-9 text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 size-8 rounded-lg text-white/30 hover:bg-white/5 hover:text-white/70"
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
            >
              <IconX className="size-4" />
            </Button>
          </div>

          <div className="mt-2 max-h-56 space-y-1 overflow-auto pr-1">
            {query.trim().length < 2 ? (
              <div className="px-2 py-3 text-center text-[10px] uppercase tracking-[0.2em] text-white/20">
                Escribe al menos 2 letras
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-4 text-white/30">
                <IconLoader2 className="size-4 animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <div className="px-2 py-3 text-center text-[10px] uppercase tracking-[0.2em] text-white/20">
                Sin resultados
              </div>
            ) : (
              results.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => selectMember(member)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
                >
                  <Image
                    src={`${CLASS_ICON_ROOT}/${member.class_id}.jpg`}
                    alt="Clase"
                    width={28}
                    height={28}
                    className="size-7 rounded-md border border-white/10 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-zinc-100">
                      {member.character_name}
                    </div>
                    <div className="truncate text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                      {member.role || "Miembro del roster"}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function NewsPovTabsEditor({
  tabs,
  onChange,
}: {
  tabs: PovTab[];
  onChange: (tabs: PovTab[]) => void;
}) {
  const safeTabs = (Array.isArray(tabs) ? tabs : []).map((tab) => ({
    ...tab,
    _key: tab._key || crypto.randomUUID(),
  }));

  const addTab = () => onChange([...safeTabs, createTab()]);
  const updateTab = (index: number, next: PovTab) =>
    onChange(safeTabs.map((tab, i) => (i === index ? next : tab)));
  const removeTab = (index: number) => onChange(safeTabs.filter((_, i) => i !== index));
  const moveTab = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= safeTabs.length) return;
    const next = [...safeTabs];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-semibold italic uppercase tracking-tighter text-lg text-white/90">
            POV de raiders
          </h3>
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">
            Tabs por miembro para vídeos de raid POV
          </p>
        </div>
        <Button
          type="button"
          onClick={addTab}
          className="rounded-xl border border-blue-500/20 bg-blue-500/15 text-blue-100 hover:bg-blue-500/25 hover:text-white"
        >
          <IconPlus className="mr-2 size-4" /> Añadir tab
        </Button>
      </div>

      {safeTabs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-center">
          <p className="text-sm text-white/45">No hay tabs todavía.</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/25">
            Añade uno para empezar con los POV de raiders.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {safeTabs.map((tab, index) => (
            <div key={tab._key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                  Tab {index + 1}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => moveTab(index, -1)}
                    className="h-8 rounded-lg text-white/30 hover:bg-white/5 hover:text-white/70 disabled:opacity-20"
                  >
                    ▲
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === safeTabs.length - 1}
                    onClick={() => moveTab(index, 1)}
                    className="h-8 rounded-lg text-white/30 hover:bg-white/5 hover:text-white/70 disabled:opacity-20"
                  >
                    ▼
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTab(index)}
                    className="size-8 rounded-lg text-white/30 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <IconTrash className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-3">
                  <MemberPicker tab={tab} onChange={(next) => updateTab(index, next)} />

                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
                      Subtítulo
                    </Label>
                    <Input
                      value={tab.subtitle}
                      onChange={(e) => updateTab(index, { ...tab, subtitle: e.target.value })}
                      placeholder="Paladín Represión"
                      className="h-11 rounded-xl border-white/10 bg-white/[0.03]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
                      URL de YouTube
                    </Label>
                    <div className="relative">
                      <IconBrandYoutube className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-red-400/80" />
                      <Input
                        value={tab.youtube_url}
                        onChange={(e) => updateTab(index, { ...tab, youtube_url: e.target.value })}
                        placeholder="https://youtu.be/..."
                        className={cn(
                          "h-11 rounded-xl border-white/10 bg-white/[0.03] pl-9",
                          tab.youtube_url && !isYouTubeUrl(tab.youtube_url)
                            ? "border-red-500/40 focus-visible:ring-red-500/20"
                            : "",
                        )}
                      />
                    </div>
                    <p
                      className={cn(
                        "text-[10px] uppercase tracking-[0.18em]",
                        tab.youtube_url && !isYouTubeUrl(tab.youtube_url)
                          ? "text-red-300/80"
                          : "text-white/25",
                      )}
                    >
                      Acepta URLs de YouTube, youtu.be o enlaces de embed.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
                    Previsualización
                  </Label>
                  <div className="rounded-2xl border border-white/10 bg-black/50 p-4 text-center text-xs text-white/25">
                    {toSafeYouTubeEmbed(tab.youtube_url)
                      ? "La previsualización se verá en la noticia publicada."
                      : "Añade un enlace de YouTube para activar la vista previa."}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
