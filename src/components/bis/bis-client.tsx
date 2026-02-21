"use client"

import { useState } from "react"
import { IconListCheck, IconSearch, IconTrash } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type BisItem = {
    id: string
    item_name: string
    slot: string
    priority: number
}

export function BisClient({
    initialWishlist,
}: {
    initialWishlist: BisItem[]
}) {
    const [items, setItems] = useState<BisItem[]>(initialWishlist)
    // For the sake of the demo, we won't add the full POST/DELETE functionality right now, just the UI
    // Real implementation would call `/api/guild/bis` via fetch

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Lista de Deseos BiS</h1>
                    <p className="text-sm text-muted-foreground">
                        Añade los objetos que necesitas (Best-in-Slot) para facilitar el reparto de loot.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Añadir Ítem</CardTitle>
                        <CardDescription>Busca el nombre del ítem (ej. en Wowhead)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nombre del Objeto</label>
                            <Input placeholder="Ej. Ouroboros, el Mordisco de Eternidad" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ranura (Slot)</label>
                            <Input placeholder="Ej. Abalorio" />
                        </div>
                        <Button className="w-full">
                            Buscar y Añadir
                            <IconSearch className="size-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Tu Wishlist</CardTitle>
                        <CardDescription>Objetos marcados como prioridad para tu personaje</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {items.length > 0 ? (
                            <div className="space-y-2">
                                {items.map((it) => (
                                    <div key={it.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded bg-muted flex items-center justify-center border">
                                                <IconListCheck className="size-5 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-purple-400">{it.item_name}</p>
                                                <p className="text-xs text-muted-foreground">{it.slot}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={it.priority === 1 ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"}>
                                                {it.priority === 1 ? "Prioridad Alta" : "Mejora"}
                                            </Badge>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                                <IconTrash className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                                <IconListCheck className="size-10 mb-4 opacity-20" />
                                <p>Tu lista BiS está vacía.</p>
                                <p className="text-sm">Añade ítems desde el panel para que los oficiales sepan qué necesitas.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
