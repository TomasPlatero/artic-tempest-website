"use client"

import { Button } from "@/shared/ui/button"
import {
    IconRefresh,
    IconCheck,
    IconX,
    IconDeviceGamepad,
    IconChevronLeft,
    IconChevronRight,
    IconUnlink,
    IconTrash,
    IconAlertTriangle
} from "@tabler/icons-react"
import { useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { signOut } from "next-auth/react"

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
    const [deleting, setDeleting] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)

    const itemsPerPage = 10
    const totalPages = Math.max(1, Math.ceil(characters.length / itemsPerPage))
    const currentCharacters = characters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handleLinkAccount = () => {
        window.location.href = "/api/bnet/auth"
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        window.location.href = "/api/bnet/auth"
    }

    const handleUnlink = async () => {
        if (!confirm("¿Estás seguro de desvincular tu cuenta de Battle.net? Esto borrará tus personajes importados de GuildBoard.")) return

        setUnlinking(true)
        try {
            const res = await fetch("/api/bnet/unlink", { method: "DELETE" })
            const data = await res.json()
            if (res.ok) {
                toast.success("Cuenta desvinculada", { description: "Tus personajes han sido eliminados del sistema." })
                window.location.href = window.location.pathname + "?success=unlinked"
            } else {
                toast.error("Error", { description: data.error || "No se pudo desvincular." })
            }
        } catch {
            toast.error("Error", { description: "Problema de conexión con el servidor." })
        } finally {
            setUnlinking(false)
        }
    }

    const handleDeleteAccount = async () => {
        const confirm1 = confirm("¡ATENCIÓN! Estás a punto de borrar permanentemente tu cuenta de GuildBoard.")
        if (!confirm1) return

        const confirm2 = confirm("Esto eliminará TODOS tus datos: perfil, vinculaciones de Battle.net, personajes importados y solicitudes de reclutamiento. Esta acción NO se puede deshacer.\n\n¿Quieres continuar?")
        if (!confirm2) return

        setDeleting(true)
        try {
            const res = await fetch("/api/account/delete", { method: "DELETE" })
            if (res.ok) {
                toast.success("Cuenta eliminada", { description: "Se han borrado todos tus datos. Redirigiendo..." })
                setTimeout(() => signOut({ callbackUrl: "/" }), 2000)
            } else {
                const data = await res.json()
                toast.error("Error", { description: data.error || "No se pudo borrar la cuenta." })
            }
        } catch {
            toast.error("Error", { description: "Problema de conexión con el servidor." })
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
            <div className="flex flex-col gap-6">
                <div>
                    <h2 className="text-xl font-semibold mb-4 uppercase tracking-tight text-white/90">Cuentas vinculadas</h2>
                    <div className="bg-zinc-950/50 border border-white/10 rounded-2xl p-6 shadow-sm flex flex-col gap-4 backdrop-blur-sm">
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Para poder interactuar con las herramientas de reclutamiento y calendario, necesitas vincular tus personajes.
                        </p>
                        <div className="space-y-3">
                            {battletag ? (
                                <div className="border border-white/10 rounded-xl overflow-hidden shadow-sm bg-black/40">
                                    <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5">
                                        <div className="flex items-center gap-2">
                                            <IconDeviceGamepad className="size-4 text-[#00aeff]" />
                                            <span className="text-xs font-bold uppercase tracking-tight text-white/80">Battle.net</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                            <IconCheck className="size-3 text-emerald-500" />
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tight">Activo</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 group">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[9px] uppercase tracking-wider font-black text-white/20 leading-none mb-1">BattleTag</span>
                                            <span className="text-sm font-bold truncate text-white/90" title={battletag}>
                                                {battletag}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                                            onClick={handleUnlink}
                                            disabled={unlinking}
                                            title="Desvincular cuenta"
                                        >
                                            {unlinking ? <IconRefresh className="size-4 animate-spin" /> : <IconUnlink className="size-4" />}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between border border-white/5 rounded-xl p-3 bg-white/5">
                                    <span className="text-xs font-bold uppercase tracking-tight flex items-center gap-2 text-zinc-500">
                                        <IconDeviceGamepad className="size-4 grayscale opacity-30" />
                                        Battle.net
                                    </span>
                                    <div className="flex items-center gap-2 text-[9px] font-black text-orange-500/70 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20 uppercase tracking-widest">
                                        No vinculado
                                    </div>
                                </div>
                            )}
                        </div>
                        {!battletag && (
                            <Button
                                variant="glow"
                                className="w-full text-[10px] font-black uppercase tracking-widest"
                                onClick={handleLinkAccount}
                            >
                                Vincular cuenta
                            </Button>
                        )}
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-4 border-t border-white/5">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-red-500/50 mb-4 px-2">Zona de Peligro</h2>
                    <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
                        <p className="text-[10px] text-red-500/70 leading-relaxed mb-4 font-medium italic">
                            Esta acción eliminará permanentemente tu cuenta y todos tus datos personales de Artic Tempest. No podrá ser revertida.
                        </p>
                        <Button
                            variant="ghost"
                            className="w-full text-red-500 hover:bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-widest h-10 gap-2"
                            onClick={handleDeleteAccount}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <IconRefresh className="size-3.5 animate-spin" />
                            ) : (
                                <IconTrash className="size-3.5" />
                            )}
                            Borrar mi cuenta
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Personajes de la cuenta (EU)</h2>
                        <p className="text-sm text-zinc-500 mt-1">
                            Sincronización automática con la API de Blizzard.
                        </p>
                    </div>
                    {battletag && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="text-[10px] uppercase font-black tracking-widest bg-white/5 hover:bg-white/10 text-white/70 h-9 px-4 border border-white/10"
                        >
                            <IconRefresh className={`size-3.5 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                            Refrescar Lista
                        </Button>
                    )}
                </div>

                <div className="border border-white/10 rounded-2xl overflow-hidden bg-zinc-950/20 shadow-2xl backdrop-blur-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="text-left font-black uppercase tracking-widest text-[9px] text-zinc-500 p-4 w-[60%]">Personaje</th>
                                <th className="font-black uppercase tracking-widest text-[9px] text-zinc-500 p-4 w-[40%] text-right">Reino / Servidor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentCharacters.length > 0 ? (
                                currentCharacters.map((c) => (
                                    <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative size-8 shrink-0">
                                                    <Image
                                                        src={`/assets/images/classes/${c.class_id}.jpg`}
                                                        alt="Clase"
                                                        fill
                                                        className="rounded-lg shadow-2xl border border-white/10 object-cover"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <a
                                                        href={`https://worldofwarcraft.blizzard.com/es-es/character/eu/${c.realm_slug}/${c.name.toLowerCase()}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-bold text-white/90 text-base leading-none mb-1 hover:text-[#00aeff] transition-colors"
                                                    >
                                                        {c.name}
                                                    </a>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Nivel {c.level}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-zinc-400 font-medium">{c.realm}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Europa / EU</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="p-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-4 rounded-full bg-white/5 border border-white/5">
                                                <IconAlertTriangle className="size-8 text-zinc-600" />
                                            </div>
                                            <p className="text-zinc-500 text-sm italic max-w-xs">
                                                {battletag
                                                    ? "No hemos encontrado personajes de nivel 10 o superior en tu cuenta principal."
                                                    : "Víncula tu cuenta de Battle.net para importar tu Roster de personajes automáticamente."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && characters.length > 0 && (
                    <div className="flex items-center justify-between pt-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-2">
                            Página {currentPage} de {totalPages} <span className="mx-2 opacity-30">|</span> {characters.length} encontrados
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 bg-transparent border-white/10 hover:bg-white/5 text-[10px] uppercase font-black tracking-widest"
                            >
                                <IconChevronLeft className="size-3.5 mr-1" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 bg-transparent border-white/10 hover:bg-white/5 text-[10px] uppercase font-black tracking-widest"
                            >
                                <IconChevronRight className="size-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    )
}
