"use client"

import { Button } from "@/components/ui/button"
import { IconRefresh, IconCheck, IconX, IconDeviceGamepad, IconChevronLeft, IconChevronRight, IconUnlink } from "@tabler/icons-react"
import { useState } from "react"
import Image from "next/image"
import { sileo } from "sileo"

type Character = {
    id: string
    name: string
    realm: string
    realm_slug: string
    class_id: number
    level: number
    faction: string
}

type AccountClientProps = {
    battletag: string | null
    characters: Character[]
}

export function AccountClient({ battletag, characters }: AccountClientProps) {
    const [refreshing, setRefreshing] = useState(false)
    const [unlinking, setUnlinking] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)

    const itemsPerPage = 10
    const totalPages = Math.max(1, Math.ceil(characters.length / itemsPerPage))
    const currentCharacters = characters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handleLinkAccount = () => {
        window.location.href = "/api/bnet/auth"
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        // Redirige al flujo de login pasivo para renovar token y re-escanear pjs
        window.location.href = "/api/bnet/auth"
    }

    const handleUnlink = async () => {
        if (!confirm("¿Estás seguro de desvincular tu cuenta de Battle.net? Esto borrará tus personajes importados de GuildBoard.")) return

        setUnlinking(true)
        try {
            const res = await fetch("/api/bnet/unlink", { method: "DELETE" })
            const data = await res.json()
            if (res.ok) {
                sileo.success({ title: "Cuenta desvinculada", description: "Tus personajes han sido eliminados del sistema." })
                window.location.href = "/dashboard/cuenta?success=unlinked"
            } else {
                sileo.error({ title: "Error", description: data.error || "No se pudo desvincular." })
            }
        } catch {
            sileo.error({ title: "Error", description: "Problema de conexión con el servidor." })
        } finally {
            setUnlinking(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Cuentas vinculadas</h2>
                    <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-col gap-3">
                        <p className="text-sm text-muted-foreground">
                            Para poder interactuar con tu equipo necesitas tener tus personajes vinculados a tu cuenta.
                        </p>
                        <div className="space-y-3">
                            {battletag ? (
                                <div className="border rounded-md overflow-hidden shadow-sm bg-background/40">
                                    <div className="flex items-center justify-between p-3 border-b bg-muted/20">
                                        <div className="flex items-center gap-2">
                                            <IconDeviceGamepad className="size-4 text-[#00aeff]" />
                                            <span className="text-sm font-medium">Battle.net</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                            <IconCheck className="size-3 text-emerald-500" />
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Activo</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-muted/5 group">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/50 leading-none mb-1">Cuenta Vinculada</span>
                                            <span className="text-sm font-semibold truncate text-foreground/90" title={battletag}>
                                                {battletag}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                                            onClick={handleUnlink}
                                            disabled={unlinking}
                                            title="Desvincular cuenta"
                                        >
                                            {unlinking ? <IconRefresh className="size-4 animate-spin" /> : <IconUnlink className="size-4" />}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between border rounded-md p-3 bg-muted/30">
                                    <span className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                        <IconDeviceGamepad className="size-4 grayscale opacity-50" />
                                        Battle.net
                                    </span>
                                    <div className="flex items-center gap-2 text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                                        <IconX className="size-3" />
                                        No vinculado
                                    </div>
                                </div>
                            )}
                        </div>
                        {!battletag && (
                            <Button className="w-full bg-[#00aeff] hover:bg-[#00aeff]/90 text-white" onClick={handleLinkAccount}>
                                Vincular cuenta
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Personajes de la cuenta (EU)</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Si falta algún personaje, puedes usar el botón de refrescar para actualizar la lista.
                        </p>
                    </div>
                    {battletag && (
                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                            <IconRefresh className={`size-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                            Refrescar
                        </Button>
                    )}
                </div>

                <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-left font-semibold p-3 w-[60%]">Nombre</th>
                                <th className="font-semibold p-3 w-[40%] text-right">Reino</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentCharacters.length > 0 ? (
                                currentCharacters.map((c) => (
                                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    src={`/assets/images/classes/${c.class_id}.jpg`}
                                                    alt="Clase"
                                                    width={24} height={24}
                                                    className="rounded-full shadow-inner border border-border/50"
                                                />
                                                <span className="font-medium">{c.name}</span>
                                                <span className="text-xs text-muted-foreground ml-2">Nvl {c.level}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-right text-muted-foreground">
                                            {c.realm}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="p-8 text-center text-muted-foreground">
                                        {battletag
                                            ? "No se han encontrado personajes en esta cuenta."
                                            : "Debes vincular tu cuenta de Battle.net para ver tus personajes."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && characters.length > 0 && (
                    <div className="flex items-center justify-between pt-2">
                        <span className="text-sm text-muted-foreground ml-2">
                            Mostrando {currentCharacters.length} de {characters.length} personajes (Página {currentPage} / {totalPages})
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                <IconChevronLeft className="size-4 mr-1" />
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Siguiente
                                <IconChevronRight className="size-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    )
}
