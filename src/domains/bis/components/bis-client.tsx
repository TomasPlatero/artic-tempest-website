"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  IconSword,
  IconShield,
  IconCheck,
  IconX,
  IconRefresh,
  IconListCheck,
  IconLayoutGrid,
  IconUser,
  IconUsers,
  IconFilter,
  IconSettings,
  IconBolt,
  IconExternalLink,
  IconCloudDownload,
} from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { MIDNIGHT_RAIDS } from "@/shared/constants/raids";
import Image from "next/image";
import Script from "next/script";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

type EligibleMember = {
  id: string;
  character_name: string;
  realm_slug: string;
  class_id: number;
  rank: number;
  role: string | null;
  bis_dps_gain: number | null;
  bis_pct_gain: string | null;
  spec_name: string;
  spec_id: number | null;
  main_stat?: string;
};

export type LootItem = {
  id: number;
  name: string;
  quality: string;
  slot: string;
  slotDisplay: string;
  icon: string | null;
  itemLevel: number | null;
  itemSubclass: string | null;
  itemClassId: number | null; // 2=Weapon, 4=Armor
  itemSubclassId: number | null; // Armor: 0=Misc,1=Cloth,2=Leather,3=Mail,4=Plate,6=Shield | Weapon: 0=1hAxe,1=2hAxe,...
  weapon_type?: string | null;
  hand_type?: string | null;
  effect_type?: string | null;
  effect_stats?: string[] | null;
  effect_description?: string | null;
  inventory_type?: string; // Adding this as it's used in filtering logic
};

type Boss = {
  id: number;
  name: string;
  order: number;
  items: LootItem[];
};

type BisSelection = {
  id: string;
  member_id: string;
  item_id: number;
  item_name: string;
  item_icon: string | null;
  slot: string;
  boss_name: string | null;
  priority: number;
  difficulty: string;
  instance_id: string;
  effect_type?: string | null;
  effect_stats?: string[] | null;
  effect_description?: string | null;
  dps_gain: number | null;
  percent_gain: string | null;
  ilvl?: number;
};

const RAID_DIFFICULTIES = [
  { id: "lfr", name: "LFR", color: "text-gray-400" },
  { id: "normal", name: "Normal", color: "text-green-500" },
  { id: "heroic", name: "Heroico", color: "text-blue-500" },
  { id: "mythic", name: "Mítico", color: "text-purple-500" },
];

const QUALITY_COLORS: Record<string, string> = {
  EPIC: "text-purple-400",
  RARE: "text-blue-400",
  LEGENDARY: "text-orange-400",
  UNCOMMON: "text-green-400",
};

const WOWHEAD_QUALITY: Record<string, number> = {
  EPIC: 4,
  RARE: 3,
  LEGENDARY: 5,
  UNCOMMON: 2,
};

const normalizeQuality = (quality?: string | null) =>
  (quality || "EPIC").toString().trim().toUpperCase();

// Map frontend difficulty states to Wowhead diff IDs
const WOWHEAD_DIFF: Record<string, number> = {
  normal: 14,
  heroic: 15,
  mythic: 16,
};

// Fixed item level per raid tier difficulty (Midnight Season 1)
const MIDNIGHT_S1_ILVL: Record<
  string,
  { base: number; mid: number; final: number }
> = {
  lfr: { base: 233, mid: 237, final: 240 }, // Extrapolated from user data
  normal: { base: 246, mid: 250, final: 253 },
  heroic: { base: 259, mid: 263, final: 269 },
  mythic: { base: 272, mid: 279, final: 282 },
};

const CLASS_COLORS: Record<number, string> = {
  1: "#C69B6D",
  2: "#F48CBA",
  3: "#ABD473",
  4: "#FFF468",
  5: "#FFFFFF",
  6: "#C41E3A",
  7: "#0070DD",
  8: "#3FC7EB",
  9: "#8788EE",
  10: "#00FF98",
  11: "#FF7C0A",
  12: "#A330C9",
  13: "#33937F",
};

const CLASS_IMAGES: Record<number, string> = {
  1: "/assets/images/classes/1.jpg",
  2: "/assets/images/classes/2.jpg",
  3: "/assets/images/classes/3.jpg",
  4: "/assets/images/classes/4.jpg",
  5: "/assets/images/classes/5.jpg",
  6: "/assets/images/classes/6.jpg",
  7: "/assets/images/classes/7.jpg",
  8: "/assets/images/classes/8.jpg",
  9: "/assets/images/classes/9.jpg",
  10: "/assets/images/classes/10.jpg",
  11: "/assets/images/classes/11.jpg",
  12: "/assets/images/classes/12.jpg",
  13: "/assets/images/classes/13.jpg",
};

const CLASS_SPECS: Record<
  number,
  { id: number; name: string; icon: string }[]
> = {
  1: [
    { id: 71, name: "Arms", icon: "ability_warrior_savageblow" },
    { id: 72, name: "Fury", icon: "ability_warrior_innerrage" },
    { id: 73, name: "Protection", icon: "ability_warrior_defensivestance" },
  ],
  2: [
    { id: 65, name: "Holy", icon: "spell_holy_holybolt" },
    { id: 66, name: "Protection", icon: "ability_paladin_shieldofthetemplar" },
    { id: 70, name: "Retribution", icon: "spell_holy_auraoflight" },
  ],
  3: [
    {
      id: 253,
      name: "Beast Mastery",
      icon: "ability_hunter_bestialdiscipline",
    },
    { id: 254, name: "Marksmanship", icon: "ability_hunter_focusedaim" },
    { id: 255, name: "Survival", icon: "ability_hunter_camouflage" },
  ],
  4: [
    { id: 259, name: "Assassination", icon: "ability_rogue_deadlybrew" },
    { id: 260, name: "Outlaw", icon: "ability_rogue_waylay" },
    { id: 261, name: "Subtlety", icon: "ability_stealth" },
  ],
  5: [
    { id: 256, name: "Discipline", icon: "spell_holy_powerwordshield" },
    { id: 257, name: "Holy", icon: "spell_holy_guardianspirit" },
    { id: 258, name: "Shadow", icon: "spell_shadow_shadowwordpain" },
  ],
  6: [
    { id: 250, name: "Blood", icon: "spell_deathknight_bloodpresence" },
    { id: 251, name: "Frost", icon: "spell_deathknight_frostpresence" },
    { id: 252, name: "Unholy", icon: "spell_deathknight_unholypresence" },
  ],
  7: [
    { id: 262, name: "Elemental", icon: "spell_nature_lightning" },
    { id: 263, name: "Enhancement", icon: "spell_nature_lightningshield" },
    { id: 264, name: "Restoration", icon: "spell_nature_magicimmunity" },
  ],
  8: [
    { id: 62, name: "Arcane", icon: "spell_holy_magicalsentry" },
    { id: 63, name: "Fire", icon: "spell_fire_firebolt02" },
    { id: 64, name: "Frost", icon: "spell_frost_frostbolt02" },
  ],
  9: [
    { id: 265, name: "Affliction", icon: "spell_shadow_deathcoil" },
    { id: 266, name: "Demonology", icon: "spell_shadow_metamorphosis" },
    { id: 267, name: "Destruction", icon: "spell_shadow_rainoffire" },
  ],
  10: [
    { id: 268, name: "Brewmaster", icon: "ability_monk_fortifyingale_new" },
    { id: 269, name: "Windwalker", icon: "ability_monk_dragonkick" },
    { id: 270, name: "Mistweaver", icon: "ability_monk_chicocoon" },
  ],
  11: [
    { id: 102, name: "Balance", icon: "spell_nature_starfall" },
    { id: 103, name: "Feral", icon: "ability_druid_catform" },
    { id: 104, name: "Guardian", icon: "ability_racial_bearform" },
    { id: 105, name: "Restoration", icon: "spell_nature_healingtouch" },
  ],
  12: [
    { id: 120, name: "Devourer", icon: "ability_demonhunter_specdps" },
    { id: 577, name: "Havoc", icon: "ability_demonhunter_specdps" },
    { id: 581, name: "Vengeance", icon: "ability_demonhunter_spectank" },
  ],
  13: [
    { id: 1467, name: "Devastation", icon: "classicon_evoker_devastation" },
    { id: 1468, name: "Preservation", icon: "classicon_evoker_preservation" },
    { id: 1473, name: "Augmentation", icon: "classicon_evoker_augmentation" },
  ],
};

// Helper to translate slot names for the UI
const SLOT_TRANSLATIONS: Record<string, string> = {
  HEAD: "Cabeza",
  NECK: "Cuello",
  SHOULDER: "Hombreras",
  CHEST: "Pecho",
  WAIST: "Cinturón",
  LEGS: "Piernas",
  FEET: "Pies",
  WRIST: "Muñequeras",
  HANDS: "Guantes",
  FINGER: "Anillo",
  TRINKET: "Abalorio",
  ONE_HAND: "Una Mano",
  TWO_HAND: "Dos Manos",
  MAIN_HAND: "Mano Principal",
  OFF_HAND: "Mano Secundaria",
  SHIELD: "Escudo",
  BACK: "Capa",
  CLOAK: "Capa",
  HELD_IN_OFF_HAND: "Sostener",
  RANGED: "A Distancia",
  THROWN: "Arrojadiza",
  SHIRT: "Camisa",
  HOLDABLE: "Sostener",
  TWOHWEAPON: "Arma de 2 Manos",
  WEAPON: "Arma",
  HAND: "Guantes",
};

const translateSlot = (s: string) => SLOT_TRANSLATIONS[s.toUpperCase()] || s;

const SLOT_GROUP_ORDER: Record<string, number> = {
  Cabeza: 10,
  Cuello: 20,
  Hombreras: 30,
  Hombros: 30,
  Espalda: 40,
  Capa: 40,
  Pecho: 50,
  Munecas: 60,
  Muñecas: 60,
  Guantes: 70,
  Manos: 70,
  Cinturon: 80,
  Cinturón: 80,
  Cintura: 80,
  Piernas: 90,
  Pies: 100,
  Anillo: 110,
  Abalorio: 120,
  "Mano derecha": 130,
  "Mano Principal": 130,
  "Arma de 1 mano": 130,
  "Arma de 2 manos": 130,
  Arma: 130,
  "Mano izquierda": 140,
  "Mano Secundaria": 140,
  Escudo: 140,
  Sostener: 140,
  "Token de tier": 150,
  Otros: 999,
};

const normalizeSlotGroupKey = (slot: string) =>
  slot.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const getSlotGroupOrder = (slot: string) => {
  return (
    SLOT_GROUP_ORDER[slot] ??
    SLOT_GROUP_ORDER[normalizeSlotGroupKey(slot)] ??
    SLOT_GROUP_ORDER.Otros
  );
};

const constructWowheadParams = (
  item: any,
  difficulty: string,
  customIlvl?: number,
) => {
  const normalizeBossKey = (value: string | null | undefined) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const inferBonusIds = () => {
    const currentIlvl = customIlvl || item.itemLevel || item.ilvl || 0;
    const bossStepMap: Record<string, number> = {
      "imperator averzian": 1,
      vorasius: 2,
      "fallen-king salhadaar": 2,
      "rey caido salhadaar": 2,
      "rey caído salhadaar": 2,
      "chimaerus the undreamt god": 2,
      "chimaerus, el dios no sonado": 2,
      "chimaerus, el dios no soñado": 2,
      "vaelgor & ezzorak": 3,
      "vaelgor y ezzorak": 3,
      "lightblinded vanguard": 3,
      "vanguardia cegada por la luz": 3,
      "belo'ren, child of al'ar": 3,
      "belo'ren, vastago de al'ar": 3,
      "belo'ren, vástago de al'ar": 3,
      "crown of the cosmos": 4,
      "corona del cosmos": 4,
      "l'ura": 4,
      "caida de medianoche (l'ura)": 4,
      "caída de medianoche (l'ura)": 4,
    };
    const bonusByDifficulty: Record<
      string,
      Array<{ ilvl: number; bonusId: number }>
    > = {
      normal: [
        { ilvl: 246, bonusId: 12785 },
        { ilvl: 249, bonusId: 12786 },
        { ilvl: 252, bonusId: 12787 },
        { ilvl: 256, bonusId: 12788 },
        { ilvl: 259, bonusId: 12789 },
        { ilvl: 262, bonusId: 12790 },
      ],
      heroic: [
        { ilvl: 259, bonusId: 12793 },
        { ilvl: 262, bonusId: 12794 },
        { ilvl: 265, bonusId: 12795 },
        { ilvl: 269, bonusId: 12796 },
        { ilvl: 272, bonusId: 12797 },
        { ilvl: 275, bonusId: 12798 },
      ],
      mythic: [
        { ilvl: 272, bonusId: 12801 },
        { ilvl: 275, bonusId: 12802 },
        { ilvl: 278, bonusId: 12803 },
        { ilvl: 282, bonusId: 12804 },
        { ilvl: 285, bonusId: 12805 },
        { ilvl: 288, bonusId: 12806 },
      ],
    };

    const bossName = normalizeBossKey(item.boss_name || item.bossName);
    const mappedStep = bossStepMap[bossName];
    const stepMatch = bonusByDifficulty[difficulty.toLowerCase()]?.find(
      (entry) => entry.ilvl === currentIlvl,
    );

    if (stepMatch) {
      return [stepMatch.bonusId];
    }

    if (!mappedStep) return [];

    const baseIlvl =
      difficulty.toLowerCase() === "normal"
        ? 246
        : difficulty.toLowerCase() === "heroic"
          ? 259
          : difficulty.toLowerCase() === "mythic"
            ? 272
            : 0;
    if (!baseIlvl) return [];
    const inferredIlvl = baseIlvl + (mappedStep - 1) * 3;
    return bonusByDifficulty[difficulty.toLowerCase()]?.find(
      (entry) => entry.ilvl === inferredIlvl,
    )
      ? [
          bonusByDifficulty[difficulty.toLowerCase()].find(
            (entry) => entry.ilvl === inferredIlvl,
          )!.bonusId,
        ]
      : [];
  };

  const diffId = WOWHEAD_DIFF[difficulty] || 15;

  // Get ilvl from the item record (which we already fixed in DB)
  // or fallback to our 3-tier table using a sensible default (base)
  const ilvlTable = MIDNIGHT_S1_ILVL[difficulty.toLowerCase()] || {
    base: 246,
    mid: 250,
    final: 253,
  };
  const ilvl = customIlvl || item.itemLevel || item.ilvl || ilvlTable.base;

  let params = `item=${item.id || item.item_id}`;

  if (diffId) params += `&diff=${diffId}`;
  if (ilvl) params += `&ilvl=${ilvl}`;

  // Quality
  const quality = normalizeQuality(item.quality);
  if (quality && WOWHEAD_QUALITY[quality])
    params += `&qu=${WOWHEAD_QUALITY[quality]}`;

  // Advanced metadata
  const resolvedBonusIds =
    (item.bonus_ids && item.bonus_ids.length > 0 && item.bonus_ids) ||
    (item.bonusIds && item.bonusIds.length > 0 && item.bonusIds) ||
    inferBonusIds();

  if (resolvedBonusIds && resolvedBonusIds.length > 0)
    params += `&bonus=${resolvedBonusIds.join(":")}`;

  return params;
};

const getIconUrl = (url: string | null, itemName?: string) => {
  if (!url) return null;

  // Hardcoded fix for specific broken icon
  if (itemName === "Vestigio rezumante del Dios Inconcebible") {
    return "https://wow.zamimg.com/images/wow/icons/large/inv_12_trinket_raid_dreamrift-_physdps2_umdreamtgodsoozingvestige.jpg";
  }

  // Handle Blizzard render URLs or raw names
  let iconName = "";

  if (
    url.includes("render.worldofwarcraft.com") ||
    url.includes("render-eu.worldofwarcraft.com")
  ) {
    const parts = url.split("/");
    iconName = parts[parts.length - 1];
  } else if (url.startsWith("http")) {
    return url;
  } else {
    iconName = url;
  }

  // Cleanup and ensure extension
  iconName = iconName.replace(/\.[^/.]+$/, "").toLowerCase();
  if (iconName.includes("?")) iconName = iconName.split("?")[0];

  return `https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`;
};

// Individual loot item card helper component
function LootItemCard({
  item,
  bossName,
  priority,
  onToggle,
  difficulty,
  instanceId,
}: {
  item: LootItem;
  bossName: string;
  priority: number | null;
  onToggle: (priority: number) => void;
  difficulty: "normal" | "heroic" | "mythic" | string;
  instanceId: string;
}) {
  const qualityColor =
    QUALITY_COLORS[normalizeQuality(item.quality)] || "text-foreground";

  // Use fixed ilvl from raid tier table for the selected difficulty
  const ilvlTable = MIDNIGHT_S1_ILVL[difficulty.toLowerCase()] || {
    base: 246,
    mid: 250,
    final: 253,
  };
  const computedItemLevel = item.itemLevel || ilvlTable.base;

  // Map blizzard icon URL to Wowhead CDN URL to avoid 403s
  const iconUrl = getIconUrl(item.icon, item.name);

  return (
    <div
      className={`
                flex flex-col gap-2 p-2.5 rounded-xl border text-left transition-all w-full
                ${
                  priority
                    ? "border-purple-500/50 bg-purple-500/5 shadow-sm shadow-purple-500/10"
                    : "border-border/50 bg-card/50 hover:border-border hover:bg-muted/10"
                }
            `}
    >
      <a
        href={`https://www.wowhead.com/es/item=${item.id}`}
        target="_blank"
        rel="nofollow noreferrer"
        data-wowhead={constructWowheadParams(item, difficulty)}
        data-wowhead-icon="false"
        data-wowhead-rename="false"
        className="flex items-center gap-3 no-underline outline-none"
      >
        {iconUrl ? (
          <Image
            unoptimized
            src={iconUrl}
            alt=""
            width={36}
            height={36}
            className="rounded-lg border border-border/50 shadow-sm shrink-0"
          />
        ) : (
          <div className="size-9 rounded-lg bg-muted border border-border/50 flex items-center justify-center shrink-0">
            <IconShield className="size-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold truncate ${qualityColor}`}>
            {item.name}
          </p>
          <p className="text-[10px] text-muted-foreground/60 truncate uppercase font-bold tracking-tight">
            {computedItemLevel ? `${computedItemLevel} · ` : ""}
            {bossName}
          </p>
          {item.effect_description && (
            <div className="mt-1.5 flex flex-col gap-1">
              {item.effect_type && (
                <span className="text-[8px] font-black uppercase tracking-widest text-teal-500/80 bg-teal-500/5 px-1 rounded-sm w-fit">
                  {item.effect_type}
                </span>
              )}
              <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2 italic">
                &quot;{item.effect_description.split("\n")[0]}&quot;
              </p>
            </div>
          )}
        </div>
      </a>

      {/* Priority Selection Buttons (WoW Audit Style) */}
      <div className="flex items-center gap-1.5 mt-1 border-t border-border/10 pt-2">
        <button
          onClick={() => onToggle(1)}
          className={`
                        flex-1 h-7 rounded-md text-[10px] font-black transition-all flex items-center justify-center
                        ${
                          priority === 1
                            ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                            : "bg-white/5 text-muted-foreground/40 hover:bg-white/10 hover:text-green-500"
                        }
                    `}
          title="Prioridad Pequeña"
        >
          BAJA (CATALIZAR)
        </button>
        <button
          onClick={() => onToggle(2)}
          className={`
                        flex-1 h-7 rounded-md text-[10px] font-black transition-all flex items-center justify-center
                        ${
                          priority === 2
                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                            : "bg-white/5 text-muted-foreground/40 hover:bg-white/10 hover:text-orange-500"
                        }
                    `}
          title="Prioridad Grande"
        >
          MEDIA (MEJORA)
        </button>
        <button
          onClick={() => onToggle(3)}
          className={`
                        flex-1 h-7 rounded-md text-[10px] font-black transition-all flex items-center justify-center
                        ${
                          priority === 3
                            ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                            : "bg-white/5 text-muted-foreground/40 hover:bg-white/10 hover:text-red-500"
                        }
                    `}
          title="Prioridad Urgente"
        >
          ALTA (BiS)
        </button>
      </div>
    </div>
  );
}

function WishlistCard({
  selectedMember,
  difficulty,
  selections,
  loadingSelections,
  translateSlot,
  setSelections,
  bosses,
  instanceId,
  activeSpecName,
}: {
  selectedMember: EligibleMember | undefined;
  difficulty: "normal" | "heroic" | "mythic";
  selections: BisSelection[];
  loadingSelections: boolean;
  translateSlot: (s: string) => string;
  setSelections: React.Dispatch<React.SetStateAction<BisSelection[]>>;
  bosses: Boss[];
  instanceId: string;
  activeSpecName?: string;
}) {
  return (
    <Card className="h-fit sticky top-20 w-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <IconListCheck className="size-5" />
          Tu Lista de Deseos
          {selections.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {selections.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="flex flex-col gap-1">
          <span className="font-bold text-foreground">
            {selectedMember?.character_name || "Selecciona un personaje"}
          </span>
          <span className="text-[10px] uppercase tracking-wider">
            {activeSpecName || selectedMember?.spec_name} ·{" "}
            {difficulty === "normal"
              ? "Normal"
              : difficulty === "heroic"
                ? "Heroico"
                : "Mítico"}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingSelections ? (
          <div className="flex justify-center py-6">
            <IconRefresh className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : selections.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <IconListCheck className="size-8 mx-auto mb-3 opacity-20" />
            <p>Sin ítems seleccionados.</p>
            <p className="text-xs mt-1">
              Haz clic en un ítem del panel para añadirlo.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {selections.map((sel) => {
              const priorityColor =
                sel.priority === 1
                  ? "bg-green-500/10 text-green-500"
                  : sel.priority === 2
                    ? "bg-orange-500/10 text-orange-500"
                    : "bg-red-500/10 text-red-500";

              const priorityLabel =
                sel.priority === 1 ? "CAT" : sel.priority === 2 ? "MEJ" : "BiS";

              return (
                <a
                  key={sel.id}
                  href={`https://www.wowhead.com/es/item=${sel.item_id}`}
                  target="_blank"
                  rel="nofollow"
                  className="flex items-center gap-2.5 p-2 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors group no-underline"
                  data-wowhead={constructWowheadParams(sel, difficulty)}
                  data-wowhead-icon="false"
                  data-wowhead-rename="false"
                  onClick={(e) => {
                    const isDeleteBtn = (e.target as HTMLElement).closest(
                      "button",
                    );
                    if (isDeleteBtn) e.preventDefault();
                  }}
                >
                  {(() => {
                    const iconUrl = getIconUrl(sel.item_icon, sel.item_name);

                    return iconUrl ? (
                      <Image
                        unoptimized
                        src={iconUrl}
                        alt=""
                        width={36}
                        height={36}
                        className="rounded border border-border/50 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="size-9 rounded bg-muted border border-border/50 flex items-center justify-center shrink-0">
                        <IconShield className="size-4 text-muted-foreground" />
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-purple-400 truncate leading-none mb-1">
                      {sel.item_name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium min-w-0">
                      <span className="shrink-0 text-foreground/40 font-bold tracking-tight">
                        {sel.ilvl ? `${sel.ilvl} · ` : ""}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 px-1 py-0.5 rounded-[3px] text-[8px] font-black",
                          priorityColor,
                        )}
                      >
                        {priorityLabel}
                      </span>
                      <span className="truncate min-w-0 block">
                        {sel.boss_name} · {translateSlot(sel.slot)}
                      </span>
                    </div>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 rounded p-1 transition-all"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await fetch(`/api/bis?id=${sel.id}`, {
                        method: "DELETE",
                      });
                      setSelections((prev) =>
                        prev.filter((s) => s.id !== sel.id),
                      );
                    }}
                  >
                    <IconX className="size-3.5" />
                  </button>
                </a>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type OverviewSelection = {
  member_id: string;
  item_id: number;
  difficulty: string;
  priority: number;
  effect_type?: string | null;
  effect_stats?: string[] | null;
  effect_description?: string | null;
  dps_gain: number | null;
  percent_gain: string | null;
  guild_members: {
    character_name: string;
    class_id: number;
    role: string | null;
  };
};

export function BisClient({
  eligibleMembers,
  allMembers = [],
  canEdit = false,
}: {
  eligibleMembers: EligibleMember[];
  allMembers?: EligibleMember[];
  canEdit?: boolean;
}) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  // Ensure we have a default selection once data is loaded
  useEffect(() => {
    if (!selectedMemberId) {
      if (eligibleMembers.length > 0)
        setSelectedMemberId(eligibleMembers[0].id);
      else if (allMembers.length > 0) setSelectedMemberId(allMembers[0].id);
    }
  }, [eligibleMembers, allMembers, selectedMemberId]);
  const [isManagingRoster, setIsManagingRoster] = useState(false);
  const [difficulty, setDifficulty] = useState<"normal" | "heroic" | "mythic">(
    "heroic",
  );
  const [viewMode, setViewMode] = useState<"slot" | "boss">("slot");
  const [selectedRaidId, setSelectedRaidId] = useState<string>("default");
  const [bosses, setBosses] = useState<Boss[]>([]);
  const [selections, setSelections] = useState<BisSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSelections, setLoadingSelections] = useState(false);
  const [raidName, setRaidName] = useState("");
  const [resolvedInstanceId, setResolvedInstanceId] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "guild" | "stats">("personal");
  const [overviewData, setOverviewData] = useState<OverviewSelection[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [activeSpecId, setActiveSpecId] = useState<number | null>(null);
  const [activeSpecName, setActiveSpecName] = useState<string>("");

  useEffect(() => {
    if (!mounted) setMounted(true);
  }, [mounted]);

  // Derived selections
  const selectedMember = useMemo(() => {
    return [...eligibleMembers, ...allMembers].find(
      (m) => m.id === selectedMemberId,
    );
  }, [eligibleMembers, allMembers, selectedMemberId]);

  // Update active spec when member changes
  useEffect(() => {
    if (selectedMember) {
      setActiveSpecId(selectedMember.spec_id);
      setActiveSpecName(selectedMember.spec_name);
    }
  }, [selectedMember]);

  const isInternalMember = useMemo(() => {
    return eligibleMembers.some((m) => m.id === selectedMemberId);
  }, [eligibleMembers, selectedMemberId]);

  // Refresh Wowhead tooltips when content changes
  useEffect(() => {
    const refreshTooltips = () => {
      if (typeof window !== "undefined") {
        const wh = (window as any).WH;
        const $wh = (window as any).$WH;
        if (wh?.Tooltips?.refreshLinks) wh.Tooltips.refreshLinks();
        if ($wh?.Tooltips?.refreshLinks) $wh.Tooltips.refreshLinks();
      }
    };

    // Multiple attempts to refresh as Wowhead script might take time to initialize
    const timers = [
      setTimeout(refreshTooltips, 100),
      setTimeout(refreshTooltips, 500),
      setTimeout(refreshTooltips, 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [bosses, selections, viewMode, mounted]);

  const fetchLoot = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setBosses([]); // Clear old data to avoid visual mismatch
      setRaidName("");
      try {
        const t = Date.now();
        let url = `/api/loot/raid?difficulty=${difficulty}&_t=${t}${forceRefresh ? "&refresh=true" : ""}`;
        if (selectedRaidId !== "default") {
          url += `&instance_id=${selectedRaidId}`;
        }
        if (activeSpecId) {
          url += `&spec_id=${activeSpecId}`;
        } else {
          setLoading(false);
          return; // Guard: Don't fetch without spec_id to avoid 400 errors
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch loot");
        const data = await res.json();
        setBosses(data.bosses || []);
        setRaidName(data.instanceName || "");
        setResolvedInstanceId(data.instanceId?.toString() || "");
        if (forceRefresh) {
          toast.success("Actualizado", {
            description: "Loot de la raid refrescado desde Blizzard.",
          });
        }
      } catch (e) {
        toast.error("Error", {
          description: "No se pudo cargar el loot de la raid.",
        });
      } finally {
        setLoading(false);
      }
    },
    [difficulty, selectedRaidId, activeSpecId],
  );

  const fetchSelections = useCallback(async () => {
    if (!selectedMemberId || !resolvedInstanceId) return;
    setLoadingSelections(true);
    try {
      const t = Date.now();
      let url = `/api/bis?member_id=${selectedMemberId}&difficulty=${difficulty}&instance_id=${resolvedInstanceId}&_t=${t}`;

      // Always send spec_id, if null send it as string "null" or exclude it
      // but here we want to BE SURE we filter.
      if (activeSpecId !== null && activeSpecId !== undefined) {
        url += `&spec_id=${activeSpecId}`;
      } else {
        // If we explicitly want to fetch items without a spec_id (rare)
        // but usually in this component we expect a spec.
        url += `&spec_id=null`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch selections");
      setSelections(await res.json());
    } catch {
      setSelections([]);
    } finally {
      setLoadingSelections(false);
    }
  }, [selectedMemberId, difficulty, resolvedInstanceId, activeSpecId]);

  const fetchOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const t = Date.now();
      const res = await fetch(
        `/api/bis/overview?instance_id=${resolvedInstanceId}&difficulty=${difficulty}&_t=${t}`,
      );
      if (res.ok) {
        const data = await res.json();
        setOverviewData(data);
      }
    } catch (e) {
      console.error("Failed to load overview:", e);
    } finally {
      setLoadingOverview(false);
    }
  }, [resolvedInstanceId, difficulty]);

  useEffect(() => {
    if (activeTab === "guild") {
      fetchOverview();
    }
  }, [activeTab, fetchOverview, difficulty, resolvedInstanceId]);

  // Fetch loot when difficulty, member, raid or SPEC changes
  useEffect(() => {
    fetchLoot();
  }, [difficulty, fetchLoot, selectedRaidId, selectedMemberId, activeSpecId]);

  useEffect(() => {
    if (selectedMemberId && resolvedInstanceId) fetchSelections();
  }, [
    selectedMemberId,
    difficulty,
    resolvedInstanceId,
    fetchSelections,
    activeSpecId,
  ]);

  const isSelected = (itemId: number) =>
    selections.some((s) => s.item_id === itemId);

  async function updatePriority(
    item: LootItem,
    bossName: string,
    priorityLevel: number,
  ) {
    const existing = selections.find((s) => s.item_id === item.id);
    const ilvlTable = MIDNIGHT_S1_ILVL[difficulty.toLowerCase()] || {
      base: 246,
      mid: 250,
      final: 253,
    };
    const computedItemLevel = item.itemLevel || ilvlTable.base;

    if (existing && existing.priority === priorityLevel) {
      // Remove selection if same priority clicked
      try {
        await fetch(`/api/bis?id=${existing.id}`, { method: "DELETE" });
        setSelections((prev) => prev.filter((s) => s.id !== existing.id));
        toast.success("Eliminado", {
          description: `${item.name} eliminado de tu lista.`,
        });
      } catch {
        toast.error("Error", { description: "No se pudo eliminar el ítem." });
      }
    } else {
      // Add or Change selection
      try {
        const res = await fetch("/api/bis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            member_id: selectedMemberId,
            item_id: item.id,
            item_name: item.name,
            item_icon: item.icon,
            slot: item.slotDisplay || item.slot,
            boss_name: bossName,
            priority: priorityLevel,
            difficulty,
            instance_id: resolvedInstanceId,
            spec_id: activeSpecId,
            ilvl: computedItemLevel,
          }),
        });
        if (!res.ok) throw new Error("API error");
        const newSel = await res.json();
        setSelections((prev) => {
          const filtered = prev.filter((s) => s.item_id !== item.id);
          return [...filtered, newSel];
        });
        toast.success(existing ? "Actualizado" : "Añadido", {
          description: `${item.name} con prioridad ${priorityLevel === 1 ? "Small" : priorityLevel === 2 ? "Big" : "Huge"}.`,
        });
      } catch {
        toast.error("Error", {
          description: "No se pudo guardar la selección.",
        });
      }
    }
  }

  // The API is the authoritative source for spec filtering.
  // Keep only client-side deduplication here.
  const filteredBosses = useMemo(() => {
    return bosses
      .map((boss) => {
        const seenIds = new Set<number>();
        const uniqueItems = boss.items.filter((item) => {
          if (seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });
        return { ...boss, items: uniqueItems };
      })
      .filter((boss) => boss.items.length > 0);
  }, [bosses]);

  // Group items by slot for slot view
  const itemsBySlot = useMemo(() => {
    const map = new Map<string, { item: LootItem; bossName: string }[]>();
    for (const boss of filteredBosses) {
      for (const item of boss.items) {
        const slot = item.slotDisplay || item.slot || "Otros";
        if (!map.has(slot)) map.set(slot, []);
        map.get(slot)!.push({ item, bossName: boss.name });
      }
    }

    return new Map(
      [...map.entries()].sort((a, b) => {
        const orderDiff = getSlotGroupOrder(a[0]) - getSlotGroupOrder(b[0]);
        if (orderDiff !== 0) return orderDiff;
        return a[0].localeCompare(b[0]);
      }),
    );
  }, [filteredBosses]);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        <p className="mt-4 text-muted-foreground animate-pulse font-medium uppercase tracking-widest text-[10px]">
          Cargando...
        </p>
      </div>
    );
  }

  if (eligibleMembers.length === 0 && allMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-4">
        <IconSword className="size-12 opacity-20" />
        <p className="text-lg font-medium">No tienes personajes elegibles</p>
        <p className="text-sm max-w-md">
          Necesitas al menos un personaje vinculado a la hermandad con rango
          Trial o superior. Ve a <span className="text-primary">Cuenta</span>{" "}
          para vincular tu Battle.net.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-full overflow-hidden">
      <Script
        id="wowhead-tooltips-setup"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.whTooltips = { colorLinks: true, iconizeLinks: false, renameLinks: false, language: 'es' };`,
        }}
      />

      <Script
        src="https://wow.zamimg.com/js/tooltips.js"
        strategy="lazyOnload"
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-2 border-b border-border/10">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">
            Lista de Deseos BiS
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
            {activeTab === "personal"
              ? selectedRaidId === "default"
                ? "Loot disponible en todas las raids de la Temporada 1."
                : `Loot disponible en ${raidName}`
              : "Visión general de las necesidades de toda la hermandad para la Temporada 1."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50 shadow-inner w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("personal")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all rounded-lg ${activeTab === "personal" ? "bg-background text-primary shadow-sm ring-1 ring-border/20" : "text-muted-foreground hover:text-foreground"}`}
            >
              <IconUser className="size-3.5" />
              Mi Lista
            </button>
            <button
              onClick={() => setActiveTab("guild")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all rounded-lg ${activeTab === "guild" ? "bg-background text-primary shadow-sm ring-1 ring-border/20" : "text-muted-foreground hover:text-foreground"}`}
            >
              <IconUsers className="size-3.5" />
              Visión General
            </button>
          </div>

          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 px-4 rounded-xl bg-blue-500/5 text-blue-400 border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-300 gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg w-full sm:w-auto"
            >
              <Link href="/dashboard/bis/admin">
                <IconSettings className="size-3.5" />
                Gestionar
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Character Selector - Only for Personal tab */}
          {activeTab === "personal" && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Select
                value={selectedMemberId}
                onValueChange={(val) => {
                  setSelectedMemberId(val);
                  const member = [...eligibleMembers, ...allMembers].find(
                    (m) => m.id === val,
                  );
                  if (member) {
                    setActiveSpecId(member.spec_id);
                    setActiveSpecName(member.spec_name);
                  }
                }}
              >
                <SelectTrigger
                  className={cn(
                    "w-full sm:w-[220px] h-10 text-xs bg-background border-border/40 rounded-xl font-bold",
                    !isInternalMember && "border-blue-500/50 bg-blue-500/5",
                  )}
                >
                  <IconUser
                    className={cn(
                      "size-4 mr-2",
                      !isInternalMember
                        ? "text-blue-400"
                        : "text-muted-foreground",
                    )}
                  />
                  <SelectValue placeholder="Personaje" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-[400px]">
                  {eligibleMembers.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                        Mis Personajes
                      </div>
                      {eligibleMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <div className="flex items-center gap-2">
                            <Image
                              src={
                                CLASS_IMAGES[m.class_id] ||
                                "/assets/images/classes/1.jpg"
                              }
                              alt=""
                              width={16}
                              height={16}
                              className="rounded-full"
                            />
                            {m.character_name}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {canEdit && allMembers.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-[10px] font-black text-blue-500/40 uppercase tracking-widest mt-2 border-t border-border/10 pt-2">
                        Gestionar Roster
                      </div>
                      {allMembers
                        .filter(
                          (m) => !eligibleMembers.some((em) => em.id === m.id),
                        ) // Hide duplicates
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <div className="flex items-center gap-2">
                              <Image
                                src={
                                  CLASS_IMAGES[m.class_id] ||
                                  "/assets/images/classes/1.jpg"
                                }
                                alt=""
                                width={16}
                                height={16}
                                className="rounded-full opacity-60"
                              />
                              <span className="opacity-80">
                                {m.character_name}
                              </span>
                              <Badge
                                variant="outline"
                                className="ml-auto text-[8px] h-3.5 px-1 opacity-40"
                              >
                                Oficial
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                    </>
                  )}
                </SelectContent>
              </Select>

              {!isInternalMember && selectedMember && (
                <Badge
                  variant="outline"
                  className="h-10 px-3 rounded-xl bg-blue-500/10 text-blue-400 border-blue-500/20 gap-2 border-dashed w-full sm:w-auto"
                >
                  <IconSettings className="size-3 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Gestionando a {selectedMember.character_name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5 ml-1 hover:bg-blue-500/20 rounded-full"
                    onClick={() =>
                      setSelectedMemberId(eligibleMembers[0]?.id || "")
                    }
                  >
                    <IconX className="size-3" />
                  </Button>
                </Badge>
              )}
            </div>
          )}

          {/* Raid Selector */}
          <Select value={selectedRaidId} onValueChange={setSelectedRaidId}>
            <SelectTrigger className="w-full sm:w-[220px] h-10 text-xs bg-background border-border/40 rounded-xl font-bold">
              <IconFilter className="size-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Seleccionar Banda" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="default">
                Temporada 1 (Todas las Raids)
              </SelectItem>
              <div className="px-2 py-1.5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">
                Raids Específicas
              </div>
              {MIDNIGHT_RAIDS.map((raid) => (
                <SelectItem key={raid.id} value={raid.id}>
                  {raid.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Difficulty */}
          <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50 w-full sm:w-auto">
            <button
              className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${difficulty === "normal" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setDifficulty("normal")}
            >
              Normal
            </button>
            <button
              className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${difficulty === "heroic" ? "bg-green-600 text-white shadow-lg shadow-green-500/20" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setDifficulty("heroic")}
            >
              Heroico
            </button>
            <button
              className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${difficulty === "mythic" ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setDifficulty("mythic")}
            >
              Mítico
            </button>
          </div>

          {/* Specialization Selector */}
          {selectedMember && (
            <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-xl border border-border/50 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2">
                Spec
              </span>
              <div className="flex gap-1">
                {CLASS_SPECS[selectedMember.class_id]?.map((spec) => (
                  <button
                    key={spec.id}
                    onClick={() => {
                      setActiveSpecId(spec.id);
                      setActiveSpecName(spec.name);
                    }}
                    className={cn(
                      "relative size-8 rounded-lg overflow-hidden transition-all hover:scale-105 active:scale-95",
                      activeSpecId === spec.id
                        ? "ring-2 ring-primary shadow-lg scale-110 z-10"
                        : "grayscale opacity-50 hover:grayscale-0 hover:opacity-100",
                    )}
                    title={spec.name}
                  >
                    <Image
                      unoptimized
                      src={`https://wow.zamimg.com/images/wow/icons/medium/${spec.icon}.jpg`}
                      alt={spec.name}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode */}
          <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50 flex-1 sm:flex-none">
            <button
              className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded-lg ${viewMode === "slot" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setViewMode("slot")}
            >
              <IconLayoutGrid className="size-3.5" /> Ranura
            </button>
            <button
              className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded-lg ${viewMode === "boss" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setViewMode("boss")}
            >
              <IconSword className="size-3.5" /> Jefe
            </button>
          </div>

          {/* Force Refresh */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-foreground border border-border/50 rounded-xl hover:bg-muted/50 transition-all"
            onClick={() => fetchLoot(true)}
            disabled={loading}
            title="Refrescar loot desde Blizzard"
          >
            <IconRefresh
              className={`size-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {activeTab === "guild" ? (
        // --- GUILD OVERVIEW TAB ---
        loadingOverview ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary/50"></div>
            <p className="mt-4 text-muted-foreground animate-pulse font-medium uppercase tracking-widest text-[10px]">
              Cargando hermandad...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bosses.map((boss) => {
              const bossItems = boss.items
                .filter((item) => {
                  // Only show items that have at least one selector in this difficulty
                  const selectors = overviewData.filter(
                    (s) => s.item_id === item.id && s.difficulty === difficulty,
                  );
                  return selectors.length > 0;
                })
                .sort((a, b) => {
                  // Sort items by total number of selectors or priority?
                  const selectorsA = overviewData.filter(
                    (s) => s.item_id === a.id && s.difficulty === difficulty,
                  ).length;
                  const selectorsB = overviewData.filter(
                    (s) => s.item_id === b.id && s.difficulty === difficulty,
                  ).length;
                  return selectorsB - selectorsA;
                });

              if (bossItems.length === 0) return null;

              return (
                <Card
                  key={boss.id}
                  className="bg-card/20 border-border/30 overflow-hidden shadow-none backdrop-blur-md h-fit rounded-[2rem] group"
                >
                  <div className="px-5 py-3.5 bg-muted/10 border-b border-border/20 flex items-center justify-between">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-500/90 group-hover:text-amber-400 transition-colors">
                      {boss.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 px-2 bg-amber-500/5 border-amber-500/20 text-amber-500/60 font-black rounded-lg"
                    >
                      {bossItems.length}
                    </Badge>
                  </div>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/20">
                      {bossItems.map((item) => {
                        const ilvlValue = MIDNIGHT_S1_ILVL[
                          difficulty.toLowerCase()
                        ] || { base: 210, final: 219 };
                        const midnightIlvl =
                          typeof ilvlValue === "object"
                            ? ilvlValue.base
                            : ilvlValue;
                        const selectors = overviewData.filter(
                          (s) =>
                            s.item_id === item.id &&
                            s.difficulty === difficulty,
                        );

                        return (
                          <div
                            key={item.id}
                            className="p-4 hover:bg-muted/5 transition-colors"
                          >
                            <div className="flex items-start gap-2.5 mb-2.5">
                              {item.icon && (
                                <Image
                                  unoptimized
                                  src={getIconUrl(item.icon, item.name) || ""}
                                  alt=""
                                  width={32}
                                  height={32}
                                  className="rounded-lg border border-border/50 shadow-sm shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <a
                                  href={`https://www.wowhead.com/es/item=${item.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`text-xs font-bold leading-none truncate block hover:underline ${QUALITY_COLORS[normalizeQuality(item.quality)] || "text-foreground"}`}
                                  data-wowhead={constructWowheadParams(
                                    item,
                                    difficulty,
                                  )}
                                >
                                  {item.name}
                                </a>
                                <span className="text-[9px] text-muted-foreground uppercase font-medium tracking-tight mt-1 block">
                                  {midnightIlvl} —{" "}
                                  {item.slotDisplay || item.slot}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {selectors.map((sel) => {
                                const classId = (Array.isArray(sel.guild_members)
                                  ? sel.guild_members[0]?.class_id
                                  : sel.guild_members?.class_id) || 1;
                                const charName = (Array.isArray(sel.guild_members)
                                  ? sel.guild_members[0]?.character_name
                                  : sel.guild_members?.character_name) || "Desconocido";
                                const classColor = CLASS_COLORS[classId] || "#ffffff";

                                return (
                                  <div
                                    key={`${sel.member_id}-${item.id}`}
                                    className="flex items-center gap-1.5 bg-background/30 backdrop-blur-sm border border-white/5 rounded-lg px-2 py-1 shadow-sm transition-all hover:bg-background/50"
                                    style={{
                                      boxShadow: `0 2px 8px -2px ${classColor}20`,
                                      borderColor: `${classColor}30`,
                                    }}
                                  >
                                    <div 
                                      className="size-1.5 rounded-full" 
                                      style={{ backgroundColor: classColor, boxShadow: `0 0 4px ${classColor}` }}
                                    />
                                    <span
                                      className="text-[10px] font-bold tracking-tight"
                                      style={{ color: classColor }}
                                    >
                                      {charName}
                                    </span>
                                    <span
                                      className={cn(
                                        "px-1 rounded-[3px] text-[7px] font-black leading-none py-0.5 ml-0.5",
                                        sel.priority === 1
                                          ? "bg-green-500/20 text-green-500"
                                          : sel.priority === 2
                                            ? "bg-orange-500/20 text-orange-500"
                                            : "bg-red-500/20 text-red-500",
                                      )}
                                    >
                                      {sel.priority === 1
                                        ? "S"
                                        : sel.priority === 2
                                          ? "B"
                                          : "H"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        <div className="flex flex-col gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
              <IconRefresh className="size-8 animate-spin opacity-20" />
              <span className="text-xs font-black uppercase tracking-widest opacity-40">
                Cargando loot de la raid...
              </span>
            </div>
          ) : bosses.length === 0 ? (
            <Card className="rounded-2xl bg-card/30 border-dashed">
              <CardContent className="py-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                <IconSword className="size-12 opacity-10" />
                <div className="space-y-1">
                  <p className="font-bold text-lg">
                    No hay datos de loot disponibles
                  </p>
                  <p className="text-sm opacity-60 max-w-sm mx-auto">
                    Comprueba que las credenciales de Battle.net están
                    configuradas correctamente en los ajustes de la hermandad.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
              {/* Main Loot Grid */}
              <div className="space-y-6 min-w-0">
                <div className="lg:hidden mb-6 w-full min-w-0">
                  <WishlistCard
                    selectedMember={selectedMember}
                    difficulty={difficulty}
                    selections={selections}
                    loadingSelections={loadingSelections}
                    translateSlot={translateSlot}
                    setSelections={setSelections}
                    bosses={bosses}
                    instanceId={resolvedInstanceId}
                  />
                </div>

                {viewMode === "slot" ? (
                  // VIEW BY SLOT
                  <Accordion type="multiple" className="space-y-4">
                    {[...itemsBySlot.entries()].map(([slotName, entries]) => (
                      <AccordionItem
                        key={slotName}
                        value={slotName}
                        className="border border-border/40 rounded-2xl px-5 bg-card/30 shadow-sm overflow-hidden"
                      >
                        <AccordionTrigger className="hover:no-underline py-5 group">
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400 group-hover:text-blue-300 transition-colors">
                              {slotName}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] border-blue-500/10 text-blue-400/40 font-black"
                            >
                              {entries.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-5">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                            {entries.map(({ item, bossName }) => (
                              <LootItemCard
                                key={`${item.id}-${bossName}`}
                                item={item}
                                bossName={bossName}
                                priority={
                                  selections.find((s) => s.item_id === item.id)
                                    ?.priority || null
                                }
                                onToggle={(p) =>
                                  updatePriority(item, bossName, p)
                                }
                                difficulty={difficulty}
                                instanceId={resolvedInstanceId}
                              />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  // VIEW BY BOSS
                  <Accordion type="multiple" className="space-y-4">
                    {filteredBosses.map((boss) => (
                      <AccordionItem
                        key={boss.id}
                        value={boss.id.toString()}
                        className="border border-border/40 rounded-2xl px-5 bg-card/30 shadow-sm overflow-hidden"
                      >
                        <AccordionTrigger className="hover:no-underline py-5 group">
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500/80 group-hover:text-amber-400 transition-colors">
                              {boss.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] border-amber-500/10 text-amber-500/40 font-black"
                            >
                              {boss.items.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-5">
                          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {boss.items.map((item) => {
                              const sel = selections.find(
                                (s) => s.item_id === item.id,
                              );
                              return (
                                <LootItemCard
                                  key={item.id}
                                  item={item}
                                  bossName={boss.name}
                                  difficulty={difficulty}
                                  priority={sel ? sel.priority : null}
                                  instanceId={resolvedInstanceId}
                                  onToggle={(p) =>
                                    updatePriority(item, boss.name, p)
                                  }
                                />
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>

              {/* Sidebar Wishlist */}
              <div className="hidden lg:block">
                <WishlistCard
                  selectedMember={selectedMember}
                  difficulty={difficulty}
                  selections={selections}
                  loadingSelections={loadingSelections}
                  translateSlot={translateSlot}
                  setSelections={setSelections}
                  bosses={bosses}
                  instanceId={resolvedInstanceId}
                  activeSpecName={activeSpecName}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
