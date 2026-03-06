"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
    IconSword, IconShield, IconCheck, IconX, IconRefresh,
    IconListCheck, IconLayoutGrid, IconUser, IconUsers, IconFilter, IconSettings,
    IconBolt, IconExternalLink
} from "@tabler/icons-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { MIDNIGHT_RAIDS } from "@/infrastructure/constants/raids"
import Image from "next/image"
import Script from "next/script"
import { CLASS_ARMOR, CLASS_WEAPONS, CLASS_SPEC_STAT } from "@/infrastructure/wishlist/item-filter-service"
import { toast } from "sonner"

type EligibleMember = {
    id: string
    character_name: string
    realm_slug: string
    class_id: number
    rank: number
    role: string | null
    bis_dps_gain: number | null
    bis_pct_gain: string | null
    spec_name: string
}

export type LootItem = {
    id: number
    name: string
    quality: string
    slot: string
    slotDisplay: string
    icon: string | null
    itemLevel: number | null
    itemSubclass: string | null
    itemClassId: number | null   // 2=Weapon, 4=Armor
    itemSubclassId: number | null // Armor: 0=Misc,1=Cloth,2=Leather,3=Mail,4=Plate,6=Shield | Weapon: 0=1hAxe,1=2hAxe,...
}

type Boss = {
    id: number
    name: string
    order: number
    items: LootItem[]
}

type BisSelection = {
    id: string
    member_id: string
    item_id: number
    item_name: string
    item_icon: string | null
    slot: string
    boss_name: string | null
    priority: number
    difficulty: string
    instance_id: string
    dps_gain: number | null
    percent_gain: string | null
    ilvl?: number
}

const RAID_DIFFICULTIES = [
    { id: 'lfr', name: 'LFR', color: 'text-gray-400' },
    { id: 'normal', name: 'Normal', color: 'text-green-500' },
    { id: 'heroic', name: 'Heroico', color: 'text-blue-500' },
    { id: 'mythic', name: 'Mítico', color: 'text-purple-500' }
]

const QUALITY_COLORS: Record<string, string> = {
    EPIC: "text-purple-400",
    RARE: "text-blue-400",
    LEGENDARY: "text-orange-400",
    UNCOMMON: "text-green-400",
}

const WOWHEAD_QUALITY: Record<string, number> = {
    EPIC: 4,
    RARE: 3,
    LEGENDARY: 5,
    UNCOMMON: 2,
}

// Map frontend difficulty states to Wowhead diff IDs
const WOWHEAD_DIFF: Record<string, number> = {
    normal: 14,
    heroic: 15,
    mythic: 16,
}

// Fixed item level per raid tier difficulty (Midnight Season 1)
const MIDNIGHT_S1_ILVL: Record<string, number> = {
    lfr: 250,
    normal: 263,
    heroic: 276,
    mythic: 289,
}

const CLASS_COLORS: Record<number, string> = {
    1: '#C69B6D', 2: '#F48CBA', 3: '#ABD473', 4: '#FFF468',
    5: '#FFFFFF', 6: '#C41E3A', 7: '#0070DD', 8: '#3FC7EB',
    9: '#8788EE', 10: '#00FF98', 11: '#FF7C0A', 12: '#A330C9', 13: '#33937F'
}

const CLASS_IMAGES: Record<number, string> = {
    1: "/assets/images/classes/1.jpg", 2: "/assets/images/classes/2.jpg",
    3: "/assets/images/classes/3.jpg", 4: "/assets/images/classes/4.jpg",
    5: "/assets/images/classes/5.jpg", 6: "/assets/images/classes/6.jpg",
    7: "/assets/images/classes/7.jpg", 8: "/assets/images/classes/8.jpg",
    9: "/assets/images/classes/9.jpg", 10: "/assets/images/classes/10.jpg",
    11: "/assets/images/classes/11.jpg", 12: "/assets/images/classes/12.jpg",
    13: "/assets/images/classes/13.jpg",
}

// ── Class-based item filtering ──────────────────────────────────────────────
// Armor subclass each class wears (item_class=4)

// Weapon subclass IDs each class can equip (item_class=2)
// 0=1hAxe, 1=2hAxe, 2=Bow, 3=Gun, 4=1hMace, 5=2hMace, 6=Polearm,
// 7=1hSword, 8=2hSword, 9=Warglaive, 10=Staff, 13=Fist, 15=Dagger, 18=Crossbow, 19=Wand

// Classes that can use shields (armor subclass 6)
const SHIELD_CLASSES = new Set([1, 2, 7]) // Warrior, Paladin, Shaman

function canSpecUseItem(classId: number, specName: string, item: any) {
    if (!canClassUseItem(classId, item)) return false

    // Strict specialization-specific restrictions for off-hands and shields
    const slotStr = (item.slot || item.inventory_type || "").toString().toUpperCase();
    const isShield = slotStr === "SHIELD" || item.itemSubclassId === 6;
    const isOffhand = ["OFF_HAND", "HELD_IN_OFF_HAND", "HOLDABLE"].includes(slotStr);

    if (isShield) {
        // Only specific specs use shields
        const canUseShield = (classId === 1 && specName === "Protection") || // Warrior
            (classId === 2 && (specName === "Protection" || specName === "Holy")) || // Paladin
            (classId === 7 && (specName === "Elemental" || specName === "Restoration")); // Shaman
        if (!canUseShield) return false;
    }

    if (isOffhand) {
        // Only specific classes/specs use off-hands
        const canUseOffhand = [8, 9, 5, 13].includes(classId) || // Mage, Warlock, Priest, Evoker (all specs)
            (classId === 11 && (specName === "Balance" || specName === "Restoration")) || // Druid
            (classId === 7 && (specName === "Elemental" || specName === "Restoration")) || // Shaman
            (classId === 10 && specName === "Mistweaver") || // Monk
            (classId === 2 && specName === "Holy"); // Paladin
        if (!canUseOffhand) return false;
    }

    // Primary Stat Check
    const requiredStatCode = CLASS_SPEC_STAT[classId]?.[specName];
    if (requiredStatCode && item.stats && item.stats.length > 0) {
        // Primary stats in WoW: 3=Agi, 4=Str, 5=Int (usually mapped in our API)
        const primaryStats = item.stats.filter((s: any) => [3, 4, 5].includes(s.stat || s.type));
        if (primaryStats.length > 0) {
            const matches = primaryStats.some((s: any) => {
                const type = s.stat || s.type;
                if (requiredStatCode === 1) return type === 4; // STR
                if (requiredStatCode === 2) return type === 3; // AGI
                if (requiredStatCode === 4) return type === 5; // INT
                return false;
            });
            if (!matches) return false;
        }
    }

    // Special case for Retri / Warriors / DKs with 1H weapons in "Weapon" slot
    // This logic is more about weapon type than stats, so it can remain.
    const slot = item.slot?.toUpperCase() || "";
    const sub = item.itemSubclassId;
    if (slot === "ONE_HAND" || slot === "WEAPON") {
        const isPlateDps = [1, 2, 6].includes(classId) && ["Arms", "Retribution", "Fury", "Unholy", "Frost"].includes(specName);
        if (isPlateDps && sub !== 1 && sub !== 5 && sub !== 8 && sub !== 6) {
            // If it's a 1H axe/sword/mace, it might be for a tank or someone else
            // Retri and Arms specially ONLY use 2H
            if (specName === "Retribution" || specName === "Arms") return false;
        }
    }

    return true
}

function canClassUseItem(classId: number, item: LootItem): boolean {
    // If no item metadata (old cache or fetch error), show it to be safe
    if (!item.itemClassId) return true

    // Hide anything that isn't a weapon (2) or armor (4)
    if (item.itemClassId !== 2 && item.itemClassId !== 4) return false

    // If no subclass data but is gear, show everything
    if (item.itemSubclassId == null) return true

    // Armor items (item_class = 4)
    if (item.itemClassId === 4) {
        // Subclass 0 = Miscellaneous (trinkets, rings, necks, cloaks) → all classes
        if (item.itemSubclassId === 0) return true
        // Shield
        if (item.itemSubclassId === 6) return SHIELD_CLASSES.has(classId)
        // Armor type must match
        return CLASS_ARMOR[classId] === item.itemSubclassId
    }

    // Weapon items (item_class = 2)
    if (item.itemClassId === 2) {
        const allowed = CLASS_WEAPONS[classId]
        if (!allowed) return true
        return allowed.includes(item.itemSubclassId)
    }

    return false
}

// Helper to translate slot names for the UI
const SLOT_TRANSLATIONS: Record<string, string> = {
    HEAD: "Cabeza", NECK: "Cuello", SHOULDER: "Hombreras", CHEST: "Pecho",
    WAIST: "Cinturón", LEGS: "Piernas", FEET: "Pies", WRIST: "Muñequeras",
    HANDS: "Guantes", FINGER: "Anillo", TRINKET: "Abalorio",
    ONE_HAND: "Una Mano", TWO_HAND: "Dos Manos", MAIN_HAND: "Mano Principal",
    OFF_HAND: "Mano Secundaria", SHIELD: "Escudo", BACK: "Capa", CLOAK: "Capa",
    HELD_IN_OFF_HAND: "Sostener", RANGED: "A Distancia", THROWN: "Arrojadiza",
    SHIRT: "Camisa", HOLDABLE: "Sostener", TWOHWEAPON: "Arma de 2 Manos", WEAPON: "Arma",
    HAND: "Guantes",
}

const translateSlot = (s: string) => SLOT_TRANSLATIONS[s.toUpperCase()] || s

const constructWowheadParams = (item: any, difficulty: string, customIlvl?: number) => {
    const diffId = WOWHEAD_DIFF[difficulty] || 15;
    const raidIlvl = MIDNIGHT_S1_ILVL[difficulty.toLowerCase()];
    const ilvl = customIlvl || raidIlvl || item.itemLevel || item.ilvl;

    let params = `item=${item.id || item.item_id}`;

    // Domain specifics (Midnight uses beta for some new items, but we stick to ES)
    if ((item.id || item.item_id) > 200000) params += `&domain=beta`;
    params += `&domain=es`;

    if (diffId) params += `&diff=${diffId}`;
    if (ilvl) params += `&ilvl=${ilvl}`;

    // Quality
    const quality = item.quality || "";
    if (quality && WOWHEAD_QUALITY[quality]) params += `&qu=${WOWHEAD_QUALITY[quality]}`;

    // Advanced metadata from Raidbots
    if (item.bonus_ids && item.bonus_ids.length > 0) params += `&bonus=${item.bonus_ids.join(':')}`;
    else if (item.bonusIds && item.bonusIds.length > 0) params += `&bonus=${item.bonusIds.join(':')}`;

    if (item.enchant) params += `&ench=${item.enchant}`;

    if (item.gems && item.gems.length > 0) params += `&gems=${item.gems.join(':')}`;

    return params;
};

const getIconUrl = (url: string | null, itemName?: string) => {
    // Hardcoded fix for specific broken icon - ALWAYS use this for this item
    if (itemName === "Vestigio rezumante del Dios Inconcebible") {
        return "https://wow.zamimg.com/images/wow/icons/large/inv_12_trinket_raid_dreamrift-_physdps2_umdreamtgodsoozingvestige.jpg";
    }

    if (!url) return null;

    // If it's a Blizzard render URL, convert to Wowhead large icon
    if (url.includes("render.worldofwarcraft.com")) {
        const parts = url.split("/");
        let iconName = parts[parts.length - 1]; // e.g. inv_vessel_void_01.jpg
        if (!iconName.includes(".")) iconName += ".jpg";
        return `https://wow.zamimg.com/images/wow/icons/large/${iconName.toLowerCase()}`;
    }

    // If it's already a full URL (wowhead or other), return as is
    if (url.startsWith("http")) return url;

    // If it's just a raw icon name (no slashes), it's a Wowhead icon name
    if (!url.includes("/")) {
        const iconName = url.includes(".") ? url : `${url}.jpg`;
        return `https://wow.zamimg.com/images/wow/icons/large/${iconName.toLowerCase()}`;
    }

    return url;
};

// Individual loot item card helper component
function LootItemCard({
    item,
    bossName,
    selected,
    onToggle,
    rbGain,
    difficulty,
    instanceId,
}: {
    item: LootItem
    bossName: string
    selected: boolean
    onToggle: () => void
    rbGain?: { dps: number; pct: string }
    difficulty: "normal" | "heroic" | "mythic" | string
    instanceId: string
}) {
    const qualityColor = QUALITY_COLORS[item.quality] || "text-foreground"

    // Use fixed ilvl from raid tier table for the selected difficulty
    const raidIlvl = MIDNIGHT_S1_ILVL[difficulty.toLowerCase()] || null;
    const computedItemLevel = raidIlvl || item.itemLevel || null;
    const diffId = WOWHEAD_DIFF[difficulty] || 15;

    // Map blizzard icon URL to Wowhead CDN URL to avoid 403s
    const iconUrl = getIconUrl(item.icon, item.name);

    return (
        <a
            href={`https://www.wowhead.com/item=${item.id}`}
            target="_blank"
            rel="nofollow noreferrer"
            onClick={(e) => {
                const isMeta = e.metaKey || e.ctrlKey;
                if (!isMeta) {
                    e.preventDefault()
                    onToggle()
                }
            }}
            data-wowhead={constructWowheadParams(item, difficulty)}
            data-wowhead-icon="false"
            data-wowhead-rename="false"
            className={`
                flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all w-full no-underline
                ${selected
                    ? "border-purple-500/50 bg-purple-500/10 shadow-sm shadow-purple-500/10"
                    : "border-border/50 bg-card hover:border-border hover:bg-muted/30"
                }
            `}
        >
            {iconUrl ? (
                <Image
                    unoptimized
                    src={iconUrl}
                    alt=""
                    width={36} height={36}
                    className="rounded border border-border/50 shadow-sm shrink-0"
                />
            ) : (
                <div className="size-9 rounded bg-muted border border-border/50 flex items-center justify-center shrink-0">
                    <IconShield className="size-4 text-muted-foreground" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${qualityColor}`}>{item.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                    {computedItemLevel ? `${computedItemLevel} · ` : ""}{bossName}
                </p>
                {rbGain && (
                    <p className="text-[10px] font-bold text-green-400 mt-0.5 animate-in fade-in slide-in-from-left-1">
                        +{rbGain.dps} DPS · +{rbGain.pct}%
                    </p>
                )}
            </div>
            {selected && (
                <div className="shrink-0">
                    <IconCheck className="size-4 text-purple-400" />
                </div>
            )}
        </a>
    )
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
}: {
    selectedMember: EligibleMember | undefined
    difficulty: string
    selections: BisSelection[]
    loadingSelections: boolean
    translateSlot: (s: string) => string
    setSelections: React.Dispatch<React.SetStateAction<BisSelection[]>>
    bosses: Boss[]
    instanceId: string
}) {
    return (
        <Card className="h-fit sticky top-20">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <IconListCheck className="size-5" />
                    Tu Lista de Deseos
                    {selections.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">{selections.length}</Badge>
                    )}
                </CardTitle>
                <CardDescription className="flex flex-col gap-1">
                    <span>{selectedMember ? `${selectedMember.character_name} — ${difficulty === "heroic" ? "Heroico" : "Mítico"}` : "Selecciona un personaje"}</span>
                    {(selections.some(s => s.dps_gain) || (selectedMember?.bis_dps_gain && selectedMember.bis_dps_gain > 0)) && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-400 uppercase tracking-widest mt-1">
                            <span>Mejora Total:</span>
                            {(() => {
                                // Prefer the sum of current selections if they have dps_gain, 
                                // otherwise fall back to the stored member gain.
                                const currentSum = selections.reduce((acc, s) => acc + (s.dps_gain || 0), 0);
                                const totalDps = currentSum > 0 ? currentSum : (selectedMember?.bis_dps_gain || 0);
                                const currentPctSum = selections.reduce((acc, s) => acc + parseFloat(s.percent_gain || "0"), 0);
                                const totalPct = currentPctSum > 0 ? currentPctSum : parseFloat(selectedMember?.bis_pct_gain || "0");

                                return (
                                    <>
                                        <span>+{Math.round(totalDps)} DPS</span>
                                        <Badge variant="outline" className="text-[9px] py-0 h-3.5 border-green-500/20 text-green-400">
                                            +{totalPct.toFixed(2)}%
                                        </Badge>
                                    </>
                                );
                            })()}
                        </div>
                    )}
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
                        <p className="text-xs mt-1">Haz clic en un ítem del panel para añadirlo.</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {selections.map(sel => {
                            const raidIlvl = MIDNIGHT_S1_ILVL[difficulty.toLowerCase()] || null;
                            let matchQuality = null;
                            const diffId = WOWHEAD_DIFF[difficulty] || 15;

                            for (const b of bosses) {
                                const i = b.items.find((it: LootItem) => it.id === sel.item_id);
                                if (i) {
                                    matchQuality = i.quality;
                                    break;
                                }
                            }

                            const computedItemLevel = raidIlvl || null;

                            return (
                                <a
                                    key={sel.id}
                                    href={`https://www.wowhead.com/item=${sel.item_id}`}
                                    target="_blank"
                                    rel="nofollow"
                                    className="flex items-center gap-2.5 p-2 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors group no-underline"
                                    data-wowhead={constructWowheadParams(sel, difficulty)}
                                    data-wowhead-icon="false"
                                    data-wowhead-rename="false"
                                    onClick={(e) => {
                                        // Prevent navigation ONLY if clicking on the delete button
                                        const isDeleteBtn = (e.target as HTMLElement).closest('button');
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
                                                width={36} height={36}
                                                className="rounded border border-border/50 shadow-sm shrink-0"
                                            />
                                        ) : (
                                            <div className="size-9 rounded bg-muted border border-border/50 flex items-center justify-center shrink-0">
                                                <IconShield className="size-4 text-muted-foreground" />
                                            </div>
                                        );
                                    })()}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-purple-400 truncate">{sel.item_name}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                                            <span>{sel.boss_name} · {translateSlot(sel.slot)}</span>
                                            {sel.dps_gain && (
                                                <span className="text-green-400 font-bold">+{Math.round(sel.dps_gain)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 rounded p-1 transition-all"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            await fetch(`/api/bis?id=${sel.id}`, { method: "DELETE" })
                                            setSelections(prev => prev.filter(s => s.id !== sel.id))
                                        }}
                                    >
                                        <IconX className="size-3.5" />
                                    </button>
                                </a>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

type OverviewSelection = {
    member_id: string
    item_id: number
    difficulty: string
    dps_gain: number | null
    percent_gain: string | null
    guild_members: {
        character_name: string
        class_id: number
        role: string | null
    }
}

export function BisClient({
    eligibleMembers,
    canEdit = false
}: {
    eligibleMembers: EligibleMember[]
    canEdit?: boolean
}) {
    const [selectedMemberId, setSelectedMemberId] = useState<string>(eligibleMembers[0]?.id || "")
    const [difficulty, setDifficulty] = useState<"normal" | "heroic" | "mythic">("heroic")
    const [viewMode, setViewMode] = useState<"slot" | "boss">("slot")
    const [selectedRaidId, setSelectedRaidId] = useState<string>("default")
    const [bosses, setBosses] = useState<Boss[]>([])
    const [selections, setSelections] = useState<BisSelection[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingSelections, setLoadingSelections] = useState(false)
    const [raidName, setRaidName] = useState("")
    const [resolvedInstanceId, setResolvedInstanceId] = useState<string>("")
    const [mounted, setMounted] = useState(false)
    const [raidbotsUrl, setRaidbotsUrl] = useState("")
    const [isImporting, setIsImporting] = useState(false)
    const [importStats, setImportStats] = useState<{ dps: number; pct: string } | null>(null)
    const [activeTab, setActiveTab] = useState<"personal" | "guild">("personal")
    const [overviewData, setOverviewData] = useState<OverviewSelection[]>([])
    const [loadingOverview, setLoadingOverview] = useState(false)
    useEffect(() => {
        if (!mounted) setMounted(true)
    }, [mounted])

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
            setTimeout(refreshTooltips, 2000)
        ];
        return () => timers.forEach(clearTimeout);
    }, [bosses, selections, viewMode, mounted])

    const fetchLoot = useCallback(async (forceRefresh = false) => {
        setLoading(true)
        setBosses([]) // Clear old data to avoid visual mismatch
        setRaidName("")
        try {
            let url = `/api/loot/raid?difficulty=${difficulty}${forceRefresh ? "&refresh=true" : ""}`
            if (selectedRaidId !== "default") {
                url += `&instance_id=${selectedRaidId}`
            }
            const res = await fetch(url)
            if (!res.ok) throw new Error("Failed to fetch loot")
            const data = await res.json()
            setBosses(data.bosses || [])
            setRaidName(data.instanceName || "")
            setResolvedInstanceId(data.instanceId?.toString() || "")
            if (forceRefresh) {
                toast.success("Actualizado", { description: "Loot de la raid refrescado desde Blizzard." })
            }
        } catch (e) {
            toast.error("Error", { description: "No se pudo cargar el loot de la raid." })
        } finally {
            setLoading(false)
        }
    }, [difficulty, selectedRaidId])

    const fetchSelections = useCallback(async () => {
        if (!selectedMemberId || !resolvedInstanceId) return
        setLoadingSelections(true)
        try {
            const res = await fetch(`/api/bis?member_id=${selectedMemberId}&difficulty=${difficulty}&instance_id=${resolvedInstanceId}`)
            if (!res.ok) throw new Error("Failed to fetch selections")
            setSelections(await res.json())
        } catch {
            setSelections([])
        } finally {
            setLoadingSelections(false)
        }
    }, [selectedMemberId, difficulty, resolvedInstanceId])

    const fetchOverview = useCallback(async () => {
        setLoadingOverview(true)
        try {
            const res = await fetch(`/api/bis/overview?instance_id=${resolvedInstanceId}`)
            if (res.ok) {
                const data = await res.json()
                setOverviewData(data)
            }
        } catch (e) {
            console.error("Failed to load overview:", e)
        } finally {
            setLoadingOverview(false)
        }
    }, [resolvedInstanceId])

    useEffect(() => {
        if (activeTab === "guild") {
            fetchOverview()
        }
    }, [activeTab, fetchOverview, difficulty, resolvedInstanceId])

    // Fetch loot when difficulty, member or raid changes
    useEffect(() => {
        fetchLoot()
    }, [difficulty, fetchLoot, selectedRaidId])

    useEffect(() => {
        if (selectedMemberId && resolvedInstanceId) fetchSelections()
    }, [selectedMemberId, difficulty, resolvedInstanceId, fetchSelections])

    const isSelected = (itemId: number) => selections.some(s => s.item_id === itemId)

    async function toggleItem(item: LootItem, bossName: string) {
        const existing = selections.find(s => s.item_id === item.id)

        if (existing) {
            // Remove selection
            try {
                await fetch(`/api/bis?id=${existing.id}`, { method: "DELETE" })
                setSelections(prev => prev.filter(s => s.id !== existing.id))
                toast.success("Eliminado", { description: `${item.name} eliminado de tu lista.` })
            } catch {
                toast.error("Error", { description: "No se pudo eliminar el ítem." })
            }
        } else {
            // Add selection
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
                        priority: 2,
                        difficulty,
                        instance_id: resolvedInstanceId,
                    }),
                })
                if (!res.ok) throw new Error("API error")
                const newSel = await res.json()
                setSelections(prev => {
                    // Avoid duplicates in local state
                    if (prev.some(s => s.id === newSel.id)) return prev;
                    return [...prev, newSel];
                })
                toast.success("Añadido", { description: `${item.name} añadido a tu lista BiS.` })
            } catch {
                toast.error("Error", { description: "No se pudo guardar la selección." })
            }
        }
    }

    async function handleRaidbotsImport() {
        if (!raidbotsUrl) {
            toast.error("Error", { description: "Introduce una URL de Raidbots válida." })
            return
        }
        if (!selectedMemberId) {
            toast.error("Error", { description: "Selecciona un personaje primero." })
            return
        }

        setIsImporting(true)
        try {
            const res = await fetch(`/api/raidbots?url=${encodeURIComponent(raidbotsUrl)}`)
            if (!res.ok) throw new Error(await res.text())
            const data = await res.json()

            let importedCount = 0
            const rbItems = data.items || []

            // Find matching items in the current raid loot
            for (const rbItem of rbItems) {
                // Search in all bosses
                for (const boss of bosses) {
                    const match = boss.items.find(it => it.id === rbItem.id)
                    if (match) {
                        // Check if already selected
                        if (!isSelected(match.id)) {
                            // Select it
                            await fetch("/api/bis", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    member_id: selectedMemberId,
                                    item_id: match.id,
                                    item_name: match.name,
                                    item_icon: match.icon,
                                    slot: match.slotDisplay || match.slot,
                                    boss_name: boss.name,
                                    priority: 2,
                                    difficulty,
                                    instance_id: resolvedInstanceId,
                                    dps_gain: rbItem.dpsGain,
                                    percent_gain: rbItem.percentGain,
                                    ilvl: rbItem.ilvl, // Store the item level from Raidbots
                                }),
                            })
                            importedCount++
                        }
                    }
                }
            }

            // Persistence of overall gains
            await fetch("/api/bis", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    member_id: selectedMemberId,
                    dps_gain: Math.round(data.dpsGain),
                    pct_gain: data.percentGain
                })
            })

            setImportStats({ dps: Math.round(data.dpsGain), pct: data.percentGain })

            fetchSelections() // Refresh local list

            if (importedCount > 0) {
                toast.success("Sincronización Completa", {
                    description: `Se han añadido ${importedCount} ítems del reporte (+${Math.round(data.dpsGain)} DPS).`
                })
            } else {
                toast.info("Importado", {
                    description: `Reporte leído (+${Math.round(data.dpsGain)} DPS). Los ítems ya estaban en tu lista o no son de esta banda.`
                })
            }
        } catch (e: any) {
            toast.error("Error de Importación", { description: e.message || "No se pudo leer el reporte." })
        } finally {
            setIsImporting(false)
        }
    }

    const selectedMember = eligibleMembers.find(m => m.id === selectedMemberId)

    // Filter items by selected character's class and deduplicate
    const filteredBosses = useMemo(() => {
        if (!selectedMember) return bosses
        return bosses.map(boss => {
            const seenIds = new Set<number>()
            const uniqueItems = boss.items.filter(item => {
                if (!canSpecUseItem(selectedMember.class_id, selectedMember.spec_name, item)) return false
                if (seenIds.has(item.id)) return false
                seenIds.add(item.id)
                return true
            })
            return { ...boss, items: uniqueItems }
        }).filter(boss => boss.items.length > 0)
    }, [bosses, selectedMember])

    // Map of item ID -> gains for the UI, derived from saved selections
    const rbItemGains = useMemo(() => {
        const gains: Record<number, { dps: number; pct: string }> = {}
        selections.forEach(sel => {
            if (sel.dps_gain) {
                gains[sel.item_id] = {
                    dps: Math.round(sel.dps_gain),
                    pct: sel.percent_gain || "0"
                }
            }
        })
        return gains
    }, [selections])

    // Group items by slot for slot view
    const itemsBySlot = useMemo(() => {
        const map = new Map<string, { item: LootItem; bossName: string }[]>()
        for (const boss of filteredBosses) {
            for (const item of boss.items) {
                const slot = item.slotDisplay || item.slot || "Otros"
                if (!map.has(slot)) map.set(slot, [])
                map.get(slot)!.push({ item, bossName: boss.name })
            }
        }
        // Sort slots alphabetically
        return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])))
    }, [filteredBosses])

    if (!mounted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                <p className="mt-4 text-muted-foreground animate-pulse font-medium uppercase tracking-widest text-[10px]">Cargando...</p>
            </div>
        )
    }

    if (eligibleMembers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-4">
                <IconSword className="size-12 opacity-20" />
                <p className="text-lg font-medium">No tienes personajes elegibles</p>
                <p className="text-sm max-w-md">
                    Necesitas al menos un personaje vinculado a la hermandad con rango Trial o superior.
                    Ve a <span className="text-primary">Cuenta</span> para vincular tu Battle.net.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <Script
                id="wowhead-tooltips-setup"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `window.whTooltips = { colorLinks: true, iconizeLinks: false, renameLinks: false};`,
                }}
            />

            <Script
                src="https://wow.zamimg.com/js/tooltips.js"
                strategy="lazyOnload"
            />

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Lista de Deseos BiS</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {activeTab === "personal"
                                ? (selectedRaidId === "default" ? "Loot disponible en toda las raids." : `Loot disponible en ${raidName}`)
                                : "Visión general de las necesidades de toda la hermandad para la Temporada 1."}
                        </p>
                    </div>

                    <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50">
                        <button
                            onClick={() => setActiveTab("personal")}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all rounded-md ${activeTab === "personal" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <IconUser className="size-3.5" />
                            Mi Lista
                        </button>
                        <button
                            onClick={() => setActiveTab("guild")}
                            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all rounded-md ${activeTab === "guild" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <IconUsers className="size-3.5" />
                            Visión General
                        </button>
                    </div>

                    {
                        canEdit && (
                            <Button variant="outline" size="sm" asChild className="h-8 bg-blue-500/5 text-blue-400 border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-300 gap-2">
                                <Link href="/dashboard/bis/admin">
                                    <IconSettings className="size-3.5" />
                                    Gestionar
                                </Link>
                            </Button>
                        )
                    }
                </div >
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Character Selector - Only for Personal tab */}
                    {activeTab === "personal" && (
                        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                            <SelectTrigger className="w-[180px] h-9 text-sm bg-background border-border/40">
                                <IconUser className="size-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Personaje" />
                            </SelectTrigger>
                            <SelectContent>
                                {eligibleMembers.map(m => (
                                    <SelectItem key={m.id} value={m.id}>
                                        <div className="flex items-center gap-2">
                                            <Image
                                                src={CLASS_IMAGES[m.class_id] || "/assets/images/classes/1.jpg"}
                                                alt=""
                                                width={16} height={16}
                                                className="rounded-full"
                                            />
                                            {m.character_name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {/* Raid Selector */}
                    <Select value={selectedRaidId} onValueChange={setSelectedRaidId}>
                        <SelectTrigger className="w-[220px] h-9 text-sm bg-background border-border/40">
                            <IconFilter className="size-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Seleccionar Banda" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Temporada 1 (Todas las Raids)</SelectItem>
                            <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Raids Específicas</div>
                            {MIDNIGHT_RAIDS.map(raid => (
                                <SelectItem key={raid.id} value={raid.id}>
                                    {raid.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Difficulty */}
                    <div className="flex rounded-md border overflow-hidden">
                        <button
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${difficulty === "normal" ? "bg-blue-600 text-white" : "bg-background text-muted-foreground hover:text-foreground"}`}
                            onClick={() => setDifficulty("normal")}
                        >
                            Normal
                        </button>
                        <button
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${difficulty === "heroic" ? "bg-green-600 text-white" : "bg-background text-muted-foreground hover:text-foreground"}`}
                            onClick={() => setDifficulty("heroic")}
                        >
                            Heroico
                        </button>
                        <button
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${difficulty === "mythic" ? "bg-purple-600 text-white" : "bg-background text-muted-foreground hover:text-foreground"}`}
                            onClick={() => setDifficulty("mythic")}
                        >
                            Mítico
                        </button>
                    </div>

                    {/* View Mode */}
                    <div className="flex rounded-md border overflow-hidden">
                        <button
                            className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === "slot" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
                            onClick={() => setViewMode("slot")}
                        >
                            <IconLayoutGrid className="size-3.5" /> Ranura
                        </button>
                        <button
                            className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${viewMode === "boss" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
                            onClick={() => setViewMode("boss")}
                        >
                            <IconSword className="size-3.5" /> Jefe
                        </button>
                    </div>

                    {/* Force Refresh */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-foreground border"
                        onClick={() => fetchLoot(true)}
                        disabled={loading}
                        title="Refrescar loot desde Blizzard"
                    >
                        <IconRefresh className={`size-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div >

            {activeTab === "guild" ? (
                // --- GUILD OVERVIEW TAB ---
                loadingOverview ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary/50"></div>
                        <p className="mt-4 text-muted-foreground animate-pulse font-medium uppercase tracking-widest text-[10px]">Cargando hermandad...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bosses.map((boss) => {
                            const bossItems = boss.items.filter(item => {
                                // Only show items that have at least one selector in this difficulty
                                const selectors = overviewData.filter(s => s.item_id === item.id && s.difficulty === difficulty)
                                return selectors.length > 0
                            }).sort((a, b) => {
                                // Sort items by total number of selectors or priority?
                                const selectorsA = overviewData.filter(s => s.item_id === a.id && s.difficulty === difficulty).length
                                const selectorsB = overviewData.filter(s => s.item_id === b.id && s.difficulty === difficulty).length
                                return selectorsB - selectorsA
                            })

                            if (bossItems.length === 0) return null

                            return (
                                <Card key={boss.id} className="bg-card/30 border-border/40 overflow-hidden shadow-none backdrop-blur-sm h-fit">
                                    <div className="px-4 py-2 bg-muted/20 border-b border-border/40 flex items-center justify-between">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/80">{boss.name}</h3>
                                        <Badge variant="outline" className="text-[10px] h-4 py-0 border-amber-500/10 text-amber-500/40">{bossItems.length}</Badge>
                                    </div>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-border/20">
                                            {bossItems.map(item => {
                                                // Use RAID_ILVL if we detect a raid difficulty
                                                const midnightIlvl = MIDNIGHT_S1_ILVL[difficulty.toLowerCase()] || item.itemLevel;
                                                const diffId = WOWHEAD_DIFF[difficulty] || 15;
                                                const isBis = selections.some(s => s.item_id === item.id)
                                                const g = rbItemGains[item.id]
                                                const selectors = overviewData.filter(s => s.item_id === item.id && s.difficulty === difficulty)

                                                return (
                                                    <div key={item.id} className="p-3 hover:bg-muted/5 transition-colors">
                                                        <div className="flex items-start gap-2.5 mb-2.5">
                                                            {item.icon && (
                                                                <Image
                                                                    unoptimized
                                                                    src={getIconUrl(item.icon, item.name) || ""}
                                                                    alt=""
                                                                    width={28} height={28}
                                                                    className="rounded border border-border/50 shadow-sm shrink-0"
                                                                />
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <a
                                                                    href={`https://www.wowhead.com/item=${item.id}`}
                                                                    target="_blank" rel="noreferrer"
                                                                    className={`text-xs font-bold leading-none truncate block hover:underline ${QUALITY_COLORS[item.quality] || "text-foreground"}`}
                                                                    data-wowhead={constructWowheadParams(item, difficulty)}
                                                                >
                                                                    {item.name}
                                                                </a>
                                                                <span className="text-[9px] text-muted-foreground uppercase font-medium tracking-tight mt-1 block">
                                                                    {midnightIlvl} — {item.slotDisplay || item.slot}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5 ml-1">
                                                            {selectors.map(sel => (
                                                                <div
                                                                    key={`${sel.member_id}-${item.id}`}
                                                                    className="flex items-center gap-1.5 bg-background/40 border border-border/40 rounded px-1.5 py-0.5 shadow-sm group hover:border-primary/30 transition-all"
                                                                >
                                                                    <span
                                                                        className="text-[10px] font-bold"
                                                                        style={{ color: CLASS_COLORS[sel.guild_members?.class_id || 1] || "inherit" }}
                                                                    >
                                                                        {sel.guild_members?.character_name || "Desconocido"}
                                                                    </span>
                                                                    {sel.dps_gain && (
                                                                        <span className="text-[9px] font-black text-green-400/80">
                                                                            +{Math.round(sel.dps_gain)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )
            ) : (
                <div className="flex flex-col gap-6">
                    {/* Raidbots Importer Section */}
                    <Card className="border-purple-500/20 bg-purple-500/5">
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row items-end gap-4">
                                <div className="flex-1 space-y-2 w-full">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Importar BiS desde Raidbots (Top Gear)</label>
                                    <div className="relative">
                                        <IconBolt className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-purple-400/50" />
                                        <Input
                                            placeholder="https://www.raidbots.com/simbot/report/..."
                                            value={raidbotsUrl}
                                            onChange={(e) => setRaidbotsUrl(e.target.value)}
                                            className="pl-9 h-10 border-purple-500/20 bg-background/50 focus-visible:ring-purple-500/40"
                                        />
                                    </div>
                                </div>
                                <Button
                                    onClick={handleRaidbotsImport}
                                    disabled={isImporting}
                                    className="bg-purple-600 hover:bg-purple-500 text-white gap-2 h-10 px-6 shrink-0 w-full md:w-auto"
                                >
                                    {isImporting ? <IconRefresh className="size-4 animate-spin" /> : <IconBolt className="size-4" />}
                                    {isImporting ? "Sincronizando..." : "Sincronizar BiS"}
                                </Button>
                            </div>
                            {importStats && (
                                <div className="mt-3 flex items-center gap-4 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <span className="text-muted-foreground">Mejora detectada:</span>
                                        <span className="font-bold text-green-400">+{importStats.dps} DPS</span>
                                        <Badge variant="outline" className="text-[10px] py-0 h-4 border-green-500/20 text-green-400">+{importStats.pct}%</Badge>
                                    </div>
                                    <Button variant="link" className="h-auto p-0 text-[10px] text-purple-400 h-4 gap-1" asChild>
                                        <a href={raidbotsUrl} target="_blank" rel="noreferrer">
                                            Ver reporte completo <IconExternalLink className="size-2.5" />
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {loading ? (
                        <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
                            <IconRefresh className="size-5 animate-spin" />
                            <span>Cargando loot de la raid...</span>
                        </div>
                    ) : bosses.length === 0 ? (
                        <Card>
                            <CardContent className="py-16 text-center text-muted-foreground">
                                <IconSword className="size-10 mx-auto mb-4 opacity-20" />
                                <p>No hay datos de loot disponibles.</p>
                                <p className="text-sm mt-1">Comprueba que las credenciales de Battle.net están configuradas en Ajustes.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                            {/* Main Loot Grid */}
                            <div className="space-y-6">
                                <div className="lg:hidden mb-6">
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
                                            <AccordionItem key={slotName} value={slotName} className="border border-border/40 rounded-xl px-4 bg-muted/5">
                                                <AccordionTrigger className="hover:no-underline py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-black uppercase tracking-widest text-blue-400">{slotName}</span>
                                                        <Badge variant="outline" className="text-[10px] border-blue-500/20 text-blue-400/60">{entries.length}</Badge>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-4">
                                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                        {entries.map(({ item, bossName }) => (
                                                            <LootItemCard
                                                                key={`${item.id}-${bossName}`}
                                                                item={item}
                                                                bossName={bossName}
                                                                selected={isSelected(item.id)}
                                                                onToggle={() => toggleItem(item, bossName)}
                                                                rbGain={rbItemGains[item.id]}
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
                                        {filteredBosses.map(boss => (
                                            <AccordionItem key={boss.id} value={boss.id.toString()} className="border border-border/40 rounded-xl px-4 bg-muted/5">
                                                <AccordionTrigger className="hover:no-underline py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-black uppercase tracking-widest text-amber-400">{boss.name}</span>
                                                        <Badge variant="outline" className="text-[10px] border-amber-500/20 text-amber-400/60">{boss.items.length}</Badge>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-4">
                                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                        {boss.items.map(item => (
                                                            <LootItemCard
                                                                key={item.id}
                                                                item={item}
                                                                bossName={boss.name}
                                                                selected={isSelected(item.id)}
                                                                onToggle={() => toggleItem(item, boss.name)}
                                                                rbGain={rbItemGains[item.id]}
                                                                difficulty={difficulty}
                                                                instanceId={resolvedInstanceId}
                                                            />
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                )}
                            </div>

                            {/* Sidebar: My Wishlist */}
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
                                />
                            </div>
                        </div>
                    )}
                </div>
            )
            }
        </div >
    )
}
