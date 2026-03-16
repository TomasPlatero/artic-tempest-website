"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  IconTimeline,
  IconSettings,
  IconClock,
  IconArrowLeft,
  IconClipboardText,
  IconCopy,
  IconCheck,
  IconTrash,
  IconZoomIn,
  IconZoomOut,
  IconZoomReset,
  IconLayoutList,
  IconFilter,
  IconEye,
  IconEyeOff,
  IconGripVertical,
  IconDeviceDesktop,
  IconCalendar,
  IconShield,
  IconPlus,
  IconSword,
  IconBow,
  IconHelpCircle,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { cn } from "@/shared/tailwind/tailwind-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { MIDNIGHT_RAIDS } from "@/shared/constants/raids";
import {
  BOSS_TIMELINES,
  BOSS_ABILITY_META,
} from "@/shared/constants/cd-planner";

const normalizeBossName = (value: string | null | undefined) => {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .trim()
    .toUpperCase();
};

export type CooldownDefinition = {
  id: string;
  name: string;
  icon: string;
  duration: number;
  class_id: number;
  ability_type: "RAID" | "EXTERNAL" | "PERSONAL" | "UTILITY";
  allowed_specs: number[] | null;
  color: string;
  spell_id?: number;
  category?: string;
  active_duration?: number;
};

// ---------------------------------------------------------------------------------------------------------------------------------------------------------
// ZOOM OVERLAY COMPONENT
// ---------------------------------------------------------------------------------------------------------------------------------------------------------
function TimelineZoomOverlay({
  cooldownId,
  cooldownDefinitions,
  dragTime,
  mouseX,
  mouseY,
  selectedBoss,
  assignments,
  healers,
  bossAbilitiesMeta,
}: {
  cooldownId: string;
  cooldownDefinitions: CooldownDefinition[];
  dragTime: number;
  mouseX: number;
  mouseY: number;
  selectedBoss: string;
  assignments: any[];
  healers: any[];
  bossAbilitiesMeta: Record<string, any>;
}) {
  const WINDOW_SECONDS = 30; // 15s before, 15s after
  const HALF_WINDOW = WINDOW_SECONDS / 2;
  const startWindow = Math.max(0, dragTime - HALF_WINDOW);
  const endWindow = startWindow + WINDOW_SECONDS;

  const cdDef = cooldownDefinitions.find((c) => c.id === cooldownId);
  const bossAbilities = (BOSS_TIMELINES[selectedBoss] || []).filter(
    (b) => b.time >= startWindow && b.time <= endWindow,
  );

  // Filter assignments in window (excluding the one being dragged)
  const activeAssignments = assignments.filter((a) => {
    return (
      a.time_seconds >= startWindow &&
      a.time_seconds <= endWindow &&
      a.cooldown_id !== cooldownId
    );
  });

  const getLeftPos = (time: number) => {
    const relativeTime = time - startWindow;
    return `${(relativeTime / WINDOW_SECONDS) * 100}%`;
  };

  return (
    <div className="fixed z-[100] pointer-events-none bg-[#0a0a0f] border border-border/40 shadow-2xl rounded-xl w-[600px] overflow-hidden backdrop-blur-md bottom-6 right-6">
      <div className="bg-white/[0.02] border-b border-border/10 p-3 pt-2 pb-2 flex justify-between items-center">
        <span className="text-xs text-muted-foreground font-medium">
          Previo: —
        </span>
        <div className="flex flex-col items-center">
          <span className="text-sm font-black text-white">
            {Math.floor(dragTime / 60)}:
            {(dragTime % 60).toString().padStart(2, "0")}
          </span>
          <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">
            {Math.floor(dragTime / 60)}:
            {(dragTime % 60).toString().padStart(2, "0")}
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Siguiente: —
        </span>
      </div>

      <div
        className="relative p-4 pl-12 pt-6 pb-6 flex flex-col gap-6"
        style={{
          backgroundImage:
            "linear-gradient(to right, transparent 49%, rgba(255,255,255,0.1) 49%, rgba(255,255,255,0.1) 51%, transparent 51%)",
        }}
      >
        {/* Time markers */}
        <div className="absolute top-1 left-12 right-4 flex justify-between text-[10px] font-bold text-muted-foreground/60">
          <span>
            {Math.floor(startWindow / 60)}:
            {(startWindow % 60).toString().padStart(2, "0")}
          </span>
          <span>
            {Math.floor(endWindow / 60)}:
            {(endWindow % 60).toString().padStart(2, "0")}
          </span>
        </div>

        {/* Boss Track */}
        <div className="relative h-8 flex items-center bg-white/[0.02] rounded-md border border-white/[0.05]">
          <div className="absolute -left-10 w-8 flex items-center justify-center h-full">
            <span className="text-[10px] font-bold text-muted-foreground uppercase transform -rotate-90">
              Jefe
            </span>
          </div>
          {bossAbilities.map((b, i) => {
            const meta = bossAbilitiesMeta[b.name] || BOSS_ABILITY_META[b.name];
            return (
              <div
                key={`boss-${i}`}
                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: getLeftPos(b.time) }}
              >
                <span className="text-[10px] font-bold text-white mb-0.5 whitespace-nowrap drop-shadow-md">
                  {Math.floor(b.time / 60)}:
                  {(b.time % 60).toString().padStart(2, "0")}
                </span>
                <div
                  className="p-0.5 rounded-sm border"
                  style={{ borderColor: meta?.color || "#fff" }}
                >
                  <Image
                    unoptimized
                    src={
                      meta?.icon ||
                      "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg"
                    }
                    alt={b.name}
                    width={20}
                    height={20}
                    className="rounded-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Player Track (Centered dragged item) */}
        <div className="relative h-12 flex items-center">
          <div className="absolute -left-10 w-8 flex items-center justify-center h-full">
            <span className="text-[10px] font-bold text-muted-foreground uppercase transform -rotate-90">
              Jugador
            </span>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <div
              className="p-1 rounded bg-black/50 shadow-[0_0_30px_rgba(255,255,0,0.4)] animate-pulse"
              style={{
                border: `2px solid ${cdDef?.color || "#fff"}`,
                boxShadow: `0 0 20px ${cdDef?.color || "#fff"}80`,
              }}
            >
              <Image
                unoptimized
                src={cdDef?.icon || ""}
                alt={cdDef?.name || ""}
                width={32}
                height={32}
                className="rounded-sm"
              />
            </div>
          </div>
        </div>

        {/* Friendly Track */}
        <div className="relative h-8 flex items-center bg-white/[0.02] rounded-md border border-white/[0.05]">
          <div className="absolute -left-10 w-8 flex items-center justify-center h-full">
            <span className="text-[10px] font-bold text-muted-foreground uppercase transform -rotate-90">
              Compañeros
            </span>
          </div>
          {activeAssignments.map((a) => {
            const aDef = cooldownDefinitions.find(
              (c) => c.id === a.cooldown_id,
            );
            if (!aDef) return null;
            return (
              <div
                key={`friend-${a.id}`}
                className="absolute top-1/2 -translate-y-1/2"
                style={{ left: getLeftPos(a.time_seconds) }}
              >
                <div
                  className="p-0.5 rounded-sm border opacity-60"
                  style={{ borderColor: aDef.color }}
                >
                  <Image
                    unoptimized
                    src={aDef.icon}
                    alt={aDef.name}
                    width={20}
                    height={20}
                    className="rounded-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PlanificadorCdsClient() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("event_id");
  const bossParam = searchParams.get("boss");
  const initialTabParam = searchParams.get("tab"); // selection, planner, mrt

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("selection");
  const [selectedRaid, setSelectedRaid] = useState(MIDNIGHT_RAIDS[0]);
  const [selectedBoss, setSelectedBoss] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Recent Events State
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [bossSummaries, setBossSummaries] = useState<any[]>([]);
  const [bossAbilitiesMeta, setBossAbilitiesMeta] = useState<Record<string, any>>({});

  // Viserio Timeline State
  const [assignments, setAssignments] = useState<
    {
      id: string;
      member_id: string;
      cooldown_id: string;
      time_seconds: number;
    }[]
  >([]);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const TOTAL_FIGHT_SECONDS = 570; // 9.5 minutes (includes 30s buffer for rendering visual tails)

  // Interactive Timeline State
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const hoverTimeRef = useRef<number | null>(null);
  const hoverLineRef = useRef<HTMLDivElement>(null);
  const hoverBadgeRef = useRef<HTMLDivElement>(null);
  const hoverBadgeContainerRef = useRef<HTMLDivElement>(null);

  const [draggingAssignment, setDraggingAssignment] = useState<{
    id: string;
    memberId: string;
    cooldownId: string;
    startTime: number;
    timeOffset: number;
  } | null>(null);
  const [wasDragging, setWasDragging] = useState(false);
  const [timelineRef, setTimelineRef] = useState<HTMLDivElement | null>(null);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [condensedView, setCondensedView] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set([
      "RAID",
      "EXTERNAL",
      "PERSONAL",
      "UTILITY",
      "ROLE_HEAL",
      "ROLE_TANK",
      "ROLE_DPS",
    ]),
  );
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [editInputValue, setEditInputValue] = useState("");
  const [collapsedPlayers, setCollapsedPlayers] = useState<Set<string>>(
    new Set(),
  );

  const [floatingTooltip, setFloatingTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    time: number;
  }>({ visible: false, x: 0, y: 0, time: 0 });
  const SIDEBAR_WIDTH = 150;

  const FILTER_CATEGORIES = [
    {
      key: "RAID",
      label: "Raid CDs",
      color: "#22c55e",
      description: "Cooldowns de raid (Tranq, SLT, Revival...)",
    },
    {
      key: "EXTERNAL",
      label: "Externals",
      color: "#3b82f6",
      description: "Externals (BoS, Pain Sup, Ironbark...)",
    },
    {
      key: "PERSONAL",
      label: "Defensivos",
      color: "#eab308",
      description: "CDs personales y defensivos",
    },
    {
      key: "UTILITY",
      label: "Utilidad",
      color: "#a855f7",
      description: "Utilidades (Gateway, Rally, AMZ...)",
    },
  ] as const;

  const ROLE_FILTERS = [
    {
      key: "ROLE_HEAL",
      label: "Sanadores",
      color: "#34d399",
      description: "Filtrar healers",
    },
    {
      key: "ROLE_TANK",
      label: "Tanques",
      color: "#38bdf8",
      description: "Filtrar tanques",
    },
    {
      key: "ROLE_DPS",
      label: "DPS",
      color: "#fb7185",
      description: "Filtrar DPS (Melee y Rango)",
    },
  ] as const;

  const toggleFilter = (key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getRoleSpecs = (classId: number, role: string): number[] | null => {
    // Mapping of class_id to spec_ids by role
    const roleSpecMap: Record<number, Record<string, number[]>> = {
      1: { tank: [73], dps: [71, 72], melee: [71, 72] }, // Warrior
      2: { tank: [66], heal: [65], dps: [70], melee: [70] }, // Paladin
      3: { dps: [253, 254, 255], ranged: [253, 254], melee: [255] }, // Hunter
      4: { dps: [259, 260, 261], melee: [259, 260, 261] }, // Rogue
      5: { heal: [256, 257], dps: [258], ranged: [258] }, // Priest
      6: { tank: [250], dps: [251, 252], melee: [251, 252] }, // Death Knight
      7: { heal: [264], dps: [262, 263], melee: [263], ranged: [262] }, // Shaman
      8: { dps: [62, 63, 64], ranged: [62, 63, 64] }, // Mage
      9: { dps: [265, 266, 267], ranged: [265, 266, 267] }, // Warlock
      10: { tank: [268], heal: [270], dps: [269], melee: [269] }, // Monk
      11: {
        tank: [104],
        heal: [105],
        dps: [102, 103],
        melee: [103],
        ranged: [102],
      }, // Druid
      12: { tank: [581], dps: [577], melee: [577] }, // Demon Hunter
      13: { heal: [1468], dps: [1467, 1473], ranged: [1467, 1473] }, // Evoker
    };

    // return mapped specs, or null if all specs are allowed
    return roleSpecMap[classId]?.[role] || null;
  };

  // Roster State (Members with CDs)
  const [healers, setHealers] = useState<any[]>([]);
  const [eventSignups, setEventSignups] = useState<any[]>([]);
  const [cooldownDefinitions, setCooldownDefinitions] = useState<
    CooldownDefinition[]
  >([]);

  const BOSS_NAME_ALIASES: Record<string, string[]> = useMemo(() => ({
    "Imperator Averzian": ["IMPERATOR AVERZIAN"],
    Vorasius: ["VORASIUS"],
    "Fallen-King Salhadaar": ["REY CAIDO SALHADAAR", "REY CAÍDO SALHADAAR"],
    "Vaelgor & Ezzorak": ["VAELGOR Y EZZORAK"],
    "Lightblinded Vanguard": ["VANGUARDIA CEGADA POR LA LUZ"],
    "Crown of the Cosmos": ["CORONA DEL COSMOS"],
    "Chimaerus the Undreamt God": [
      "CHIMAERUS, EL DIOS NO SONADO",
      "CHIMAERUS, EL DIOS NO SOÑADO",
    ],
    "Belo'ren, Child of Al'ar": [
      "BELO'REN, VASTAGO DE AL'AR",
      "BELO'REN, VÁSTAGO DE AL'AR",
    ],
    "L'ura": [
      "CAIDA DE MEDIANOCHE (L'URA)",
      "CAÍDA DE MEDIANOCHE (L'URA)",
      "L'URA",
    ],
  }), []);


  const bossMatchesSelection = useCallback(
    (plannerBoss: string, eventBoss: string | null | undefined) => {
      const plannerNormalized = normalizeBossName(plannerBoss);
      const eventNormalized = normalizeBossName(eventBoss);
      if (!eventNormalized) return false;
      if (plannerNormalized === eventNormalized) return true;
      const aliases = BOSS_NAME_ALIASES[plannerBoss] || [];
      return aliases.some(
        (alias) => normalizeBossName(alias) === eventNormalized,
      );
    },
    [BOSS_NAME_ALIASES],
  );

  const getBossTimeline = useCallback(
    (bossName: string) => {
      const normalizedBoss = normalizeBossName(bossName);
      const directKey = Object.keys(BOSS_TIMELINES).find(
        (key) => normalizeBossName(key) === normalizedBoss,
      );

      if (directKey) {
        return BOSS_TIMELINES[directKey] || [];
      }

      const aliases = BOSS_NAME_ALIASES[bossName] || [];
      const aliasKey = aliases
        .map((alias) =>
          Object.keys(BOSS_TIMELINES).find(
            (key) => normalizeBossName(key) === normalizeBossName(alias),
          ),
        )
        .find(Boolean);

      return aliasKey ? BOSS_TIMELINES[aliasKey] || [] : [];
    },
    [BOSS_NAME_ALIASES],
  );

  const isPast = useMemo(() => {
    if (!currentEvent?.end_date) return false;
    return new Date(currentEvent.end_date) < new Date();
  }, [currentEvent?.end_date]);

  const fetchEventData = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/guild/events/${id}`);
        if (!res.ok) throw new Error("Failed to fetch event data");
        const event = await res.json();
        setCurrentEvent(event);

        // Find the raid that matches the event destination
        // The destination might be the raid name or ID
        const matchingRaid = MIDNIGHT_RAIDS.find(
          (r) => r.name === event.destination || r.id === event.destination,
        );
        if (matchingRaid) {
          setSelectedRaid(matchingRaid);

          // If boss is specified in URL, use it. Otherwise, auto-select the first boss of the raid.
          if (bossParam) {
            setSelectedBoss(bossParam);
            setActiveTab(initialTabParam || "planner");
          } else {
            const firstBoss = matchingRaid.bosses[0];
            if (firstBoss) {
              setSelectedBoss(firstBoss);
              setActiveTab(initialTabParam || "planner");
            }
          }
        }
      } catch (error) {
        console.error("fetchEventData error:", error);
      }
    },
    [bossParam, initialTabParam],
  );

  const fetchCooldownDefinitions = useCallback(async () => {
    try {
      const res = await fetch("/api/cd-planner/cooldowns");
      if (!res.ok) throw new Error("Failed to fetch cooldown definitions");
      const data = await res.json();
      setCooldownDefinitions(data);
    } catch (error) {
      console.error("fetchCooldownDefinitions error:", error);
    }
  }, []);

  const fetchRecentEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/guild/events/list");
      if (!res.ok) throw new Error("Failed to fetch recent events");
      const data = await res.json();
      setRecentEvents(data.slice(0, 5)); // Take only the last 5
    } catch (error) {
      console.error("fetchRecentEvents error:", error);
    }
  }, []);

  const fetchBossSummaries = useCallback(async () => {
    try {
      const res = await fetch("/api/cd-planner/boss-summaries");
      if (!res.ok) throw new Error("Failed to fetch boss summaries");
      const data = await res.json();
      setBossSummaries(data);
    } catch (error) {
      console.error("fetchBossSummaries error:", error);
    }
  }, []);

  const handleUpdateAssignmentTime = async () => {
    if (!editingAssignment || !currentEvent || !selectedBoss) return;

    let totalSeconds = 0;
    const value = editInputValue.trim();
    if (value.includes(":")) {
      const [m, s] = value.split(":").map(Number);
      totalSeconds = (m || 0) * 60 + (s || 0);
    } else {
      totalSeconds = Number(value);
    }

    if (isNaN(totalSeconds)) {
      setEditingAssignment(null);
      return;
    }

    // Optimistic update
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === editingAssignment.id
          ? { ...a, time_seconds: totalSeconds }
          : a,
      ),
    );
    setEditingAssignment(null);

    try {
      await fetch("/api/cd-planner/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAssignment.id,
          event_id: currentEvent.id,
          boss_name: selectedBoss,
          member_id: editingAssignment.member_id,
          cooldown_id: editingAssignment.cooldown_id,
          time_seconds: totalSeconds,
        }),
      });
    } catch (error) {
      console.error("Failed to update assignment time:", error);
    }
  };

  const fetchEventRoster = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/guild/events/${id}/selected-roster`);
      if (!res.ok) throw new Error("Failed to fetch roster");
      const data = await res.json();
      setEventSignups(data);

      // Map event signups to members with CDs (we do this dynamically now in useEffect, but we can set default here)
      const mapped = data
        .map((s: any) => {
          const info = s.guild_members;
          if (!info) return null;
          return {
            id: s.member_id,
            character_name: info.character_name || "Unknown",
            class_id: info.class_id || 0,
            spec_id: info.spec_id || 0,
            avatar: null,
            selected_bosses: s.selected_bosses || [],
            role: s.event_role || "ranged",
          };
        })
        .filter((h: any) => h !== null);

      // Sort: heals first, then tanks, then DPS
      const ROLE_ORDER: Record<string, number> = {
        heal: 0,
        tank: 1,
        melee: 2,
        ranged: 3,
      };
      mapped.sort(
        (a: any, b: any) =>
          (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3),
      );

      setHealers(mapped);
      console.log(`Event ${id} members with CDs fetched:`, mapped.length);
    } catch (error) {
      console.error("fetchEventRoster error:", error);
    }
  }, []);

  const fetchAssignments = useCallback(
    async (eventId: string, bossName: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/cd-planner/assignments?event_id=${eventId}&boss_name=${encodeURIComponent(bossName)}`,
        );
        if (!res.ok) throw new Error("Failed to fetch assignments");
        const data = await res.json();
        setAssignments(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchBossAbilities = useCallback(async (bossName: string) => {
    try {
      const res = await fetch(`/api/cd-planner/boss-abilities?boss_name=${encodeURIComponent(bossName)}`);
      if (!res.ok) throw new Error("Failed to fetch boss abilities");
      const data = await res.json();

      const meta: Record<string, any> = {};
      data.forEach((ability: any) => {
        // Map by name_en to match BOSS_TIMELINES
        meta[ability.name_en] = {
          icon: ability.icon_url || `https://wow.zamimg.com/images/wow/icons/large/${ability.name_en.toLowerCase().replace(/ /g, '_')}.jpg`,
          color: BOSS_ABILITY_META[ability.name_en]?.color || "#a855f7", // Keep original theme colors if available
          nameEs: ability.name_es,
          bnet_spell_id: ability.bnet_spell_id
        };
      });
      setBossAbilitiesMeta(meta);
    } catch (error) {
      console.error("fetchBossAbilities error:", error);
    }
  }, []);

  // Initialize
  useEffect(() => {
    setMounted(true);
    fetchCooldownDefinitions();
    if (eventIdParam) {
      fetchEventData(eventIdParam);
      fetchEventRoster(eventIdParam);
    } else {
      fetchRecentEvents();
      fetchBossSummaries();
      // Default mock roster if no event specified
      setHealers([
        { id: "mock-1", character_name: "Averzian", class_id: 2 },
        { id: "mock-2", character_name: "Vorasius", class_id: 13 },
        { id: "mock-3", character_name: "Salhadaar", class_id: 7 },
        { id: "mock-4", character_name: "Vaelgor", class_id: 5 },
        { id: "mock-5", character_name: "Vanguardia", class_id: 10 },
        { id: "mock-6", character_name: "Belo'ren", class_id: 7 },
        { id: "mock-7", character_name: "Crown", class_id: 11 },
        { id: "mock-8", character_name: "Chimaerus", class_id: 2 },
      ]);
    }

    if (bossParam) {
      setSelectedBoss(bossParam);
      setActiveTab(initialTabParam || "planner");
    }
  }, [
    eventIdParam,
    bossParam,
    initialTabParam,
    fetchCooldownDefinitions,
    fetchEventData,
    fetchEventRoster,
    fetchRecentEvents,
    fetchBossSummaries,
  ]);

  // Load assignments when boss changes
  useEffect(() => {
    if (selectedBoss) {
      fetchBossAbilities(selectedBoss);
      if (eventIdParam) {
        fetchAssignments(eventIdParam, selectedBoss);
      }
    }
  }, [eventIdParam, selectedBoss, fetchAssignments, fetchBossAbilities]);

  // Update healers when boss or event changes
  useEffect(() => {
    if (!currentEvent || eventSignups.length === 0) return;

    const isGeneralRoster =
      !currentEvent.selected_bosses ||
      currentEvent.selected_bosses.length === 0;

    const mapped = eventSignups
      .map((s: any) => {
        const info = s.guild_members;
        if (!info) return null;
        return {
          id: s.member_id,
          character_name: info.character_name || "Unknown",
          class_id: info.class_id || 0,
          spec_id: info.spec_id || 0,
          avatar: null,
          selected_bosses: s.selected_bosses || [],
          role: s.event_role || "ranged",
        };
      })
      .filter((h: any) => h !== null);

    const filtered = mapped.filter((h: any) => {
      if (isGeneralRoster) return true;
      return (h.selected_bosses || []).some((boss: string) =>
        bossMatchesSelection(selectedBoss, boss),
      );
    });

    // Sort: heals first, then tanks, then DPS
    const ROLE_ORDER: Record<string, number> = {
      heal: 0,
      tank: 1,
      melee: 2,
      ranged: 3,
    };
    filtered.sort(
      (a: any, b: any) => (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3),
    );

    setHealers(filtered);
  }, [selectedBoss, currentEvent, eventSignups, bossMatchesSelection]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleAssignCooldown = async (
    memberId: string,
    cooldownId: string,
    timeSeconds: number,
    existingId?: string,
  ) => {
    // Optimistic update
    const tempId =
      existingId || `temp-${Math.random().toString(36).substr(2, 9)}`;
    const newAssign = {
      id: tempId,
      member_id: memberId,
      cooldown_id: cooldownId,
      time_seconds: timeSeconds,
    };

    if (existingId) {
      setAssignments((prev) =>
        prev.map((a) => (a.id === existingId ? newAssign : a)),
      );
    } else {
      setAssignments((prev) => [...prev, newAssign]);
    }

    if (eventIdParam && selectedBoss) {
      try {
        const res = await fetch("/api/cd-planner/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id:
              existingId && !existingId.startsWith("temp")
                ? existingId
                : undefined,
            event_id: eventIdParam,
            boss_name: selectedBoss,
            member_id: memberId,
            cooldown_id: cooldownId,
            time_seconds: timeSeconds,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Save error");
        }
        const saved = await res.json();
        setAssignments((prev) =>
          prev.map((a) => (a.id === tempId ? saved : a)),
        );
      } catch (error: any) {
        console.error("handleAssignCooldown failure:", error.message);
        if (existingId) {
          // Revert if update fails (might need to fetch original state if we want perfection)
          fetchAssignments(eventIdParam, selectedBoss);
        } else {
          setAssignments((prev) => prev.filter((a) => a.id !== tempId));
        }
      }
    }
  };

  // Native mousemove for buttery smooth hover indicator
  useEffect(() => {
    if (!timelineRef) return;
    const el = timelineRef;

    const onMove = (e: MouseEvent) => {
      if (draggingAssignment) {
        if (hoverLineRef.current) hoverLineRef.current.style.display = "none";
        if (hoverBadgeContainerRef.current)
          hoverBadgeContainerRef.current.style.display = "none";
        return;
      }
      const trackContainer = document.getElementById(
        "timeline-track-container",
      );
      if (!trackContainer) return;

      const rect = trackContainer.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      if (mouseX < 0) {
        if (hoverLineRef.current) hoverLineRef.current.style.display = "none";
        if (hoverBadgeContainerRef.current)
          hoverBadgeContainerRef.current.style.display = "none";
        return;
      }
      const percentage = Math.max(0, Math.min(1, mouseX / rect.width));
      if (hoverLineRef.current) {
        hoverLineRef.current.style.display = "";
        hoverLineRef.current.style.transform = `translateX(${mouseX}px)`;
      }
      if (hoverBadgeContainerRef.current) {
        hoverBadgeContainerRef.current.style.display = "";
        hoverBadgeContainerRef.current.style.transform = `translateX(${mouseX}px)`;
      }
      const t = Math.round(percentage * TOTAL_FIGHT_SECONDS);
      hoverTimeRef.current = t;
      setHoverTime(t);
    };

    const onLeave = () => {
      if (hoverLineRef.current) hoverLineRef.current.style.display = "none";
      if (hoverBadgeContainerRef.current)
        hoverBadgeContainerRef.current.style.display = "none";
      hoverTimeRef.current = null;
      setHoverTime(null);
      setFloatingTooltip((prev) => ({ ...prev, visible: false }));
    };

    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener("mouseleave", onLeave, { passive: true });
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [timelineRef, TOTAL_FIGHT_SECONDS, draggingAssignment]);

  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef) return;
    if (draggingAssignment) {
      const trackContainer = document.getElementById(
        "timeline-track-container",
      );
      if (!trackContainer) return;

      const rect = trackContainer.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const percentage = mouseX / rect.width;
      const mouseTime = percentage * TOTAL_FIGHT_SECONDS;

      // Subtract the offset to perfectly lock the block under cursor
      const newTime = Math.max(
        0,
        Math.min(
          TOTAL_FIGHT_SECONDS,
          Math.round(mouseTime - draggingAssignment.timeOffset),
        ),
      );

      // Update floating tooltip to show the NEW start time of the ability being dragged
      setFloatingTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        time: newTime,
      });

      if (!wasDragging) setWasDragging(true);
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === draggingAssignment.id ? { ...a, time_seconds: newTime } : a,
        ),
      );
      setHoverTime(newTime);
    }
  };

  const handleTimelineMouseLeave = () => {
    if (!draggingAssignment) return;
  };

  const handleAssignmentMouseDown = (e: React.MouseEvent, assign: any) => {
    e.stopPropagation();
    if (e.button !== 0) return; // Only left click

    if (e.ctrlKey) {
      setEditingAssignment(assign);
      setEditInputValue(formatTime(assign.time_seconds));
      return;
    }

    // Prevent dragging an assignment that is still saving to the database
    if (assign.id.startsWith("temp")) return;

    let timeOffset = 0;
    const trackContainer = document.getElementById("timeline-track-container");
    if (trackContainer) {
      const rect = trackContainer.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const percentage = mouseX / rect.width;
      const mouseTime = percentage * TOTAL_FIGHT_SECONDS;
      timeOffset = mouseTime - assign.time_seconds;
    }

    setDraggingAssignment({
      id: assign.id,
      memberId: assign.member_id,
      cooldownId: assign.cooldown_id,
      startTime: assign.time_seconds,
      timeOffset: timeOffset,
    });
  };

  const handleTimelineMouseUp = (e: React.MouseEvent) => {
    if (draggingAssignment && hoverTime !== null) {
      handleAssignCooldown(
        draggingAssignment.memberId,
        draggingAssignment.cooldownId,
        hoverTime,
        draggingAssignment.id,
      );
      // Use setTimeout to ensure the click event has time to fire and be ignored
      setTimeout(() => setWasDragging(false), 200);
    } else {
      setWasDragging(false);
    }
    setDraggingAssignment(null);
    setFloatingTooltip((prev) => ({ ...prev, visible: false }));
  };

  const handleDeleteAssignment = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const previous = [...assignments];
    setAssignments((prev) => prev.filter((a) => a.id !== id));

    if (eventIdParam && !id.startsWith("temp") && id.length > 20) {
      try {
        const res = await fetch(`/api/cd-planner/assignments?id=${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Delete error");
      } catch (error) {
        console.error(error);
        setAssignments(previous);
      }
    }
  };

  // Note Generation (MRT Format)
  const generateMRTNote = () => {
    if (assignments.length === 0) return "No hay CD's asignados aún.";

    const sorted = [...assignments].sort(
      (a, b) => a.time_seconds - b.time_seconds,
    );

    const linesByTime = new Map<number, string[]>();

    sorted.forEach((a: any) => {
      const healer = healers.find((h: any) => h.id === a.member_id);
      const cd = cooldownDefinitions.find((c: any) => c.id === a.cooldown_id);
      if (!healer || !cd) return;

      const token = cd.spell_id
        ? `${healer.character_name} {spell:${cd.spell_id}}`
        : `${healer.character_name} ${cd.name}`;

      const current = linesByTime.get(a.time_seconds) || [];
      current.push(token);
      linesByTime.set(a.time_seconds, current);
    });

    const header = [
      `|cffffd100CD Plan: ${selectedBoss}|r`,
      currentEvent?.difficulty
        ? `|cff66aaff${currentEvent.difficulty}|r`
        : null,
      "",
    ].filter(Boolean);

    const body = Array.from(linesByTime.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([timeSeconds, entries]) => {
        const time = formatTime(timeSeconds);
        return `{time:${time}} ${entries.join("  ")}`;
      });

    return [...header, ...body].join("\n");
  };

  const handleCopyNote = () => {
    navigator.clipboard.writeText(generateMRTNote());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const togglePlayerCollapsed = useCallback((memberId: string) => {
    setCollapsedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }, []);

  const goToMrtTab = useCallback(
    (bossName: string) => {
      setSelectedBoss(bossName);
      setActiveTab("mrt");

      const params = new URLSearchParams();
      if (eventIdParam) {
        params.set("event_id", eventIdParam);
      }
      params.set("boss", bossName);
      params.set("tab", "mrt");

      window.history.replaceState(
        null,
        "",
        `/dashboard/planificador-cds?${params.toString()}`,
      );
    },
    [eventIdParam],
  );

  const renderBossCard = (boss: string, idx: number, parentRaid: any) => {
    const isGeneralRoster =
      !currentEvent?.selected_bosses ||
      currentEvent.selected_bosses.length === 0;
    const isBossEnabled =
      isGeneralRoster ||
      (currentEvent?.selected_bosses || []).some((selected: string) =>
        bossMatchesSelection(boss, selected),
      );

    return (
      <div key={boss} className="flex flex-col mb-6 group/boss-container">
        <div
          className={cn(
            "group/boss relative rounded-[2rem] border overflow-hidden transition-all duration-700 shadow-2xl",
            eventIdParam ? "h-64" : "h-24 px-8 mt-2 rounded-b-none border-b-0",
            isBossEnabled
              ? "bg-[#0b0c14]/60 border-white/5 hover:border-blue-500/30 shadow-blue-500/5 hover:-translate-y-1"
              : "bg-[#0b0c14]/40 border-white/5 grayscale opacity-60",
          )}
        >
          {/* Background Image with more visibility and glass effect */}
          <div
            className={cn(
              "absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-110 group-hover/boss:scale-100",
              isBossEnabled
                ? "opacity-30 group-hover/boss:opacity-60"
                : "opacity-10",
            )}
            style={{ backgroundImage: `url(${parentRaid.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent pointer-events-none" />

          {/* Disabled overlay */}
          {!isBossEnabled && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <span className="text-red-500/80 font-black uppercase text-[10px] tracking-[0.3em] border border-red-500/20 px-5 py-2 rounded-2xl bg-[#09090b]/80 backdrop-blur-3xl shadow-2xl">
                  Roster Pendiente
                </span>
              </div>
            </div>
          )}

          <div
            className={cn(
              "relative z-10 px-5 sm:px-8 flex flex-col h-full",
              eventIdParam ? "pt-6 sm:pt-8 pb-6 sm:pb-10" : "flex-row items-center justify-between py-0",
            )}
          >
            <div className="flex flex-col flex-1 min-w-0 py-4 sm:py-0">
              <h3
                className={cn(
                  "text-lg font-black uppercase tracking-tight leading-tight transition-colors duration-500 truncate w-full",
                  isBossEnabled
                    ? "text-white group-hover/boss:text-blue-400"
                    : "text-white/40",
                )}
                title={boss}
              >
                {boss}
              </h3>
            </div>

            {eventIdParam && (
              <div className="mt-auto flex flex-col lg:flex-row gap-2.5 lg:gap-4 pt-4">
                <Button
                  variant="secondary"
                  disabled={!isBossEnabled}
                  className="w-full lg:flex-1 h-12 lg:h-14 text-[10px] font-black px-6 bg-blue-600/10 text-blue-400 border border-blue-500/10 hover:bg-blue-700 hover:text-white transition-all duration-500 uppercase tracking-[0.2em] shadow-2xl backdrop-blur-3xl rounded-xl lg:rounded-2xl group/btn active:scale-95"
                  onClick={() => {
                    setSelectedBoss(boss);
                    setActiveTab("planner");
                  }}
                >
                  <IconTimeline className="size-4 mr-2.5 opacity-60 group-hover/btn:rotate-12 transition-transform" />
                  Asignar
                </Button>
                <Button
                  variant="secondary"
                  disabled={!isBossEnabled}
                  className="w-full lg:flex-1 h-12 lg:h-14 text-[10px] font-black px-6 bg-amber-600/10 text-amber-500 border border-amber-500/10 hover:bg-amber-600 hover:text-white transition-all duration-500 uppercase tracking-[0.2em] shadow-2xl backdrop-blur-3xl rounded-xl lg:rounded-2xl group/btn2 active:scale-95"
                  onClick={() => goToMrtTab(boss)}
                >
                  <IconClipboardText className="size-4 mr-2.5 opacity-60 group-hover/btn2:scale-110 transition-transform" />
                  Nota MRT
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Boss Planning Details Card (Unified Style) */}
        {!eventIdParam && (
          <div className="bg-[#0b0c14]/40 border border-t-white/[0.03] border-white/5 rounded-b-[2rem] p-5 flex flex-col gap-3 shadow-2xl group-hover/boss-container:border-blue-500/20 transition-all duration-700">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                Planificaciones
              </span>
              <span className="text-[9px] font-bold text-blue-400/60 uppercase tracking-tighter">
                Historial
              </span>
            </div>

            {bossSummaries.filter((s) => s.boss_name === boss).length > 0 ? (
              <div className="flex flex-col gap-2">
                {bossSummaries
                  .filter((s) => s.boss_name === boss)
                  .slice(0, 3)
                  .map((ev) => (
                    <div
                      key={ev.id}
                      className="group/plan flex items-center justify-between bg-black/40 border border-white/5 p-2 rounded-lg hover:border-blue-500/30 cursor-pointer transition-all"
                      onClick={() => {
                        window.location.href = `/dashboard/planificador-cds?event_id=${ev.id}&boss=${encodeURIComponent(boss)}`;
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-white/80 group-hover/plan:text-white">
                          {boss}
                        </span>
                        <span className="text-[9px] text-muted-foreground/50 font-bold uppercase overflow-hidden text-ellipsis whitespace-nowrap max-w-[140px]">
                          {new Date(ev.event_date).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                          })}{" "}
                          • {ev.difficulty}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div
                            className="size-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[8px] font-black text-blue-400"
                            title={`${ev.assignment_count} asignaciones`}
                          >
                            {ev.assignment_count}
                          </div>
                        </div>
                        <IconTimeline className="size-3.5 text-muted-foreground/40 group-hover/plan:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 bg-black/20 rounded-lg border border-dashed border-white/5">
                <IconTimeline className="size-5 text-muted-foreground/30 mb-2" />
                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                  Sin registros
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col w-full min-w-0">

      {/* Dragging Zoom Overlay */}
      {draggingAssignment && (
        <TimelineZoomOverlay
          cooldownId={draggingAssignment.cooldownId}
          cooldownDefinitions={cooldownDefinitions}
          dragTime={
            assignments.find((a) => a.id === draggingAssignment.id)
              ?.time_seconds || 0
          }
          mouseX={floatingTooltip.x}
          mouseY={floatingTooltip.y}
          selectedBoss={selectedBoss}
          assignments={assignments}
          healers={healers}
          bossAbilitiesMeta={bossAbilitiesMeta}
        />
      )}

      <div className="flex flex-col flex-1 w-full min-w-0">

        {/* Premium Hero Header Section */}
        <div className="relative mb-8 mt-4 shrink-0">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition duration-1000 hidden lg:block"></div>
          <div className="relative bg-[#0b0c14]/40 border border-white/5 rounded-[2rem] p-8 backdrop-blur-3xl overflow-hidden shadow-2xl">
            {/* Animated Background Element */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse hidden lg:block"></div>

            <div className="flex flex-col items-center text-center relative z-10">
              <div className="size-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-[1px] mb-6 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <div className="w-full h-full rounded-2xl bg-[#0b0c14] flex items-center justify-center backdrop-blur-xl">
                  <IconTimeline className="size-8 text-blue-400" />
                </div>
              </div>

              <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic mb-2">
                PLANIFICADOR DE <span className="text-blue-500">CDS</span>
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-px w-8 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] opacity-80">
                  Gestión de Cooldowns
                </p>
                <div className="h-px w-8 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Ultra-Premium Active Event Banner */}
        {eventIdParam && currentEvent && (
          <div className="mb-10 group/event-hero shrink-0">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f111a]/80 backdrop-blur-3xl shadow-2xl transition-all duration-700 hover:border-blue-500/30">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-30"></div>

              <div className="relative px-6 py-7 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">
                      {currentEvent.destination}
                    </h2>
                  </div>

                  {isPast && (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                        Finalizado
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/[0.03] backdrop-blur-xl">
                    <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] block mb-1.5">
                      Fecha
                    </span>
                    <div className="flex items-center gap-2">
                      <IconCalendar className="size-3.5 text-blue-400" />
                      <span className="text-sm font-black text-white/90 font-mono tracking-tighter">
                        {new Date(currentEvent.event_date).toLocaleDateString(
                          "es-ES",
                          { day: "2-digit", month: "short" },
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-4 border border-white/[0.03] backdrop-blur-xl flex flex-col justify-center">
                    <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] block mb-1.5">
                      Dificultad
                    </span>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter",
                        currentEvent.difficulty?.[0] === "M" ? "bg-red-500/20 text-red-400 border border-red-500/20" :
                          currentEvent.difficulty?.[0] === "H" ? "bg-blue-500/20 text-blue-400 border border-blue-500/20" :
                            "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                      )}>
                        {currentEvent.difficulty || "Normal"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => (window.location.href = "/dashboard/planificador-cds")}
                    className="w-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 rounded-xl h-12 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500"
                  >
                    <IconArrowLeft className="size-4 mr-2" />
                    Cambiar Evento
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Raid Selection Sub-Menu Card - Only show in selection tab */}
        {activeTab === "selection" && (
          <div className="relative mb-10 shrink-0 px-1">
            <div className="bg-[#0b0c14]/40 border border-white/5 rounded-2xl p-1.5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group/tabs-container">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 flex-nowrap touch-pan-x relative z-10 px-1">
                {MIDNIGHT_RAIDS.map((raid) => (
                  <button
                    key={raid.id}
                    onClick={() => {
                      setSelectedRaid(raid);
                      setActiveTab("selection");
                    }}
                    className={cn(
                      "flex-1 min-w-[max-content] px-8 py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap transition-all duration-700 relative rounded-xl shrink-0 group/tab-item bg-white/[0.02] border border-white/5",
                      selectedRaid.id === raid.id
                        ? "text-blue-400 border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.2)]"
                        : "text-muted-foreground/40 hover:text-white hover:bg-white/[0.05]"
                    )}
                  >
                    {/* Capsule Indicator */}
                    {selectedRaid.id === raid.id && (
                      <div className="absolute inset-0 bg-blue-500/20 border border-blue-500/40 rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.25)] transition-all duration-700 animate-in fade-in zoom-in-95"></div>
                    )}
                    <span className={cn(
                      "relative z-10 transition-all duration-500",
                      selectedRaid.id === raid.id ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] scale-105" : ""
                    )}>
                      {raid.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full mt-2 flex-1 flex flex-col min-h-0 min-w-0"
        >
          <TabsList className="hidden">
            <TabsTrigger value="selection">Selection</TabsTrigger>
            <TabsTrigger value="planner">Planner</TabsTrigger>
            <TabsTrigger value="mrt">MRT Note</TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="m-0 flex-1 pb-6 px-0.5">
            {selectedRaid.id === "Todas las Raids" ? (
              <div className="flex flex-col gap-6 sm:gap-10">
                {MIDNIGHT_RAIDS.filter((r) => r.id !== "Todas las Raids").map(
                  (subRaid) => (
                    <div key={subRaid.id} className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-1 bg-primary/40 rounded-full" />
                        <h3 className="text-[11px] sm:text-[12px] font-black uppercase tracking-[0.2em] text-white/60">
                          {subRaid.name}
                        </h3>
                        <div className="h-px flex-1 bg-border/10" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {subRaid.bosses.map((boss, idx) =>
                          renderBossCard(boss, idx, subRaid),
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {selectedRaid.bosses.map((boss, idx) =>
                  renderBossCard(boss, idx, selectedRaid),
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="planner"
            className="flex-1 m-0 flex flex-col min-h-0 lg:min-h-[600px] data-[state=inactive]:hidden w-full max-w-full overflow-hidden"
          >
            {/* Mobile Restriction Warning for Planner tab only */}
            <div className="flex lg:hidden flex-col items-center justify-center p-12 text-center h-full bg-[#0a0a0f] rounded-3xl border border-white/5 my-2 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]">
              <div className="size-24 rounded-3xl bg-blue-500/5 flex items-center justify-center border border-blue-500/10 mb-8 shadow-2xl backdrop-blur-sm">
                <IconDeviceDesktop className="size-12 text-blue-500 opacity-60 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter mb-4 text-white uppercase leading-none">
                Planner: Solo Escritorio
              </h2>
              <p className="text-xs font-medium text-muted-foreground/60 leading-relaxed max-w-xs px-4">
                La interfaz de planificación requiere de una pantalla grande para visualizar la línea de tiempo de forma óptima.
                <br /><br />
                Puedes usar la <span className="text-amber-500">Nota MRT</span> para copiar las asignaciones.
              </p>
              <Button
                className="mt-10 bg-amber-600 hover:bg-amber-500 text-[10px] font-black uppercase tracking-[0.2em] px-10 h-12 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                onClick={() => setActiveTab("mrt")}
              >
                Acceder a Nota MRT
              </Button>
            </div>

            <Card className="hidden lg:flex bg-[#121217] flex-1 border-border/50 shadow-2xl rounded-xl flex-col min-h-0 relative pt-2 pb-0 w-full max-w-full overflow-hidden max-h-[600px]">
              <div className="flex border-b border-border/40 bg-muted/5 items-center justify-between px-4 h-15 shrink-0 relative z-50 ">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground h-9 gap-2"
                    onClick={() => setActiveTab("selection")}
                  >
                    <IconArrowLeft className="size-4" />
                    Volver a Bosses
                  </Button>
                  <div className="h-4 w-px bg-border/40 mx-2" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase text-blue-400 tracking-wider truncate max-w-[250px]">
                      {selectedBoss}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                      Planificador de Banda
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Help Info */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-700/20 hover:text-blue-300 transition-colors h-9"
                    onClick={() => setShowHelpDialog(true)}
                  >
                    <IconHelpCircle className="size-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      Ayuda
                    </span>
                  </Button>
                  {/* Time segments */}
                  <div className="flex items-center gap-0.5 bg-background/50 rounded-lg border border-border/10 p-1">
                    {Array.from(
                      { length: Math.ceil(TOTAL_FIGHT_SECONDS / 60) },
                      (_, i) => {
                        const segStart = i * 60;
                        const segEnd = Math.min(
                          (i + 1) * 60,
                          TOTAL_FIGHT_SECONDS,
                        );
                        return (
                          <button
                            key={i}
                            className={cn(
                              "text-[9px] font-bold px-2 py-1 rounded transition-colors",
                              "text-muted-foreground hover:text-foreground hover:bg-white/5",
                            )}
                            onClick={() => {
                              setTimelineZoom(2);
                              // Scroll to segment after zoom applies
                              requestAnimationFrame(() => {
                                if (timelineRef) {
                                  const contentWidth =
                                    timelineRef.scrollWidth - 110;
                                  const segPosition =
                                    (segStart / TOTAL_FIGHT_SECONDS) *
                                    contentWidth;
                                  timelineRef.scrollLeft =
                                    segPosition +
                                    110 -
                                    timelineRef.clientWidth / 4;
                                }
                              });
                            }}
                            title={`${formatTime(segStart)} - ${formatTime(segEnd)}`}
                          >
                            {formatTime(segStart)}
                          </button>
                        );
                      },
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-background/50 rounded-lg border border-border/10 p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setTimelineZoom((z) => Math.max(0.5, z - 0.25))
                      }
                      disabled={timelineZoom <= 0.5}
                    >
                      <IconZoomOut className="size-3.5" />
                    </Button>
                    <button
                      className="text-[10px] font-black text-muted-foreground w-10 text-center hover:text-foreground transition-colors"
                      onClick={() => setTimelineZoom(1)}
                      title="Resetear zoom"
                    >
                      {Math.round(timelineZoom * 100)}%
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setTimelineZoom((z) => Math.min(4, z + 0.25))
                      }
                      disabled={timelineZoom >= 4}
                    >
                      <IconZoomIn className="size-3.5" />
                    </Button>
                  </div>
                  <button
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-colors",
                      condensedView
                        ? "bg-blue-600/20 border-blue-500/40 text-blue-400"
                        : "bg-background/50 border-border/10 text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setCondensedView((v) => !v)}
                  >
                    <IconLayoutList className="size-3.5" />
                    Condensado
                  </button>
                  {/* Spell Filters */}
                  <div className="relative">
                    <button
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-colors",
                        showFilters || activeFilters.size < 7
                          ? "bg-purple-600/20 border-purple-500/40 text-purple-400"
                          : "bg-background/50 border-border/10 text-muted-foreground hover:text-foreground",
                      )}
                      onClick={() => setShowFilters((v) => !v)}
                    >
                      <IconFilter className="size-3.5" />
                      Filtros
                      {activeFilters.size < 7 && (
                        <span className="bg-purple-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">
                          {activeFilters.size}
                        </span>
                      )}
                    </button>
                    {showFilters && (
                      <div className="absolute top-full right-0 mt-2 z-[60] bg-[#0d0d12] border border-border/30 rounded-xl shadow-2xl p-3 min-w-[260px]">
                        {/* Actions */}
                        <div className="flex gap-1.5 mb-3">
                          <button
                            className="flex-1 text-[9px] font-black uppercase tracking-wider py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
                            onClick={() =>
                              setActiveFilters(
                                new Set([
                                  "RAID",
                                  "EXTERNAL",
                                  "PERSONAL",
                                  "UTILITY",
                                  "ROLE_HEAL",
                                  "ROLE_TANK",
                                  "ROLE_DPS",
                                ]),
                              )
                            }
                          >
                            Todos
                          </button>
                          <button
                            className="flex-1 text-[9px] font-black uppercase tracking-wider py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
                            onClick={() => setActiveFilters(new Set())}
                          >
                            Ninguno
                          </button>
                          <button
                            className="flex-1 text-[9px] font-black uppercase tracking-wider py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-700/30 text-blue-400 transition-colors"
                            onClick={() =>
                              setActiveFilters(
                                new Set([
                                  "RAID",
                                  "EXTERNAL",
                                  "ROLE_HEAL",
                                  "ROLE_TANK",
                                  "ROLE_DPS",
                                ]),
                              )
                            }
                          >
                            Default
                          </button>
                        </div>
                        {/* Category toggles */}
                        <div className="flex flex-col gap-1">
                          {FILTER_CATEGORIES.map((cat) => (
                            <button
                              key={cat.key}
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all text-left",
                                activeFilters.has(cat.key)
                                  ? "border-white/20 bg-white/5"
                                  : "border-transparent bg-transparent opacity-40 hover:opacity-70",
                              )}
                              onClick={() => toggleFilter(cat.key)}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: cat.color }}
                              />
                              <div className="flex flex-col leading-tight">
                                <span className="text-[10px] font-black text-white">
                                  {cat.label}
                                </span>
                                <span className="text-[8px] text-white/40">
                                  {cat.description}
                                </span>
                              </div>
                              {activeFilters.has(cat.key) ? (
                                <IconEye className="size-3.5 ml-auto text-white/50 shrink-0" />
                              ) : (
                                <IconEyeOff className="size-3.5 ml-auto text-white/20 shrink-0" />
                              )}
                            </button>
                          ))}
                          <div className="h-px bg-border/20 mx-2 my-1" />
                          {ROLE_FILTERS.map((cat) => (
                            <button
                              key={cat.key}
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all text-left",
                                activeFilters.has(cat.key)
                                  ? "border-white/20 bg-white/5"
                                  : "border-transparent bg-transparent opacity-40 hover:opacity-70",
                              )}
                              onClick={() => toggleFilter(cat.key)}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: cat.color }}
                              />
                              <div className="flex flex-col leading-tight">
                                <span className="text-[10px] font-black text-white">
                                  {cat.label}
                                </span>
                                <span className="text-[8px] text-white/40">
                                  {cat.description}
                                </span>
                              </div>
                              {activeFilters.has(cat.key) ? (
                                <IconEye className="size-3.5 ml-auto text-white/50 shrink-0" />
                              ) : (
                                <IconEyeOff className="size-3.5 ml-auto text-white/20 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ======================= */}
              {/* TIMELINE RENDERER       */}
              {/* ======================= */}
              <div
                className="flex-1 min-h-0 min-w-0 overflow-x-auto overflow-y-auto select-none bg-gradient-to-b from-[#0a0a0f] to-[#050508] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative w-full max-w-full"
                ref={setTimelineRef}
                onMouseMove={handleTimelineMouseMove}
                onMouseLeave={handleTimelineMouseLeave}
                onMouseUp={handleTimelineMouseUp}
              >
                <div
                  className="flex flex-col relative pb-10 h-full min-h-max"
                  style={{ minWidth: `${1400 * timelineZoom}px` }}
                >
                  <div className="h-6 flex relative border-b border-border/10 sticky top-0 z-40 bg-[#0a0a0f] backdrop-blur-md">
                    <div className="w-[150px] border-r border-border/20 shrink-0 sticky left-0 z-40 bg-[#0a0a0f]/90" />
                    <div
                      className="flex-1 relative"
                      id="timeline-track-container"
                    >
                      {Array.from(
                        { length: Math.floor(TOTAL_FIGHT_SECONDS / 30) + 1 },
                        (_, i) => i * 30,
                      ).map((timeMarker) => (
                        <div
                          key={timeMarker}
                          className="absolute inset-y-0 w-px bg-white/5"
                          style={{
                            left: `${(timeMarker / TOTAL_FIGHT_SECONDS) * 100}%`,
                          }}
                        >
                          {timeMarker > 0 && (
                            <span className="absolute top-1 -left-3 text-[9px] font-bold text-muted-foreground/60">
                              {formatTime(timeMarker)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Full-Height Indicator Lines - behind abilities */}
                  <div
                    className="absolute inset-0 pointer-events-none z-[5] overflow-visible"
                    style={{
                      left: `${SIDEBAR_WIDTH}px`,
                      width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
                    }}
                  >
                    {/* Hover line - GPU accelerated via transform */}
                    <div
                      ref={hoverLineRef}
                      className="absolute inset-y-0 w-px bg-white/20 pointer-events-none"
                      style={{
                        display: "none",
                        left: 0,
                        boxShadow: "0 0 10px rgba(255,255,255,0.2)",
                      }}
                    />
                  </div>

                  {/* Time badges - Removed legacy badges to favors floating tooltip */}
                  <div
                    className="absolute inset-0 pointer-events-none z-50 overflow-visible"
                    style={{
                      left: `${SIDEBAR_WIDTH}px`,
                      width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
                    }}
                  >
                    <div
                      ref={hoverBadgeContainerRef}
                      style={{ display: "none" }}
                    />
                  </div>

                  {/* Boss Abilities - one row per unique ability */}
                  {(() => {
                    const bossAbilities = getBossTimeline(selectedBoss);
                    // Group by ability name preserving order of first appearance
                    const abilityGroups: { name: string; times: number[] }[] =
                      [];
                    const seen = new Map<string, number>();
                    bossAbilities.forEach(
                      (a: { name: string; time: number }) => {
                        const idx = seen.get(a.name);
                        if (idx !== undefined) {
                          abilityGroups[idx].times.push(a.time);
                        } else {
                          seen.set(a.name, abilityGroups.length);
                          abilityGroups.push({ name: a.name, times: [a.time] });
                        }
                      },
                    );

                    if (abilityGroups.length === 0) {
                      return (
                        <div className="h-20 border-b border-border/10 flex relative">
                          <div className="w-[150px] border-r border-border/20 p-2 flex flex-col justify-center gap-2 shrink-0 bg-[#0d0d12] backdrop-blur-xl z-20 sticky left-0">
                            <div className="flex flex-col items-center">
                              <IconTrash className="size-4 text-red-500/50" />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col border-b border-red-500/20">
                        <div className="flex">
                          <div
                            className="w-[150px] border-r border-border/20 shrink-0 bg-[#0d0d12] sticky left-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
                            style={{
                              borderLeftWidth: "3px",
                              borderLeftColor: "#ef4444",
                            }}
                          >
                            <div className="flex flex-col bg-black/40">
                              {/* BOSS header row */}
                              <div className="h-[24px] flex items-center pl-2.5 border-b border-border/10 bg-black/20">
                                <span className="text-[10px] font-black uppercase tracking-wider text-red-500">
                                  HABILIDADES BOSS
                                </span>
                              </div>
                              {abilityGroups.map((group) => {
                                const meta = bossAbilitiesMeta[group.name] || BOSS_ABILITY_META[group.name];
                                const displayName = meta?.nameEs || group.name;
                                return (
                                  <div
                                    key={group.name}
                                    className="h-[28px] flex items-center justify-end gap-1.5 pl-2 pr-2 border-b border-border/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                                  >
                                    <span
                                      className="text-[9px] font-bold truncate text-right flex-1"
                                      style={{
                                        color: meta?.color || "#f87171",
                                      }}
                                      title={displayName}
                                    >
                                      {displayName}
                                    </span>
                                    {meta?.icon && (
                                      <Image
                                        unoptimized
                                        src={meta.icon}
                                        alt={group.name}
                                        width={16}
                                        height={16}
                                        className="rounded-sm shadow-sm opacity-90 shrink-0"
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col relative bg-grid-white/[0.01]">
                            {/* Vertical grid lines */}
                            <div className="absolute inset-0 pointer-events-none">
                              {Array.from(
                                {
                                  length:
                                    Math.floor(TOTAL_FIGHT_SECONDS / 30) + 1,
                                },
                                (_, i) => i * 30,
                              ).map((t) => (
                                <div
                                  key={`grid-boss-${t}`}
                                  className="absolute inset-y-0 w-px bg-white/[0.02]"
                                  style={{
                                    left: `${(t / TOTAL_FIGHT_SECONDS) * 100}%`,
                                  }}
                                />
                              ))}
                            </div>
                            {/* Header spacer */}
                            <div className="h-[24px] border-b border-border/10" />
                            {/* One track per ability */}
                            {abilityGroups.map((group) => {
                              const meta = bossAbilitiesMeta[group.name] || BOSS_ABILITY_META[group.name];
                              const abilityColor = meta?.color || "#ef4444";
                              return (
                                <div
                                  key={group.name}
                                  className="h-[28px] relative border-b border-border/5 last:border-0"
                                >
                                  {group.times.map((t, ti) => (
                                    <div
                                      key={`boss-${group.name}-${ti}`}
                                      className="absolute top-0.5 bottom-0.5 rounded flex items-center gap-1 px-1 text-[8px] font-bold shadow-sm overflow-visible transition-colors cursor-default z-10 group/boss"
                                      style={{
                                        left: `${(t / TOTAL_FIGHT_SECONDS) * 100}%`,
                                        backgroundColor: `${abilityColor}15`,
                                        borderWidth: "1px",
                                        borderColor: `${abilityColor}40`,
                                        borderLeftWidth: "2px",
                                        borderLeftColor: abilityColor,
                                        color: abilityColor,
                                        width: "52px",
                                      }}
                                    >
                                      {meta?.icon && (
                                        <Image
                                          unoptimized
                                          src={meta.icon}
                                          alt=""
                                          width={14}
                                          height={14}
                                          className="rounded-sm opacity-80 shrink-0"
                                        />
                                      )}
                                      <span className="truncate">
                                        {formatTime(t)}
                                      </span>
                                      {/* Hover preview */}
                                      <div className="absolute bottom-full left-0 mb-1 hidden group-hover/boss:flex items-center gap-2 bg-black/95 border border-border/30 rounded-lg px-2.5 py-1.5 shadow-xl z-50 whitespace-nowrap pointer-events-none">
                                        {meta?.icon && (
                                          <Image
                                            unoptimized
                                            src={meta.icon}
                                            alt=""
                                            width={24}
                                            height={24}
                                            className="rounded shadow-sm shrink-0"
                                          />
                                        )}

                                        <div className="flex flex-col leading-tight">
                                          <span
                                            className="text-[10px] font-black"
                                            style={{ color: abilityColor }}
                                          >
                                            {meta?.nameEs || group.name}
                                          </span>
                                          <span className="text-[9px] text-white/60">
                                            {formatTime(t)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex-1 flex flex-col border-t border-border/10">
                    {healers.length === 0 ? (
                      <div className="h-40 flex items-center justify-center text-muted-foreground text-sm uppercase tracking-widest font-black opacity-50">
                        No hay healers seleccionados en el roster
                      </div>
                    ) : condensedView ? (
                      /* ===== CONDENSED VIEW ===== */
                      healers.map((h: any, hIndex: number) => {
                        const role = h.role || "ranged";
                        if (role === "heal" && !activeFilters.has("ROLE_HEAL"))
                          return null;
                        if (role === "tank" && !activeFilters.has("ROLE_TANK"))
                          return null;
                        if (
                          (role === "melee" || role === "ranged") &&
                          !activeFilters.has("ROLE_DPS")
                        )
                          return null;

                        const hCooldowns = cooldownDefinitions.filter(
                          (c: CooldownDefinition) => {
                            if (!activeFilters.has(c.ability_type))
                              return false;
                            if (c.class_id !== h.class_id) return false;

                            // Determine allowed specs based on the character's assigned event_role
                            const roleSpecs = getRoleSpecs(h.class_id, h.role);

                            // If the cooldown is role/spec restricted
                            if (c.allowed_specs && c.allowed_specs.length > 0) {
                              // If we know their role specs, ensure the cooldown fits their role
                              if (roleSpecs) {
                                const isAllowedForRole = c.allowed_specs.some(
                                  (specId) => roleSpecs.includes(specId),
                                );
                                if (!isAllowedForRole) return false;
                              } else {
                                // Fallback to strict spec_id checking if role isn't mapped
                                if (
                                  h.spec_id > 0 &&
                                  !c.allowed_specs.includes(h.spec_id)
                                )
                                  return false;
                              }
                            }

                            return true;
                          },
                        );

                        if (hCooldowns.length === 0) return null;
                        const classColor = hCooldowns[0]?.color || "#ffffff";
                        const allAssignments = assignments.filter(
                          (a: any) => a.member_id === h.id,
                        );

                        return (
                          <div
                            key={hIndex}
                            className="flex border-b border-border/10 h-[28px]"
                          >
                            {/* Sidebar: name + icons */}
                            <div
                              className="w-[150px] border-r border-border/20 shrink-0 bg-[#0d0d12] sticky left-0 z-30 flex items-center justify-center p-1 shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
                              style={{
                                borderLeftWidth: "3px",
                                borderLeftColor: classColor,
                              }}
                            >
                              <div className="flex items-center gap-1 overflow-hidden shrink-0">
                                {h.role === "tank" && (
                                  <IconShield className="size-3.5 opacity-60 shrink-0" />
                                )}
                                {h.role === "heal" && (
                                  <IconPlus className="size-3.5 text-emerald-400 opacity-80 shrink-0" />
                                )}
                                {h.role === "melee" && (
                                  <IconSword className="size-3.5 opacity-60 shrink-0" />
                                )}
                                {(h.role === "ranged" || !h.role) && (
                                  <IconBow className="size-3.5 opacity-60 shrink-0" />
                                )}
                                <span
                                  className="text-[9px] font-black uppercase tracking-wider truncate"
                                  style={{ color: classColor }}
                                >
                                  {h.character_name}
                                </span>
                              </div>
                            </div>
                            {/* Single condensed track */}
                            <div
                              className={cn(
                                "flex-1 relative border-b border-border/5 bg-grid-white/[0.01]",
                                draggingAssignment ? "pointer-events-none" : "",
                              )}
                            >
                              {/* Grid lines */}
                              <div className="absolute inset-0 pointer-events-none z-0">
                                {Array.from(
                                  {
                                    length:
                                      Math.floor(TOTAL_FIGHT_SECONDS / 30) + 1,
                                  },
                                  (_, i) => i * 30,
                                ).map((t) => (
                                  <div
                                    key={`grid-c-${t}`}
                                    className="absolute inset-y-0 w-px bg-white/[0.02]"
                                    style={{
                                      left: `${(t / TOTAL_FIGHT_SECONDS) * 100}%`,
                                    }}
                                  />
                                ))}
                              </div>
                              {/* All assignments on one row */}
                              {allAssignments.map((assign: any) => {
                                const cd = hCooldowns.find(
                                  (c: any) => c.id === assign.cooldown_id,
                                );
                                if (!cd) return null;

                                const myStart = Number(assign.time_seconds);
                                const dur = Number(cd.duration || 0);
                                const actDurSec = Number(
                                  cd.active_duration || 0,
                                );
                                const myEnd = myStart + dur;

                                // Rendering bounds to prevent timeline horizontal overflow
                                const renderStart = Math.min(
                                  myStart,
                                  TOTAL_FIGHT_SECONDS,
                                );
                                const maxRenderDur = Math.max(
                                  0,
                                  TOTAL_FIGHT_SECONDS - renderStart,
                                );
                                const renderDur = Math.min(dur, maxRenderDur);
                                const renderActDur = Math.min(
                                  actDurSec,
                                  maxRenderDur,
                                );

                                // Overlap check
                                const isConflict = allAssignments.some(
                                  (a: any) => {
                                    if (a.id === assign.id) return false;
                                    if (a.cooldown_id !== assign.cooldown_id)
                                      return false;
                                    const otherStart = Number(a.time_seconds);
                                    const otherEnd = otherStart + dur;
                                    // Exclusive check: if they touch exactly, they don't fail.
                                    return (
                                      Math.max(otherStart, myStart) <
                                      Math.min(otherEnd, myEnd)
                                    );
                                  },
                                );

                                const startPct =
                                  (renderStart / TOTAL_FIGHT_SECONDS) * 100;
                                const actPct =
                                  renderActDur > 0
                                    ? (renderActDur / TOTAL_FIGHT_SECONDS) * 100
                                    : 0;
                                const cdPct =
                                  renderDur > 0
                                    ? (renderDur / TOTAL_FIGHT_SECONDS) * 100
                                    : 0;

                                return (
                                  <React.Fragment key={assign.id}>
                                    {/* Active Duration Overlay */}
                                    {actDurSec > 0 && (
                                      <div
                                        className="absolute top-0.5 bottom-0.5 pointer-events-none z-10"
                                        style={{
                                          left: `${startPct}%`,
                                          width: `${actPct}%`,
                                          backgroundColor: `transparent`,
                                          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px)`,
                                          borderTop: `1px solid ${cd.color}90`,
                                          borderBottom: `1px solid ${cd.color}90`,
                                          borderRight: `1px solid ${cd.color}90`,
                                        }}
                                      />
                                    )}

                                    {/* Cooldown Range (Right Tail) */}
                                    {dur > 0 && (
                                      <div
                                        className="absolute top-0.5 bottom-0.5 rounded-r pointer-events-none z-0"
                                        style={{
                                          left: `${startPct}%`,
                                          width: `${cdPct}%`,
                                          backgroundColor: isConflict
                                            ? "rgba(239, 68, 68, 0.4)"
                                            : `${cd.color}60`,
                                          borderColor: isConflict
                                            ? "#ef4444"
                                            : `${cd.color}90`,
                                          borderStyle: "solid",
                                          borderWidth: "1px",
                                          borderLeftWidth: "0px",
                                        }}
                                      />
                                    )}

                                    {/* Ghost Cooldown Range (Left Tail) */}
                                    {dur > 0 && (
                                      <div
                                        className="absolute top-0.5 bottom-0.5 rounded-l pointer-events-none z-0 border-y border-l"
                                        style={{
                                          left: `${startPct}%`,
                                          transform: `translateX(-100%)`,
                                          width: `${cdPct}%`,
                                          backgroundColor: `${cd.color}15`,
                                          borderColor: isConflict
                                            ? "#ef4444"
                                            : `${cd.color}60`,
                                          borderStyle: "dashed",
                                        }}
                                      />
                                    )}

                                    <div
                                      className={cn(
                                        "absolute top-0.5 bottom-0.5 flex items-center shadow-sm overflow-visible transition-all z-20 group/assign rounded -translate-x-1/2",
                                        draggingAssignment?.id === assign.id
                                          ? "opacity-50 cursor-grabbing scale-95 ring-2 ring-white/20"
                                          : "hover:brightness-125 cursor-grab active:cursor-grabbing",
                                        isConflict &&
                                        "bg-red-500/30 border border-red-500/50 ring-1 ring-red-400/40 shadow-[0_0_15px_rgba(239,68,68,0.3)] z-30",
                                      )}
                                      style={{
                                        left: `${startPct}%`,
                                        width: "26px",
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      onContextMenu={(e) =>
                                        handleDeleteAssignment(assign.id, e)
                                      }
                                      onMouseDown={(e) =>
                                        handleAssignmentMouseDown(e, assign)
                                      }
                                      onDragStart={(e) => e.preventDefault()}
                                    >
                                      <Image
                                        unoptimized
                                        src={cd.icon}
                                        alt=""
                                        width={24}
                                        height={24}
                                        className="rounded-sm opacity-90 shrink-0 pointer-events-none"
                                      />

                                      {/* Hover preview */}
                                      <div className="absolute bottom-full left-0 mb-1 hidden group-hover/assign:flex items-center gap-2 bg-black/95 border border-border/30 rounded-lg px-2.5 py-1.5 shadow-xl z-50 whitespace-nowrap pointer-events-none">
                                        <Image
                                          unoptimized
                                          src={cd.icon}
                                          alt=""
                                          width={24}
                                          height={24}
                                          className="rounded shadow-sm shrink-0"
                                        />

                                        <div className="flex flex-col leading-tight">
                                          <span
                                            className="text-[10px] font-black"
                                            style={{ color: cd.color }}
                                          >
                                            {cd.name}
                                          </span>
                                          <span className="text-[9px] text-white/60">
                                            {h.character_name} ·{" "}
                                            {formatTime(assign.time_seconds)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      /* ===== EXPANDED VIEW ===== */
                      healers.map((h: any, hIndex: number) => {
                        const role = h.role || "ranged";
                        if (role === "heal" && !activeFilters.has("ROLE_HEAL"))
                          return null;
                        if (role === "tank" && !activeFilters.has("ROLE_TANK"))
                          return null;
                        if (
                          (role === "melee" || role === "ranged") &&
                          !activeFilters.has("ROLE_DPS")
                        )
                          return null;

                        const hCooldowns = cooldownDefinitions.filter(
                          (c: CooldownDefinition) => {
                            if (!activeFilters.has(c.ability_type))
                              return false;
                            if (c.class_id !== h.class_id) return false;

                            // Determine allowed specs based on the character's assigned event_role
                            const roleSpecs = getRoleSpecs(h.class_id, h.role);

                            // If the cooldown is role/spec restricted
                            if (c.allowed_specs && c.allowed_specs.length > 0) {
                              // If we know their role specs, ensure the cooldown fits their role
                              if (roleSpecs) {
                                const isAllowedForRole = c.allowed_specs.some(
                                  (specId) => roleSpecs.includes(specId),
                                );
                                if (!isAllowedForRole) return false;
                              } else {
                                // Fallback to strict spec_id checking if role isn't mapped
                                if (
                                  h.spec_id > 0 &&
                                  !c.allowed_specs.includes(h.spec_id)
                                )
                                  return false;
                              }
                            }

                            return true;
                          },
                        );

                        if (hCooldowns.length === 0) return null;

                        const classColor = hCooldowns[0]?.color || "#ffffff";
                        const isCollapsed = collapsedPlayers.has(h.id);

                        return (
                          <div
                            key={hIndex}
                            className="flex flex-col border-b border-border/20"
                          >
                            <div className="flex">
                              <div
                                className="w-[150px] border-r border-border/20 shrink-0 bg-[#0d0d12] sticky left-0 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
                                style={{
                                  borderLeftWidth: "3px",
                                  borderLeftColor: classColor,
                                }}
                              >
                                {/* Cooldown list */}
                                <div className="flex flex-col bg-black/40">
                                  {/* Name header row */}
                                  <div className="h-[24px] flex items-center gap-1.5 pl-2 border-b border-border/10 bg-black/20">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        togglePlayerCollapsed(h.id)
                                      }
                                      className="inline-flex items-center justify-center rounded-sm text-white/50 hover:text-white transition-colors shrink-0"
                                    >
                                      {isCollapsed ? (
                                        <IconChevronRight className="size-3.5" />
                                      ) : (
                                        <IconChevronDown className="size-3.5" />
                                      )}
                                    </button>
                                    {h.role === "tank" && (
                                      <IconShield className="size-3.5 opacity-60 shrink-0" />
                                    )}
                                    {h.role === "heal" && (
                                      <IconPlus className="size-3.5 text-emerald-400 opacity-80 shrink-0" />
                                    )}
                                    {h.role === "melee" && (
                                      <IconSword className="size-3.5 opacity-60 shrink-0" />
                                    )}
                                    {(h.role === "ranged" || !h.role) && (
                                      <IconBow className="size-3.5 opacity-60 shrink-0" />
                                    )}
                                    <span
                                      className="text-[10px] font-black uppercase tracking-wider truncate pr-1"
                                      style={{ color: classColor }}
                                    >
                                      {h.character_name}
                                    </span>
                                  </div>
                                  {/* Cooldown rows - collapsed shows only assigned cooldown icons */}
                                  {isCollapsed ? (
                                    <div className="h-[28px] flex items-center gap-0.5 px-1 border-b border-border/5 bg-white/[0.02] overflow-hidden">
                                      {(() => {
                                        const assignedCdIds = new Set(
                                          assignments
                                            .filter(
                                              (a: any) => a.member_id === h.id,
                                            )
                                            .map((a: any) => a.cooldown_id),
                                        );
                                        return hCooldowns
                                          .filter((cd) =>
                                            assignedCdIds.has(cd.id),
                                          )
                                          .map((cd) => (
                                            <div
                                              key={cd.id}
                                              className="shrink-0"
                                              title={cd.name}
                                            >
                                              <Image
                                                unoptimized
                                                src={cd.icon}
                                                alt={cd.name}
                                                width={18}
                                                height={18}
                                                className="rounded-sm"
                                              />
                                            </div>
                                          ));
                                      })()}
                                    </div>
                                  ) : (
                                    hCooldowns.map((cd: CooldownDefinition) => (
                                      <div
                                        key={cd.id}
                                        className="h-[28px] flex items-center justify-end gap-1.5 pl-2 pr-2 border-b border-border/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                                        title={cd.name}
                                      >
                                        <span className="text-[9px] font-bold truncate text-right flex-1 text-white/80">
                                          {cd.name}
                                        </span>
                                        <Image
                                          unoptimized
                                          src={cd.icon}
                                          alt={cd.name}
                                          width={16}
                                          height={16}
                                          className="rounded-sm shadow-sm opacity-90 shrink-0"
                                        />
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              <div className="flex-1 flex flex-col relative bg-grid-white/[0.01]">
                                {/* Vertical grid lines */}
                                <div className="absolute inset-0 pointer-events-none z-0">
                                  {Array.from(
                                    {
                                      length:
                                        Math.floor(TOTAL_FIGHT_SECONDS / 30) +
                                        1,
                                    },
                                    (_, i) => i * 30,
                                  ).map((t) => (
                                    <div
                                      key={`grid-${t}`}
                                      className="absolute inset-y-0 w-px bg-white/[0.02]"
                                      style={{
                                        left: `${(t / TOTAL_FIGHT_SECONDS) * 100}%`,
                                      }}
                                    />
                                  ))}
                                </div>

                                {/* Name header spacer */}
                                <div className="h-[24px] border-b border-border/10" />

                                {/* One track per cooldown - collapsed shows compact all-in-one row */}
                                {isCollapsed ? (
                                  <div className="h-[28px] relative cursor-crosshair border-b border-border/5 hover:bg-white/[0.03]">
                                    {hCooldowns.map((cd: any) => {
                                      const rowAssignments = assignments.filter(
                                        (a: any) =>
                                          a.member_id === h.id &&
                                          a.cooldown_id === cd.id,
                                      );

                                      return rowAssignments.map(
                                        (assign: any) => {
                                          const startPct =
                                            (assign.time_seconds /
                                              TOTAL_FIGHT_SECONDS) *
                                            100;

                                          return (
                                            <div
                                              key={assign.id}
                                              className="absolute top-0.5 bottom-0.5 flex items-center shadow-sm overflow-visible transition-all z-20 group/assign rounded -translate-x-1/2"
                                              style={{
                                                left: `${startPct}%`,
                                                width: "58px",
                                                borderLeftColor: cd.color,
                                                backgroundColor: `${cd.color}60`,
                                                borderWidth: "1px",
                                                borderLeftWidth: "3px",
                                              }}
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            >
                                              <Image
                                                unoptimized
                                                src={cd.icon}
                                                alt=""
                                                width={16}
                                                height={16}
                                                className="mx-auto rounded-sm shrink-0"
                                              />
                                            </div>
                                          );
                                        },
                                      );
                                    })}
                                  </div>
                                ) : (
                                  hCooldowns.map((cd: any) => {
                                    const rowAssignments = assignments.filter(
                                      (a: any) =>
                                        a.member_id === h.id &&
                                        a.cooldown_id === cd.id,
                                    );

                                    return (
                                      <div
                                        key={`track-${cd.id}`}
                                        className={cn(
                                          "h-[28px] relative cursor-crosshair transition-colors group/track border-b border-border/5 last:border-0",
                                          draggingAssignment
                                            ? "pointer-events-none"
                                            : "hover:bg-white/[0.03]",
                                        )}
                                        onMouseMove={(e) => {
                                          const rect =
                                            e.currentTarget.getBoundingClientRect();
                                          const x = e.clientX - rect.left;
                                          const pct = Math.max(
                                            0,
                                            Math.min(1, x / rect.width),
                                          );
                                          e.currentTarget.style.setProperty(
                                            "--preview-left",
                                            `${pct * 100}%`,
                                          );
                                          const previewTime = Math.round(
                                            pct * TOTAL_FIGHT_SECONDS,
                                          );

                                          setFloatingTooltip({
                                            visible: true,
                                            x: e.clientX,
                                            y: e.clientY,
                                            time: previewTime,
                                          });
                                        }}
                                        onMouseLeave={() =>
                                          setFloatingTooltip((prev) => ({
                                            ...prev,
                                            visible: false,
                                          }))
                                        }
                                        onMouseUp={(e) => {
                                          if (e.button !== 0) return; // Only allow left-click for creation
                                          if (
                                            isLoading ||
                                            wasDragging ||
                                            draggingAssignment
                                          )
                                            return;
                                          const rect =
                                            e.currentTarget.getBoundingClientRect();
                                          const clickX = e.clientX - rect.left;
                                          const percentage = Math.max(
                                            0,
                                            clickX / rect.width,
                                          );
                                          const timeClicked = Math.round(
                                            percentage * TOTAL_FIGHT_SECONDS,
                                          );
                                          handleAssignCooldown(
                                            h.id,
                                            cd.id,
                                            timeClicked,
                                          );
                                        }}
                                      >
                                        {/* Ghost preview on hover */}
                                        <div
                                          className="absolute top-0.5 bottom-0.5 rounded flex items-center gap-1 px-1 opacity-0 group-hover/track:opacity-40 transition-opacity pointer-events-none z-[1]"
                                          style={{
                                            left: "var(--preview-left, 0%)",
                                            transform: "translateX(-50%)",
                                            backgroundColor: `${cd.color}25`,
                                            borderWidth: "1px",
                                            borderColor: `${cd.color}50`,
                                            borderLeftWidth: "2px",
                                            borderLeftColor: cd.color,
                                            width:
                                              cd.active_duration &&
                                                cd.active_duration > 0
                                                ? `calc(max(60px, ${(cd.active_duration / TOTAL_FIGHT_SECONDS) * 100}%))`
                                                : "60px",
                                          }}
                                        >
                                          <Image
                                            unoptimized
                                            src={cd.icon}
                                            alt=""
                                            width={16}
                                            height={16}
                                            className="rounded-sm opacity-60 shrink-0"
                                          />
                                        </div>
                                        {rowAssignments.map((assign: any) => {
                                          const actDurSec =
                                            cd.active_duration &&
                                              cd.active_duration > 0
                                              ? cd.active_duration
                                              : 0;
                                          // Minimum width for clickability if active duration is 0
                                          const minWidthPx =
                                            actDurSec > 0 ? 0 : 60;

                                          // Robust detection logic: An assignment A is in error if there is a conflict in their cooldown periods.
                                          const myStart = Number(
                                            assign.time_seconds,
                                          );
                                          const dur = Number(cd.duration || 0);
                                          const myEnd = myStart + dur;

                                          // Rendering bounds to prevent timeline horizontal overflow
                                          const renderStart = Math.min(
                                            myStart,
                                            TOTAL_FIGHT_SECONDS,
                                          );
                                          const maxRenderDur = Math.max(
                                            0,
                                            TOTAL_FIGHT_SECONDS - renderStart,
                                          );
                                          const renderDur = Math.min(
                                            dur,
                                            maxRenderDur,
                                          );
                                          const renderActDur = Math.min(
                                            actDurSec,
                                            maxRenderDur,
                                          );

                                          const startPct =
                                            (renderStart /
                                              TOTAL_FIGHT_SECONDS) *
                                            100;
                                          const actPct =
                                            renderActDur > 0
                                              ? (renderActDur /
                                                TOTAL_FIGHT_SECONDS) *
                                              100
                                              : 0;
                                          const cdPct =
                                            renderDur > 0
                                              ? (renderDur /
                                                TOTAL_FIGHT_SECONDS) *
                                              100
                                              : 0;

                                          const isConflict =
                                            rowAssignments.some((a: any) => {
                                              if (a.id === assign.id)
                                                return false;
                                              const otherStart = Number(
                                                a.time_seconds,
                                              );
                                              const otherEnd = otherStart + dur;
                                              // Exclusive check: if they touch exactly, they don't fail.
                                              return (
                                                Math.max(otherStart, myStart) <
                                                Math.min(otherEnd, myEnd)
                                              );
                                            });

                                          return (
                                            <React.Fragment key={assign.id}>
                                              {/* Active Duration Overlay */}
                                              {actDurSec > 0 && (
                                                <div
                                                  className="absolute top-0.5 bottom-0.5 pointer-events-none z-10"
                                                  style={{
                                                    left: `${startPct}%`,
                                                    width: `${actPct}%`,
                                                    backgroundColor: `transparent`,
                                                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px)`,
                                                    borderTop: `1px solid ${cd.color}90`,
                                                    borderBottom: `1px solid ${cd.color}90`,
                                                    borderRight: `1px solid ${cd.color}90`,
                                                  }}
                                                />
                                              )}

                                              {/* Cooldown Tail (Right) */}
                                              {dur > 0 && (
                                                <div
                                                  className="absolute top-0.5 bottom-0.5 pointer-events-none transition-colors border-y border-r rounded-r z-0"
                                                  style={{
                                                    left: `${startPct}%`,
                                                    width: `${cdPct}%`,
                                                    backgroundColor: isConflict
                                                      ? "rgba(239, 68, 68, 0.4)"
                                                      : `${cd.color}60`,
                                                    borderColor: isConflict
                                                      ? "#ef4444"
                                                      : `${cd.color}90`,
                                                    borderWidth: "1px",
                                                    borderLeftWidth: "0px",
                                                    borderStyle: "solid",
                                                  }}
                                                />
                                              )}

                                              {/* Ghost Cooldown Tail (Left Tail) */}
                                              {dur > 0 && (
                                                <div
                                                  className="absolute top-0.5 bottom-0.5 rounded-l pointer-events-none z-0 border-y border-l"
                                                  style={{
                                                    left: `${startPct}%`,
                                                    transform: `translateX(-100%)`,
                                                    width: `${cdPct}%`,
                                                    backgroundColor: `${cd.color}15`,
                                                    borderColor: isConflict
                                                      ? "#ef4444"
                                                      : `${cd.color}60`,
                                                    borderStyle: "dashed",
                                                  }}
                                                />
                                              )}

                                              <div
                                                className={cn(
                                                  "absolute top-0.5 bottom-0.5 flex items-center shadow-sm overflow-visible transition-all z-20 group/assign rounded -translate-x-1/2",
                                                  draggingAssignment?.id ===
                                                    assign.id
                                                    ? "opacity-50 cursor-grabbing scale-95 ring-2 ring-white/20"
                                                    : "hover:brightness-125 cursor-grab active:cursor-grabbing",
                                                  isConflict &&
                                                  "bg-red-500/30 border border-red-500/50 ring-1 ring-red-400/40 shadow-[0_0_15px_rgba(239,68,68,0.3)] z-30",
                                                )}
                                                style={{
                                                  left: `${startPct}%`,
                                                  width: "58px",
                                                  borderLeftColor: cd.color,
                                                }}
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                                onContextMenu={(e) =>
                                                  handleDeleteAssignment(
                                                    assign.id,
                                                    e,
                                                  )
                                                }
                                                onMouseDown={(e) =>
                                                  handleAssignmentMouseDown(
                                                    e,
                                                    assign,
                                                  )
                                                }
                                                onDragStart={(e) =>
                                                  e.preventDefault()
                                                }
                                              >
                                                <div className="flex w-full h-full items-center justify-center p-0.5">
                                                  <Image
                                                    unoptimized
                                                    src={cd.icon}
                                                    alt=""
                                                    width={22}
                                                    height={22}
                                                    className="rounded-sm opacity-90 shrink-0 pointer-events-none"
                                                  />
                                                </div>

                                                {/* Hover preview */}
                                                <div className="absolute bottom-full left-0 mb-1 hidden group-hover/assign:flex items-center gap-2 bg-black/95 border border-border/30 rounded-lg px-2.5 py-1.5 shadow-xl z-50 whitespace-nowrap pointer-events-none">
                                                  <Image
                                                    unoptimized
                                                    src={cd.icon}
                                                    alt=""
                                                    width={24}
                                                    height={24}
                                                    className="rounded shadow-sm shrink-0"
                                                  />

                                                  <div className="flex flex-col leading-tight">
                                                    <span
                                                      className="text-[10px] font-black"
                                                      style={{
                                                        color: cd.color,
                                                      }}
                                                    >
                                                      {cd.name}
                                                    </span>
                                                    <span className="text-[9px] text-white/60">
                                                      {h.character_name}
                                                      {" · "}
                                                      {formatTime(
                                                        assign.time_seconds,
                                                      )}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </React.Fragment>
                                          );
                                        })}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Floating Time Tooltip */}
          {floatingTooltip.visible && (
            <div
              className="fixed z-[9999] pointer-events-none bg-black/95 border border-amber-500/50 rounded-md px-2.5 py-1 shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md transition-transform duration-75 flex items-center justify-center min-w-[50px]"
              style={{
                left: `${floatingTooltip.x + 15}px`,
                top: `${floatingTooltip.y - 15}px`,
                transform: "translate(0, -50%)",
              }}
            >
              <span className="text-sm font-black text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)] tabular-nums">
                {formatTime(floatingTooltip.time)}
              </span>
            </div>
          )}

          <TabsContent value="mrt" className="m-0 flex-1 min-h-0 lg:min-h-[600px] overflow-hidden">
            <Card className="border-border/50 overflow-hidden shadow-2xl rounded-xl flex flex-col h-full">
              <div className="flex border-b border-border/40 bg-muted/5 items-center justify-between px-3 sm:px-6 h-14 sm:h-16 shrink-0">
                <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground h-8 sm:h-9 gap-1 sm:gap-2 px-1 sm:px-3"
                    onClick={() => setActiveTab("selection")}
                  >
                    <IconArrowLeft className="size-3.5 sm:size-4" />
                    <span className="hidden xs:inline">Volver</span>
                  </Button>
                  <div className="h-4 w-px bg-border/40 mx-1 sm:mx-2" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase text-amber-500 tracking-wider truncate max-w-[150px] sm:max-w-[250px]">
                      {selectedBoss}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">
                      Nota MRT
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleCopyNote()}
                    className={cn(
                      "h-8 sm:h-9 px-2 sm:px-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all",
                      copySuccess
                        ? "bg-emerald-600 hover:bg-emerald-500"
                        : "bg-amber-600 hover:bg-amber-500",
                    )}
                  >
                    {copySuccess ? (
                      <>
                        <IconCheck className="size-3.5 sm:size-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Copiado!</span>
                        <span className="sm:hidden">OK</span>
                      </>
                    ) : (
                      <>
                        <IconCopy className="size-3.5 sm:size-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Copiar Nota</span>
                        <span className="sm:hidden">Copiar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 sm:p-8 bg-[#0a0a0f] flex-1 overflow-y-auto no-scrollbar">
                <div className="max-w-3xl mx-auto h-full flex flex-col">
                  <div className="mb-4 sm:mb-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="size-8 sm:size-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                        <IconClipboardText className="size-4 sm:size-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white truncate">
                          Method Raid Tools Note
                        </h4>
                        <p className="text-[8px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                          Copia y pega en el MRT ingame
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="relative group flex-1 min-h-[300px]">
                    <textarea
                      readOnly
                      className="w-full h-full bg-black/60 border border-border/20 min-h-[300px] rounded-xl p-4 sm:p-6 font-mono text-xs sm:text-sm text-amber-500/90 focus:outline-none focus:border-amber-500/40 transition-all resize-none shadow-inner"
                      value={generateMRTNote()}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog
          open={!!editingAssignment}
          onOpenChange={(open) => !open && setEditingAssignment(null)}
        >
          <DialogContent className="sm:max-w-[425px] bg-[#0c0c12] border-border/20 text-white shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-amber-500">
                  <IconClock className="size-5" />
                </span>
                Editar Tiempo Manual
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label
                  htmlFor="time"
                  className="text-right text-xs uppercase tracking-widest font-bold text-white/60"
                >
                  Tiempo
                </Label>
                <Input
                  id="time"
                  value={editInputValue}
                  onChange={(e) => setEditInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateAssignmentTime();
                  }}
                  className="col-span-3 bg-black/40 border-border/20"
                  placeholder="E.g. 1:23 o 83"
                  autoFocus
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center italic">
                Puedes usar formato MM:SS o segundos totales.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                className="text-xs uppercase tracking-widest font-bold"
                onClick={() => setEditingAssignment(null)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-500 text-xs uppercase tracking-widest font-bold"
                onClick={handleUpdateAssignmentTime}
              >
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Help Dialog */}
        <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
          <DialogContent className="max-w-md bg-[#0d0d12]/95 border-border/30 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white font-black uppercase tracking-tight">
                <IconHelpCircle className="size-5 text-blue-400" />
                Instrucciones de Ayuda
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 flex flex-col gap-6">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-600/10 border border-blue-500/20 shadow-inner">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <IconCheck className="size-5 text-blue-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Edición Manual de Tiempos
                  </span>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Para ajustar el tiempo de una habilidad con precisión
                    milimétrica, mantén presionado{" "}
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-sans text-[10px] text-white">
                      Ctrl
                    </kbd>{" "}
                    y haz{" "}
                    <span className="text-blue-400 font-bold">
                      Click Izquierdo
                    </span>{" "}
                    sobre el icono en la línea de tiempo.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-xl bg-red-600/10 border border-red-500/20">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <IconTrash className="size-5 text-red-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Borrar Asignación
                  </span>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Haz{" "}
                    <span className="text-red-400 font-bold">
                      Click Derecho
                    </span>{" "}
                    sobre cualquier habilidad asignada para eliminarla
                    permanentemente de la planificación.
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
