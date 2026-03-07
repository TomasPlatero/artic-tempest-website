"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FAMOUS_ICON_PACKS, ALL_ICONS_MAP } from "@/lib/icons-list"
import { IconSearch, IconCircle } from "@tabler/icons-react"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"

interface IconPickerProps {
    value: string
    onSelect: (value: string) => void
}

export function IconPicker({ value, onSelect }: IconPickerProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const [selectedPack, setSelectedPack] = React.useState(FAMOUS_ICON_PACKS[0].name)
    const [page, setPage] = React.useState(1)
    const ITEMS_PER_PAGE = 48

    // Reset page when search or pack changes
    React.useEffect(() => {
        setPage(1)
    }, [search, selectedPack])

    const CurrentIcon = ALL_ICONS_MAP[value] || IconCircle

    const filteredPacks = FAMOUS_ICON_PACKS.map(pack => {
        const filtered = pack.icons.filter(icon => {
            const fullName = (pack.prefix + icon).toLowerCase()
            const searchLower = search.toLowerCase()
            return fullName.includes(searchLower) || icon.toLowerCase().includes(searchLower)
        })

        return {
            ...pack,
            total: filtered.length,
            icons: filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
        }
    })

    const currentFilteredPack = filteredPacks.find(p => p.name === selectedPack)
    const totalPages = Math.ceil((currentFilteredPack?.total || 0) / ITEMS_PER_PAGE)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-12 bg-white/5 border-white/10 hover:bg-white/10 transition-all px-4"
                >
                    <CurrentIcon className="size-5 text-primary" />
                    <span className="truncate text-sm font-medium">
                        {value || "Seleccionar icono..."}
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-zinc-950 border-white/10 p-0 overflow-hidden rounded-[2rem] flex flex-col h-[80vh]">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">Seleccionar Icono</DialogTitle>
                </DialogHeader>

                <div className="px-6 pb-2 space-y-4">
                    <div className="relative">
                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar entre miles de iconos..."
                            className="bg-white/5 border-white/10 pl-10 h-11 rounded-xl"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <Tabs value={selectedPack} onValueChange={setSelectedPack} className="w-full">
                        <TabsList className="bg-white/5 border border-white/5 p-1 rounded-xl h-11 w-full">
                            {FAMOUS_ICON_PACKS.map(pack => (
                                <TabsTrigger
                                    key={pack.name}
                                    value={pack.name}
                                    className="flex-1 rounded-lg font-bold text-[10px] uppercase tracking-widest px-4 h-9 data-[state=active]:bg-primary data-[state=active]:text-zinc-950"
                                >
                                    {pack.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
                    {filteredPacks.map(pack => (
                        selectedPack === pack.name && (
                            <div key={pack.name} className="space-y-4 py-2">
                                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                    {pack.icons.length === 0 ? (
                                        <div className="col-span-full py-12 text-center text-muted-foreground text-xs uppercase tracking-widest font-bold">
                                            No se encontraron iconos
                                        </div>
                                    ) : (
                                        pack.icons.map(iconName => {
                                            const fullId = pack.prefix + iconName
                                            const IconComp = ALL_ICONS_MAP[fullId]
                                            return (
                                                <button
                                                    key={fullId}
                                                    onClick={() => {
                                                        onSelect(fullId)
                                                        setOpen(false)
                                                    }}
                                                    className={cn(
                                                        "group flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:scale-110",
                                                        value === fullId
                                                            ? "bg-primary border-primary text-zinc-950 ring-4 ring-primary/20"
                                                            : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10 hover:text-white"
                                                    )}
                                                    title={iconName}
                                                >
                                                    {IconComp && <IconComp className="size-6 transition-transform group-hover:rotate-6" />}
                                                </button>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        )
                    ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-3 bg-white/5 border-t border-white/5 flex items-center justify-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="uppercase text-[10px] font-black tracking-widest"
                        >
                            Anterior
                        </Button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Página {page} de {totalPages}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="uppercase text-[10px] font-black tracking-widest"
                        >
                            Siguiente
                        </Button>
                    </div>
                )}

                <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <CurrentIcon className="size-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black text-white/40 tracking-wider leading-none mb-1">Seleccionado</span>
                            <span className="text-sm font-bold text-white max-w-[200px] truncate">{value || "Ninguno"}</span>
                        </div>
                    </div>
                    <div className="text-[9px] uppercase font-black text-muted-foreground/40 tabular-nums">
                        {currentFilteredPack?.total || 0} TOTAL
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
