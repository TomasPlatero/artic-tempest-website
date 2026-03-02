"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
    IconSword, IconSearch, IconUser, IconListCheck,
    IconChevronRight, IconRefresh, IconArrowLeft,
    IconExternalLink,
    IconTrophy
} from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { MIDNIGHT_RAIDS } from "@/infrastructure/constants/raids"
import Image from "next/image"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"
import { toast } from "sonner"

type MemberSummary = {
    id: string
    character_name: string
    class_id: number
    rank: number
    realm_slug: string
    selection_count: number
}

type BisSelection = {
    id: string
    item_id: number
    item_name: string
    item_icon: string | null
    slot: string
    boss_name: string | null
    difficulty: string
    instance_id: number
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

const DEFAULT_RANK_NAMES: Record<number, string> = {
    0: "GM", 1: "Oficial", 2: "Alt Oficial", 3: "RL",
    4: "Artic", 5: "Raider", 6: "Trial", 7: "Alt",
    8: "Backup", 9: "Social"
}

export function BisAdminClient() {
    const [members, setMembers] = useState<MemberSummary[]>([])
    const [rankConfigs, setRankConfigs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedMember, setSelectedMember] = useState<MemberSummary | null>(null)
    const [selections, setSelections] = useState<BisSelection[]>([])
    const [loadingSelections, setLoadingSelections] = useState(false)
    const [instanceId, setInstanceId] = useState<string>("0")
    const [difficulty, setDifficulty] = useState<string>("all")

    const rankNames = useMemo(() => {
        const names = { ...DEFAULT_RANK_NAMES }
        rankConfigs.forEach(r => {
            if (r.name) names[r.rank] = r.name
        })
        return names
    }, [rankConfigs])

    const fetchMembers = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/bis/admin")
            if (!res.ok) throw new Error("Failed to fetch")
            const data = await res.json()
            setMembers(data.members)
            setRankConfigs(data.ranks)
        } catch (error) {
            toast.error("Error", { description: "No se pudo cargar el resumen de listas." })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchMembers()
    }, [fetchMembers])

    const fetchMemberSelections = useCallback(async (member: MemberSummary) => {
        setLoadingSelections(true)
        setSelectedMember(member)
        try {
            let url = `/api/bis/admin?member_id=${member.id}`
            if (instanceId !== "0") url += `&instance_id=${instanceId}`
            if (difficulty !== "all") url += `&difficulty=${difficulty}`

            const res = await fetch(url)
            if (!res.ok) throw new Error("Failed to fetch")
            setSelections(await res.json())
        } catch (error) {
            toast.error("Error", { description: "No se pudo cargar la lista del personaje." })
        } finally {
            setLoadingSelections(false)
        }
    }, [instanceId, difficulty])

    // Refresh selections when filters change
    useEffect(() => {
        if (selectedMember) {
            fetchMemberSelections(selectedMember)
        }
    }, [selectedMember, fetchMemberSelections])

    const filteredMembers = useMemo(() => {
        return members.filter(m =>
            m.character_name.toLowerCase().includes(search.toLowerCase())
        ).sort((a, b) => {
            if (b.selection_count !== a.selection_count) return b.selection_count - a.selection_count
            return a.rank - b.rank
        })
    }, [members, search])

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-[350px_1fr] gap-6 lg:h-[calc(100vh-180px)]">
            {/* Sidebar: Member List */}
            <Card className="flex flex-col overflow-hidden border-border/40 bg-card/30 backdrop-blur-sm h-[350px] lg:h-auto shrink-0">
                <CardHeader className="p-4 space-y-4 border-b border-border/40">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <IconUser className="size-4 text-primary" />
                            Personajes
                        </CardTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchMembers} disabled={loading}>
                            <IconRefresh className={cn("size-4", loading && "animate-spin")} />
                        </Button>
                    </div>
                    <div className="relative">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar personaje..."
                            className="pl-9 h-9 bg-black/20 border-border/40"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <div className="flex-1 overflow-y-auto">
                    <div className="p-2 space-y-1">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-14 w-full bg-muted/20 animate-pulse rounded-lg" />
                            ))
                        ) : filteredMembers.map(m => (
                            <button
                                key={m.id}
                                onClick={() => fetchMemberSelections(m)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group",
                                    selectedMember?.id === m.id
                                        ? "bg-primary/10 border border-primary/20"
                                        : "hover:bg-muted/50 border border-transparent"
                                )}
                            >
                                <div className="relative size-10 flex-shrink-0">
                                    <Image
                                        src={CLASS_IMAGES[m.class_id] || "/assets/images/classes/1.jpg"}
                                        alt="" fill className="object-cover rounded-md border border-white/5 shadow-lg"
                                    />
                                    <div className="absolute -bottom-1 -right-1 size-4 bg-background rounded-full border border-border/50 flex items-center justify-center">
                                        <span className="text-[8px] font-bold">{m.rank}</span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                                        {m.character_name}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">
                                        {rankNames[m.rank] || "???"} · {m.realm_slug}
                                    </p>
                                </div>
                                <div className="text-right">
                                    {m.selection_count > 0 ? (
                                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-black">
                                            {m.selection_count}
                                        </Badge>
                                    ) : (
                                        <div className="text-[10px] text-muted-foreground/30 font-black">-</div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Main Area: Selection List */}
            <div className="flex flex-col gap-6 lg:overflow-hidden min-h-[500px] lg:min-h-0 lg:h-full">
                {!selectedMember ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground bg-card/10 border border-dashed border-border/40 rounded-2xl">
                        <IconListCheck className="size-16 opacity-10 mb-6" />
                        <h3 className="text-xl font-bold text-foreground">Gestión de Listas BiS</h3>
                        <p className="max-w-md mx-auto mt-2 text-sm">
                            Selecciona un personaje de la lista de la izquierda para visualizar su lista de deseos completa.
                        </p>
                    </div>
                ) : (
                    <Card className="flex flex-col h-full border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="p-6 border-b border-border/40 bg-muted/5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative size-14 shadow-2xl">
                                        <Image
                                            src={CLASS_IMAGES[selectedMember.class_id] || "/assets/images/classes/1.jpg"}
                                            alt="" fill className="object-cover rounded-xl border border-white/10"
                                        />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                                            {selectedMember.character_name}
                                            <Badge className="bg-primary/20 text-primary border-primary/20 font-black italic">
                                                {rankNames[selectedMember.rank] || "???"}
                                            </Badge>
                                        </h2>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                                            {selectedMember.realm_slug} · {selections.length} ítems seleccionados
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select value={instanceId} onValueChange={setInstanceId}>
                                        <SelectTrigger className="w-[180px] h-9 bg-background/50 text-[10px] font-black uppercase">
                                            <SelectValue placeholder="Banda" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0" className="text-[10px] font-bold uppercase">Todas las Bandas</SelectItem>
                                            {MIDNIGHT_RAIDS.map(r => (
                                                <SelectItem key={r.id} value={r.id} className="text-[10px] font-bold uppercase">{r.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={difficulty} onValueChange={setDifficulty}>
                                        <SelectTrigger className="w-[120px] h-9 bg-background/50 text-[10px] font-black uppercase">
                                            <SelectValue placeholder="Dificultad" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all" className="text-[10px] font-bold uppercase">Todas</SelectItem>
                                            <SelectItem value="heroic" className="text-[10px] font-bold uppercase">Heroico</SelectItem>
                                            <SelectItem value="mythic" className="text-[10px] font-bold uppercase">Mítico</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-hidden">
                            {loadingSelections ? (
                                <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                    <IconRefresh className="size-8 animate-spin text-primary/50" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Cargando lista...</p>
                                </div>
                            ) : selections.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                                    <IconSword className="size-12 opacity-10 mb-4" />
                                    <p className="text-sm font-medium">Este personaje aún no tiene ningún ítem seleccionado para los filtros actuales.</p>
                                </div>
                            ) : (
                                <div className="h-full overflow-y-auto">
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                                        {selections.map(sel => (
                                            <Card key={sel.id} className="group relative overflow-hidden border-border/40 bg-card hover:border-primary/40 transition-all">
                                                <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={`https://www.wowhead.com/item=${sel.item_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="size-6 bg-primary/10 rounded flex items-center justify-center text-primary"
                                                    >
                                                        <IconExternalLink className="size-3" />
                                                    </a>
                                                </div>
                                                <div className="p-4 flex items-center gap-4">
                                                    <div className="size-12 relative rounded-lg overflow-hidden border border-white/5 shadow-xl shrink-0">
                                                        {sel.item_icon ? (
                                                            <Image src={sel.item_icon} alt="" fill className="object-cover" />
                                                        ) : (
                                                            <div className="size-12 bg-muted flex items-center justify-center">
                                                                <IconSword className="size-6 text-muted-foreground/30" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-purple-400 truncate leading-none">
                                                            {sel.item_name}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight mt-1.5 flex items-center gap-1.5">
                                                            <span>{sel.slot}</span>
                                                            <span className="size-1 bg-muted-foreground/20 rounded-full" />
                                                            <span className={cn(
                                                                "px-1 rounded-[2px]",
                                                                sel.difficulty === 'mythic' ? "text-purple-400 bg-purple-400/10" : "text-green-500 bg-green-500/10"
                                                            )}>
                                                                {sel.difficulty === 'mythic' ? 'Mítico' : 'Heroico'}
                                                            </span>
                                                        </p>
                                                        <p className="text-[9px] text-muted-foreground/60 truncate mt-1">
                                                            {sel.boss_name || "Desconocido"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
