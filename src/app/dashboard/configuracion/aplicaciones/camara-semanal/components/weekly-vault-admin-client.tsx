"use client"

import React, { useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent } from "@/shared/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Button } from "@/shared/ui/button"
import { IconExternalLink, IconTrash, IconChevronLeft, IconChevronRight, IconArrowsSort, IconSortAscending, IconSortDescending } from "@tabler/icons-react"
import { toast } from "sonner"

export function getWowColorClass(classId: number): string {
    const classColors: Record<number, string> = {
        1: "text-[#C79C6E]", // Warrior
        2: "text-[#F58CBA]", // Paladin
        3: "text-[#ABD473]", // Hunter
        4: "text-[#FFF569]", // Rogue
        5: "text-[#FFFFFF]", // Priest
        6: "text-[#C41E3A]", // Death Knight
        7: "text-[#0070DE]", // Shaman
        8: "text-[#69CCF0]", // Mage
        9: "text-[#9482C9]", // Warlock
        10: "text-[#00FF96]", // Monk
        11: "text-[#FF7D0A]", // Druid
        12: "text-[#A330C9]", // Demon Hunter
        13: "text-[#33937F]", // Evoker
    };
    return classColors[classId] || "text-foreground";
}

type Upload = {
    id: string
    created_at: string
    week_start: string
    image_url: string
    guild_rank_name?: string
    guild_rank_level?: number
    profiles: { discord_username: string; discord_avatar: string } | null
    bnet_characters: { name: string; class_id: number; realm_slug: string } | null
}

interface Props {
    initialUploads: any[]
}

export function WeeklyVaultAdminClient({ initialUploads }: Props) {
    const [uploads, setUploads] = useState<Upload[]>(initialUploads as Upload[])
    const [selectedWeek, setSelectedWeek] = useState<string>("all")
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({
        key: 'created_at',
        direction: 'desc'
    })

    const ITEMS_PER_PAGE = 10

    // Extract unique weeks
    const uniqueWeeks = useMemo(() => {
        const weeks = new Set<string>()
        uploads.forEach((u) => weeks.add(u.week_start))
        return Array.from(weeks).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    }, [uploads])

    // Filter uploads
    const filteredUploads = useMemo(() => {
        let result = [...uploads]
        
        if (selectedWeek !== "all") {
            result = result.filter((u) => u.week_start === selectedWeek)
        }

        // Apply sorting
        if (sortConfig.key && sortConfig.direction) {
            result.sort((a, b) => {
                let valA: string = ""
                let valB: string = ""

                switch (sortConfig.key) {
                    case 'character':
                        valA = a.bnet_characters?.name || ""
                        valB = b.bnet_characters?.name || ""
                        break
                    case 'player':
                        valA = a.profiles?.discord_username || ""
                        valB = b.profiles?.discord_username || ""
                        break
                    case 'rank':
                        // Use the numeric rank level directly. Lower number (GM=0) = Higher importance
                        // We convert to string for the common comparison logic below, 
                        // but we need to pad it to ensure numeric sorting works correctly via string comparison
                        valA = (a.guild_rank_level !== undefined ? a.guild_rank_level : 99).toString().padStart(3, '0')
                        valB = (b.guild_rank_level !== undefined ? b.guild_rank_level : 99).toString().padStart(3, '0')
                        break
                    case 'created_at':
                        valA = a.created_at
                        valB = b.created_at
                        break
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }

        return result
    }, [uploads, selectedWeek, sortConfig])

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current.key === key) {
                if (current.direction === 'asc') return { key, direction: 'desc' }
                if (current.direction === 'desc') return { key: 'created_at', direction: 'desc' }
            }
            return { key, direction: 'asc' }
        })
    }

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <IconArrowsSort className="size-3.5 opacity-30" />
        return sortConfig.direction === 'asc' 
            ? <IconSortAscending className="size-3.5 text-blue-400" /> 
            : <IconSortDescending className="size-3.5 text-blue-400" />
    }

    // Reset page when filter changes
    React.useEffect(() => {
        setCurrentPage(1)
    }, [selectedWeek])

    // Calculate pagination
    const totalPages = Math.max(1, Math.ceil(filteredUploads.length / ITEMS_PER_PAGE))
    const paginatedUploads = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
        return filteredUploads.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    }, [filteredUploads, currentPage])

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que quieres borrar esta captura? Esta acción no se puede deshacer.")) return

        setIsDeleting(id)
        try {
            const res = await fetch(`/api/weekly-vault?id=${id}`, {
                method: "DELETE",
            })
            if (!res.ok) throw new Error("Error borrando la captura")

            setUploads((prev) => prev.filter((u) => u.id !== id))
            toast.success("Captura borrada")
        } catch (error: any) {
            toast.error(error.message || "Ha ocurrido un error")
        } finally {
            setIsDeleting(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-card text-card-foreground p-4 rounded-xl border border-white/10 shadow-sm gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="font-semibold text-lg">Filtro por Semana</h2>
                    <p className="text-sm text-muted-foreground">Selecciona qué semana de reset quieres revisar.</p>
                </div>
                <div className="w-full sm:w-[280px]">
                    <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                        <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Todas las semanas" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las semanas</SelectItem>
                            {uniqueWeeks.map((week) => (
                                <SelectItem key={week} value={week}>
                                    Semana del {format(parseISO(week), "d 'de' MMMM, yyyy", { locale: es })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {filteredUploads.length === 0 ? (
                <div className="text-center py-24 bg-card/50 rounded-xl border border-dashed border-white/10">
                    <p className="text-muted-foreground">No hay capturas subidas para esta semana.</p>
                </div>
            ) : (
                <>
                    {/* Desktop View */}
                    <div className="hidden md:block rounded-xl border border-white/10 bg-card/60 backdrop-blur-sm overflow-hidden shadow-xl">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white/5 text-muted-foreground text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Captura</th>
                                    <th 
                                        className="px-4 py-3 font-medium cursor-pointer hover:bg-white/5 transition-colors group/sort"
                                        onClick={() => handleSort('character')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Personaje
                                            {getSortIcon('character')}
                                        </div>
                                    </th>
                                    <th 
                                        className="px-4 py-3 font-medium cursor-pointer hover:bg-white/5 transition-colors group/sort"
                                        onClick={() => handleSort('player')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Jugador
                                            {getSortIcon('player')}
                                        </div>
                                    </th>
                                    <th 
                                        className="px-4 py-3 font-medium cursor-pointer hover:bg-white/5 transition-colors group/sort"
                                        onClick={() => handleSort('rank')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Rango
                                            {getSortIcon('rank')}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 font-medium">Subida el</th>
                                    <th className="px-4 py-3 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedUploads.map((upload) => (
                                    <tr key={upload.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-3 w-32">
                                            <a
                                                href={upload.image_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block w-24 h-16 rounded overflow-hidden border border-white/10 shrink-0 relative"
                                            >
                                                <img
                                                    src={upload.image_url}
                                                    alt="Vault"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <IconExternalLink className="size-5 text-white drop-shadow-md" />
                                                </div>
                                            </a>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`font-bold text-base ${upload.bnet_characters ? getWowColorClass(upload.bnet_characters.class_id) : "text-foreground"}`}>
                                                {upload.bnet_characters?.name || "Borrado"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {upload.profiles?.discord_avatar ? (
                                                    <img
                                                        src={upload.profiles.discord_avatar}
                                                        alt="Avatar"
                                                        className="size-6 rounded-full bg-white/10 shrink-0"
                                                    />
                                                ) : (
                                                    <div className="size-6 rounded-full bg-white/10 shrink-0" />
                                                )}
                                                <span className="font-medium text-white/80">
                                                    {upload.profiles?.discord_username || "Desconocido"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground font-medium">
                                            {upload.guild_rank_name && upload.guild_rank_name !== "Alter/Desconocido" ? (
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 px-2 py-1 rounded border border-white/5 text-muted-foreground/90">
                                                    {upload.guild_rank_name}
                                                </span>
                                            ) : (
                                                <span className="text-xs opacity-30 italic">Sin rango</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                            {format(new Date(upload.created_at), "dd/MM/yyyy HH:mm")}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => window.open(upload.image_url, '_blank')}
                                                >
                                                    Ver
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDelete(upload.id)}
                                                    disabled={isDeleting === upload.id}
                                                >
                                                    <IconTrash className="size-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                        {paginatedUploads.map((upload) => (
                            <Card key={upload.id} className="overflow-hidden bg-white/5 border-white/10 group shadow-sm hover:shadow-md transition-shadow p-0">
                                <a
                                    href={upload.image_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block w-full h-28 overflow-hidden border-b border-white/10 shrink-0 relative"
                                >
                                    <img
                                        src={upload.image_url}
                                        alt="Vault"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <IconExternalLink className="size-8 text-white drop-shadow-lg" />
                                    </div>
                                </a>
                                <CardContent className="p-3.5 flex items-center justify-between gap-3">
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {upload.profiles?.discord_avatar ? (
                                                <img
                                                    src={upload.profiles.discord_avatar}
                                                    alt="Avatar"
                                                    className="size-5 rounded-full bg-white/10 shrink-0"
                                                />
                                            ) : (
                                                <div className="size-5 rounded-full bg-white/10 shrink-0" />
                                            )}
                                            <span className="text-xs font-semibold text-white/90 truncate">
                                                {upload.profiles?.discord_username || "Desconocido"}
                                            </span>
                                            <span className="text-muted-foreground/30 text-[10px]">•</span>
                                            <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                                                {format(new Date(upload.created_at), "dd/MM/yyyy HH:mm")}
                                            </span>
                                        </div>
                                        
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold text-lg leading-tight ${upload.bnet_characters ? getWowColorClass(upload.bnet_characters.class_id) : "text-foreground"} truncate`}>
                                                    {upload.bnet_characters?.name || "Borrado"}
                                                </span>
                                                {upload.guild_rank_name && upload.guild_rank_name !== "Alter/Desconocido" && (
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                                        {upload.guild_rank_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        size="icon" 
                                        variant="destructive" 
                                        className="h-10 w-10 shrink-0 rounded-xl"
                                        onClick={() => handleDelete(upload.id)} 
                                        disabled={isDeleting === upload.id}
                                    >
                                        <IconTrash className="size-5" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-card/60 backdrop-blur-sm p-4 rounded-xl border border-white/10 shadow-sm">
                            <span className="text-sm text-muted-foreground text-center sm:text-left">
                                Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredUploads.length)} de {filteredUploads.length} capturas
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="size-8 rounded-lg"
                                >
                                    <IconChevronLeft className="size-4" />
                                </Button>
                                <div className="flex items-center justify-center min-w-[40px] text-sm font-medium">
                                    {currentPage} / {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="size-8 rounded-lg"
                                >
                                    <IconChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
