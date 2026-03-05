"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
    IconSword, IconShield, IconCheck, IconX, IconRefresh,
    IconListCheck, IconLayoutGrid, IconUser, IconFilter, IconSettings,
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
import { toast } from "sonner"

type EligibleMember = {
    id: string
    character_name: string
    realm_slug: string
    class_id: number
    rank: number
}

type LootItem = {
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
}

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

// Fixed item level per raid tier difficulty (Midnight Season 2)
// These are the actual base item levels for each difficulty's loot drops
const RAID_ILVL: Record<string, Record<string, number>> = {
    // Voidspire, March on Quel'Danas, Dreamwell
    "1307": { normal: 206, heroic: 219, mythic: 232 },
    "1308": { normal: 206, heroic: 219, mythic: 232 },
    "1314": { normal: 206, heroic: 219, mythic: 232 },
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
const CLASS_ARMOR: Record<number, number> = {
    1: 4, 2: 4, 6: 4,             // Warrior, Paladin, DK → Plate
    3: 3, 7: 3, 13: 3,            // Hunter, Shaman, Evoker → Mail
    4: 2, 10: 2, 11: 2, 12: 2,    // Rogue, Monk, Druid, DH → Leather
    5: 1, 8: 1, 9: 1,             // Priest, Mage, Warlock → Cloth
}

// Weapon subclass IDs each class can equip (item_class=2)
// 0=1hAxe, 1=2hAxe, 2=Bow, 3=Gun, 4=1hMace, 5=2hMace, 6=Polearm,
// 7=1hSword, 8=2hSword, 9=Warglaive, 10=Staff, 13=Fist, 15=Dagger, 18=Crossbow, 19=Wand
const CLASS_WEAPONS: Record<number, number[]> = {
    1: [0, 1, 4, 5, 6, 7, 8, 13, 15],          // Warrior
    2: [0, 1, 4, 5, 6, 7, 8],                  // Paladin
    3: [0, 1, 2, 3, 6, 7, 8, 10, 13, 15, 18],  // Hunter
    4: [0, 4, 7, 13, 15],                       // Rogue
    5: [4, 10, 15, 19],                         // Priest
    6: [0, 1, 4, 5, 6, 7, 8],                  // Death Knight
    7: [0, 1, 4, 5, 10, 13, 15],               // Shaman
    8: [7, 10, 15, 19],                         // Mage
    9: [7, 10, 15, 19],                         // Warlock
    10: [0, 4, 6, 7, 10, 13],                   // Monk
    11: [4, 5, 6, 10, 13, 15],                  // Druid
    12: [0, 7, 9, 13],                          // Demon Hunter
    13: [0, 4, 7, 10, 13, 15],                  // Evoker
}

// Classes that can use shields (armor subclass 6)
const SHIELD_CLASSES = new Set([1, 2, 7]) // Warrior, Paladin, Shaman

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

    // Other item classes (consumables, etc) → hide
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
    SHIRT: "Camisa", HAND: "Guantes", HOLDABLE: "Sostener",
    TWOHWEAPON: "Arma de 2 Manos", WEAPON: "Arma",
}

const translateSlot = (s: string) => SLOT_TRANSLATIONS[s.toUpperCase()] || s

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
    const raidIlvl = RAID_ILVL[instanceId]?.[difficulty] || null;
    const computedItemLevel = raidIlvl || item.itemLevel || null;
    const diffId = WOWHEAD_DIFF[difficulty] || 15;

    // Map blizzard icon URL to Wowhead CDN URL to avoid 403s
    const getIconUrl = (url: string | null) => {
        if (!url) return null;
        if (url.includes("render.worldofwarcraft.com")) {
            const parts = url.split("/");
            const iconName = parts[parts.length - 1]; // e.g. inv_vessel_void_01.jpg
            return `https://wow.zamimg.com/images/wow/icons/large/${iconName}`;
        }
        return url;
    };

    const iconUrl = getIconUrl(item.icon);

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
            // Use item.itemLevel if present (e.g., from Raidbots), otherwise default behavior
            data-wowhead={`item=${item.id}${item.id > 200000 ? `&domain=beta` : ""}&domain=es&diff=${diffId}${computedItemLevel ? `&ilvl=${computedItemLevel}` : ""}${item.quality && WOWHEAD_QUALITY[item.quality] ? `&qu=${WOWHEAD_QUALITY[item.quality]}` : ""}`}
            className={`
                flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all w-full no-underline
                ${selected
                    ? "border-purple-500/50 bg-purple-500/10 shadow-sm shadow-purple-500/10"
                    : "border-border/50 bg-card hover:border-border hover:bg-muted/30"
                }
            `}
        >
            {iconUrl ? (
                <Image unoptimized src={iconUrl} alt="" width={36} height={36} className="rounded border border-border/50 shadow-sm shrink-0" />
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
                <CardDescription>
                    {selectedMember ? `${selectedMember.character_name} — ${difficulty === "heroic" ? "Heroico" : "Mítico"}` : "Selecciona un personaje"}
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
                            const raidIlvl = RAID_ILVL[instanceId]?.[difficulty] || null;
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
                                    data-wowhead={`item=${sel.item_id}${sel.item_id > 200000 ? "&domain=beta" : ""}&domain=es&diff=${diffId}${computedItemLevel ? `&ilvl=${computedItemLevel}` : ""}${matchQuality && WOWHEAD_QUALITY[matchQuality] ? `&qu=${WOWHEAD_QUALITY[matchQuality]}` : ""}`}
                                    onClick={(e) => {
                                        // Prevent navigation ONLY if clicking on the delete button
                                        const isDeleteBtn = (e.target as HTMLElement).closest('button');
                                        if (isDeleteBtn) e.preventDefault();
                                    }}
                                >
                                    {(() => {
                                        const iconUrl = sel.item_icon?.includes("render.worldofwarcraft.com")
                                            ? `https://wow.zamimg.com/images/wow/icons/large/${sel.item_icon.split("/").pop()}`
                                            : sel.item_icon;

                                        return iconUrl && (
                                            <Image
                                                unoptimized
                                                src={iconUrl}
                                                alt=""
                                                width={32} height={32}
                                                className="rounded border border-border/50 shadow-sm"
                                            />
                                        );
                                    })()}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-purple-400 truncate">{sel.item_name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{sel.boss_name} · {translateSlot(sel.slot)}</p>
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
    const [rbItemGains, setRbItemGains] = useState<Record<number, { dps: number; pct: string }>>({})

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
                                }),
                            })
                            importedCount++
                        }
                    }
                }
            }

            setImportStats({ dps: Math.round(data.dpsGain), pct: data.percentGain })

            // Map item gains for the UI
            const gainsMap: Record<number, { dps: number; pct: string }> = {}
            rbItems.forEach((it: any) => {
                gainsMap[it.id] = { dps: it.dpsGain, pct: it.percentGain }
            })
            setRbItemGains(gainsMap)

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
                if (!canClassUseItem(selectedMember.class_id, item)) return false
                if (seenIds.has(item.id)) return false
                seenIds.add(item.id)
                return true
            })
            return { ...boss, items: uniqueItems }
        }).filter(boss => boss.items.length > 0)
    }, [bosses, selectedMember])

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
                    __html: `
                        window.whTooltips = { 
                            colorLinks: true, 
                            iconizeLinks: false, 
                            renameLinks: false,
                            applyToRoot: true
                        };
                    `,
                }}
            />
            <style dangerouslySetInnerHTML={{
                __html: `
                    .wowhead-tooltip {
                        background-color: rgba(15, 23, 42, 0.95) !important;
                        border: 1px solid #334155 !important;
                        border-radius: 8px !important;
                        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
                        backdrop-filter: blur(8px) !important;
                    }
                    .wowhead-tooltip-name {
                        font-size: 15px !important;
                        font-weight: 700 !important;
                    }
                `
            }} />
            <Script
                src="https://wow.zamimg.com/js/tooltips.js"
                strategy="afterInteractive"
                onLoad={() => {
                    if ((window as any).WH && (window as any).WH.Tooltips && (window as any).WH.Tooltips.init) {
                        (window as any).WH.Tooltips.init();
                    }
                }}
            />

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Lista de Deseos BiS</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {raidName ? `Loot disponible en ${raidName}` : "Selecciona los ítems que necesitas de la raid actual."}
                        </p>
                    </div>
                    {canEdit && (
                        <Button variant="outline" size="sm" asChild className="ml-4 h-8 bg-blue-500/5 text-blue-400 border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-300 gap-2">
                            <Link href="/dashboard/bis/admin">
                                <IconSettings className="size-3.5" />
                                Gestionar Listas
                            </Link>
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Character Selector */}
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

                    {/* Raid Selector */}
                    <Select value={selectedRaidId} onValueChange={setSelectedRaidId}>
                        <SelectTrigger className="w-[220px] h-9 text-sm bg-background border-border/40">
                            <IconFilter className="size-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Seleccionar Banda" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Tier Actual (Auto)</SelectItem>
                            <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 mb-1">Midnight Raids</div>
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
            </div>

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
