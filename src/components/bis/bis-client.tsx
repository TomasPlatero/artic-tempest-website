"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
    IconSword, IconShield, IconCheck, IconX, IconRefresh,
    IconListCheck, IconLayoutGrid, IconUser, IconFilter,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import Image from "next/image"
import Script from "next/script"
import { sileo } from "sileo"

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
}

const QUALITY_COLORS: Record<string, string> = {
    EPIC: "text-purple-400",
    RARE: "text-blue-400",
    LEGENDARY: "text-orange-400",
    UNCOMMON: "text-green-400",
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
    SHIRT: "Camisa",
}

const translateSlot = (s: string) => SLOT_TRANSLATIONS[s.toUpperCase()] || s

// Individual loot item card helper component
function LootItemCard({
    item,
    bossName,
    selected,
    onToggle,
}: {
    item: LootItem
    bossName: string
    selected: boolean
    onToggle: () => void
}) {
    const qualityColor = QUALITY_COLORS[item.quality] || "text-foreground"

    return (
        <a
            href={`https://www.wowhead.com/item=${item.id}`}
            target="_blank"
            rel="nofollow"
            onClick={(e) => {
                e.preventDefault()
                onToggle()
            }}
            data-wowhead={`item=${item.id}`}
            className={`
                flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all w-full no-underline
                ${selected
                    ? "border-purple-500/50 bg-purple-500/10 shadow-sm shadow-purple-500/10"
                    : "border-border/50 bg-card hover:border-border hover:bg-muted/30"
                }
            `}
        >
            {item.icon ? (
                <Image src={item.icon} alt="" width={36} height={36} className="rounded border border-border/50 shadow-sm shrink-0" />
            ) : (
                <div className="size-9 rounded bg-muted border border-border/50 flex items-center justify-center shrink-0">
                    <IconShield className="size-4 text-muted-foreground" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${qualityColor}`}>{item.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                    {item.itemLevel ? `${item.itemLevel} · ` : ""}{bossName}
                </p>
            </div>
            {selected && (
                <div className="shrink-0">
                    <IconCheck className="size-4 text-purple-400" />
                </div>
            )}
        </a>
    )
}

export function BisClient({ eligibleMembers }: { eligibleMembers: EligibleMember[] }) {
    const [selectedMemberId, setSelectedMemberId] = useState<string>(eligibleMembers[0]?.id || "")
    const [difficulty, setDifficulty] = useState<"heroic" | "mythic">("heroic")
    const [viewMode, setViewMode] = useState<"slot" | "boss">("slot")
    const [bosses, setBosses] = useState<Boss[]>([])
    const [selections, setSelections] = useState<BisSelection[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingSelections, setLoadingSelections] = useState(false)
    const [raidName, setRaidName] = useState("")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Refresh Wowhead tooltips when content changes
    useEffect(() => {
        if (typeof window !== "undefined" && (window as any).$WH && (window as any).$WH.Tooltips) {
            (window as any).$WH.Tooltips.refreshLinks();
        }
    }, [bosses, selections, viewMode])

    const fetchLoot = useCallback(async (forceRefresh = false) => {
        setLoading(true)
        try {
            const res = await fetch(`/api/loot/raid?difficulty=${difficulty}${forceRefresh ? "&refresh=true" : ""}`)
            if (!res.ok) throw new Error("Failed to fetch loot")
            const data = await res.json()
            setBosses(data.bosses || [])
            setRaidName(data.instanceName || "")
            if (forceRefresh) {
                sileo.success({ title: "Actualizado", description: "Loot de la raid refrescado desde Blizzard." })
            }
        } catch (e) {
            sileo.error({ title: "Error", description: "No se pudo cargar el loot de la raid." })
        } finally {
            setLoading(false)
        }
    }, [difficulty])

    const fetchSelections = useCallback(async () => {
        setLoadingSelections(true)
        try {
            const res = await fetch(`/api/bis?member_id=${selectedMemberId}`)
            if (!res.ok) throw new Error("Failed to fetch selections")
            setSelections(await res.json())
        } catch {
            setSelections([])
        } finally {
            setLoadingSelections(false)
        }
    }, [selectedMemberId])

    // Fetch loot when difficulty or member changes
    useEffect(() => {
        fetchLoot()
    }, [difficulty, fetchLoot])

    useEffect(() => {
        if (selectedMemberId) fetchSelections()
    }, [selectedMemberId, fetchSelections])

    if (!mounted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                <p className="mt-4 text-muted-foreground animate-pulse font-medium uppercase tracking-widest text-[10px]">Cargando...</p>
            </div>
        )
    }

    const isSelected = (itemId: number) => selections.some(s => s.item_id === itemId)

    async function toggleItem(item: LootItem, bossName: string) {
        const existing = selections.find(s => s.item_id === item.id)

        if (existing) {
            // Remove selection
            try {
                await fetch(`/api/bis?id=${existing.id}`, { method: "DELETE" })
                setSelections(prev => prev.filter(s => s.id !== existing.id))
                sileo.success({ title: "Eliminado", description: `${item.name} eliminado de tu lista.` })
            } catch {
                sileo.error({ title: "Error", description: "No se pudo eliminar el ítem." })
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
                    }),
                })
                if (!res.ok) throw new Error("API error")
                const newSel = await res.json()
                setSelections(prev => [...prev, newSel])
                sileo.success({ title: "Añadido", description: `${item.name} añadido a tu lista BiS.` })
            } catch {
                sileo.error({ title: "Error", description: "No se pudo guardar la selección." })
            }
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
                id="wowhead-tooltips"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `window.whTooltips = {colorLinks: true, iconizeLinks: true, renameLinks: true};`,
                }}
            />
            <Script
                src="https://wow.zamimg.com/js/tooltips.js"
                strategy="afterInteractive"
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Lista de Deseos BiS</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {raidName ? `Loot disponible en ${raidName}` : "Selecciona los ítems que necesitas de la raid actual."}
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Character Selector */}
                    <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                        <SelectTrigger className="w-[200px] h-9 text-sm bg-background">
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

                    {/* Difficulty */}
                    <div className="flex rounded-md border overflow-hidden">
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
                        {viewMode === "slot" ? (
                            // VIEW BY SLOT
                            [...itemsBySlot.entries()].map(([slotName, entries]) => (
                                <div key={slotName}>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                        {slotName}
                                    </h3>
                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {entries.map(({ item, bossName }) => (
                                            <LootItemCard
                                                key={`${item.id}-${bossName}`}
                                                item={item}
                                                bossName={bossName}
                                                selected={isSelected(item.id)}
                                                onToggle={() => toggleItem(item, bossName)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            // VIEW BY BOSS
                            filteredBosses.map(boss => (
                                <div key={boss.id}>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                                        {boss.name}
                                    </h3>
                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {boss.items.map(item => (
                                            <LootItemCard
                                                key={item.id}
                                                item={item}
                                                bossName={boss.name}
                                                selected={isSelected(item.id)}
                                                onToggle={() => toggleItem(item, boss.name)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Sidebar: My Wishlist */}
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
                                    {selections.map(sel => (
                                        <a
                                            key={sel.id}
                                            href={`https://www.wowhead.com/item=${sel.item_id}`}
                                            target="_blank"
                                            rel="nofollow"
                                            className="flex items-center gap-2.5 p-2 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors group no-underline"
                                            data-wowhead={`item=${sel.item_id}`}
                                            onClick={(e) => {
                                                // Prevent navigation if clicking on anything EXCEPT the delete button
                                                const isDeleteBtn = (e.target as HTMLElement).closest('button');
                                                if (!isDeleteBtn) e.preventDefault();
                                            }}
                                        >
                                            {sel.item_icon && (
                                                <Image
                                                    src={sel.item_icon}
                                                    alt=""
                                                    width={32} height={32}
                                                    className="rounded border border-border/50 shadow-sm"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-purple-400 truncate">{sel.item_name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{sel.boss_name} · {translateSlot(sel.slot)}</p>
                                            </div>
                                            <button
                                                className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 rounded p-1 transition-all"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await fetch(`/api/bis?id=${sel.id}`, { method: "DELETE" })
                                                    setSelections(prev => prev.filter(s => s.id !== sel.id))
                                                }}
                                            >
                                                <IconX className="size-3.5" />
                                            </button>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
