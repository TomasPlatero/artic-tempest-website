"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    IconBrandDiscord,
    IconBrandOpenSource,
    IconRotate,
    IconAlertTriangle,
    IconCheck,
    IconClock,
    IconChevronDown,
    IconTrash
} from "@tabler/icons-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { IconSearch } from "@tabler/icons-react"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"

export function AccountsClient({ initialProfiles }: { initialProfiles: any[] }) {
    const [profiles, setProfiles] = useState(initialProfiles)
    const [searchTerm, setSearchTerm] = useState("")
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return <div className="p-12 flex justify-center items-center text-white/20 animate-pulse font-black uppercase tracking-[0.3em] text-xs">Cargando Panel de Gestión...</div>
    }

    const filteredProfiles = profiles.filter(p =>
        p.discord_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleVerifySync = async (userId: string) => {
        setLoadingMap(prev => ({ ...prev, [userId]: true }))
        try {
            const res = await fetch("/api/admin/system/verify-user", {
                method: "POST",
                body: JSON.stringify({ userId }),
                headers: { "Content-Type": "application/json" }
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Usuario verificado correctamente", {
                    description: `Nuevo rol: ${data.result.newRole}`
                })
                setProfiles(prev => prev.map(p =>
                    p.user_id === userId
                        ? { ...p, role_level: data.result.newRole, last_verification_check: new Date().toISOString() }
                        : p
                ))
            } else {
                throw new Error(data.error)
            }
        } catch (error: any) {
            toast.error("Error al sincronizar", { description: error.message })
        } finally {
            setLoadingMap(prev => ({ ...prev, [userId]: false }))
        }
    }

    const handleDeleteUser = async (profile: any) => {
        const confirm1 = confirm(`¿Estás SEGURO de eliminar permanentemente a ${profile.discord_username}?`)
        if (!confirm1) return

        const confirm2 = confirm(`Esta acción borrará TODOS los datos de ${profile.discord_username} (personajes, vinculaciones, solicitudes de reclutamiento, etc) y es IRREVERSIBLE.\n\n¿Quieres continuar?`)
        if (!confirm2) return

        setLoadingMap(prev => ({ ...prev, [profile.user_id]: true }))
        try {
            const res = await fetch("/api/admin/system/delete-user", {
                method: "DELETE",
                body: JSON.stringify({ userId: profile.user_id }),
                headers: { "Content-Type": "application/json" }
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Usuario eliminado", {
                    description: "Todos los datos del usuario han sido borrados en cascada."
                })
                setProfiles(prev => prev.filter(p => p.user_id !== profile.user_id))
            } else {
                throw new Error(data.error)
            }
        } catch (error: any) {
            toast.error("Error al eliminar", { description: error.message })
        } finally {
            setLoadingMap(prev => ({ ...prev, [profile.user_id]: false }))
        }
    }

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const res = await fetch("/api/admin/system/update-role", {
                method: "POST",
                body: JSON.stringify({ userId, role: newRole }),
                headers: { "Content-Type": "application/json" }
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Rol actualizado", {
                    description: `Usuario asignado como ${newRole.toUpperCase()}`
                })
                setProfiles(prev => prev.map(p =>
                    p.user_id === userId
                        ? { ...p, role_level: newRole }
                        : p
                ))
            } else {
                throw new Error(data.error)
            }
        } catch (error: any) {
            toast.error("Error al actualizar rol", { description: error.message })
        }
    }

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            gm: "bg-rose-500/10 text-rose-500 border-rose-500/20",
            officer: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            raider: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            member: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            invitado: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
        }
        return (
            <Badge variant="outline" className={`uppercase font-black text-[10px] tracking-widest ${colors[role] || colors.invitado}`}>
                {role}
            </Badge>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="relative w-full max-w-sm">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <Input
                    placeholder="Buscar por usuario o ID..."
                    className="pl-10 bg-zinc-950/50 border-white/5 focus:border-blue-500/50 transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-zinc-950/40 backdrop-blur-xl overflow-hidden w-full shadow-2xl ring-1 ring-white/5">
                <Table>
                    <TableHeader className="bg-white/[0.03]">
                        <TableRow className="hover:bg-transparent border-white/[0.05]">
                            <TableHead className="h-14 pl-8 uppercase tracking-[0.2em] text-[10px] font-black text-white/40">Usuario</TableHead>
                            <TableHead className="uppercase tracking-[0.2em] text-[10px] font-black text-white/40">ID Discord</TableHead>
                            <TableHead className="uppercase tracking-[0.2em] text-[10px] font-black text-white/40">Rol Actual</TableHead>
                            <TableHead className="uppercase tracking-[0.2em] text-[10px] font-black text-white/40">BattleTag</TableHead>
                            <TableHead className="uppercase tracking-[0.2em] text-[10px] font-black text-white/40 text-center">Personajes</TableHead>
                            <TableHead className="uppercase tracking-[0.2em] text-[10px] font-black text-white/40">Sincronización</TableHead>
                            <TableHead className="uppercase tracking-[0.2em] text-[10px] font-black text-white/40">Salud API</TableHead>
                            <TableHead className="uppercase tracking-[0.2em] text-[10px] font-black text-white/40">Registro</TableHead>
                            <TableHead className="uppercase tracking-[0.2em] text-[10px] font-black text-white/40">Verificado</TableHead>
                            <TableHead className="text-right pr-8 uppercase tracking-[0.2em] text-[10px] font-black text-white/40">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProfiles.map((profile) => (
                            <TableRow
                                key={profile.user_id}
                                className="group/row border-white/[0.05] hover:bg-white/[0.03] transition-all duration-300 relative"
                            >
                                <TableCell className="h-20 pl-8 relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary scale-y-0 group-hover/row:scale-y-100 transition-transform duration-300 origin-center rounded-r-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                                    <div className="flex items-center gap-4">
                                        <div className="relative size-11 rounded-full overflow-hidden border-2 border-white/10 bg-zinc-900 shadow-xl group-hover/row:border-primary/50 transition-colors duration-300">
                                            {profile.discord_avatar ? (
                                                <Image src={profile.discord_avatar} alt="Avatar" fill className="object-cover scale-110 group-hover/row:scale-125 transition-transform duration-500" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <IconBrandDiscord className="size-6 text-white/10" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-white tracking-tight text-base group-hover/row:text-primary transition-colors duration-300">{profile.discord_username}</span>
                                            <div className="flex items-center gap-1">
                                                <div className="size-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">En Línea</span>
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <code className="text-[10px] text-zinc-400 font-bold bg-white/5 border border-white/10 px-2 py-1 rounded-md group-hover/row:border-white/20 transition-colors">
                                        {profile.user_id}
                                    </code>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="flex items-center gap-2 hover:translate-x-1 transition-transform outline-none group/trigger opacity-90 hover:opacity-100">
                                                {getRoleBadge(profile.role_level)}
                                                <IconChevronDown className="size-3 text-zinc-600 group-hover/trigger:text-primary transition-colors" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-52 bg-zinc-950/90 backdrop-blur-2xl border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1.5 animate-in fade-in zoom-in-95 duration-200">
                                            <DropdownMenuLabel className="text-[9px] uppercase tracking-[0.3em] font-black text-white/30 py-3 px-4">Autorización</DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-white/5 mx-2 my-1" />
                                            {['gm', 'officer', 'raider', 'member', 'invitado'].map((r) => (
                                                <DropdownMenuItem
                                                    key={r}
                                                    onClick={() => handleUpdateRole(profile.user_id, r)}
                                                    className={`uppercase font-black text-[10px] tracking-[0.2em] cursor-pointer rounded-lg py-2.5 px-4 my-1 transition-all duration-200 ${profile.role_level === r
                                                        ? 'bg-primary text-white shadow-[0_0_20px_rgba(var(--primary),0.3)]'
                                                        : 'text-zinc-500 hover:bg-white/5 hover:text-white hover:pl-5'
                                                        }`}
                                                >
                                                    {r}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                                <TableCell>
                                    {profile.battlenet_battletag ? (
                                        <div className="flex items-center gap-2.5 group/btag hover:translate-x-1 transition-transform">
                                            <div className="size-6 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-500/5">
                                                <IconBrandOpenSource className="size-3.5 text-amber-500" />
                                            </div>
                                            <span className="text-sm font-bold text-zinc-200 tracking-tight">{profile.battlenet_battletag}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 opacity-30 grayscale italic text-[11px] text-zinc-500 font-medium"> No vinculado </div>
                                    )}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="inline-flex items-center justify-center size-8 rounded-xl bg-white/5 border border-white/10 font-mono text-sm font-black text-white/70 group-hover/row:scale-110 group-hover/row:border-primary/30 transition-all duration-300">
                                        {profile.character_count || 0}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-xl border transition-all duration-500",
                                            profile.discord_refresh_token
                                                ? "bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/10"
                                                : "bg-zinc-900 border-white/5 text-zinc-700 opacity-40 grayscale"
                                        )} title="Discord Auth">
                                            <IconBrandDiscord className="size-4.5" />
                                        </div>
                                        <div className={cn(
                                            "p-2 rounded-xl border transition-all duration-500",
                                            profile.battlenet_id
                                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/10"
                                                : "bg-zinc-900 border-white/5 text-zinc-700 opacity-40 grayscale"
                                        )} title="Battle.net API">
                                            <IconBrandOpenSource className="size-4.5" />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {profile.tokens_invalidated ? (
                                        <div className="flex items-center gap-2.5 text-rose-400 bg-rose-500/5 px-3 py-1.5 rounded-xl border border-rose-500/10 w-fit backdrop-blur-sm group-hover/row:border-rose-500/30 transition-all duration-300">
                                            <div className="size-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Token Caído</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2.5 text-emerald-500 bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/10 w-fit backdrop-blur-sm group-hover/row:border-emerald-500/30 transition-all duration-300">
                                            <div className="size-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Saludable</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col group/date">
                                        <span className="text-[11px] font-black text-zinc-300 group-hover/row:text-white transition-colors duration-300">
                                            {profile.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
                                        </span>
                                        <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Fecha Alta</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2.5 text-zinc-500 group/time">
                                        <IconClock className="size-4 text-zinc-700 group-hover/row:text-primary transition-colors duration-300" />
                                        <span className="text-[11px] font-black group-hover/row:text-zinc-200 transition-colors duration-300">
                                            {profile.last_verification_check
                                                ? new Date(profile.last_verification_check).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
                                                : 'Nunca'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover/row:opacity-100 translate-x-4 group-hover/row:translate-x-0 transition-all duration-300">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleVerifySync(profile.user_id)}
                                            disabled={loadingMap[profile.user_id]}
                                            className="rounded-xl h-10 px-6 border-white/10 bg-white/5 hover:bg-primary/[0.08] hover:text-primary hover:border-primary/20 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl ring-1 ring-white/5 active:scale-95"
                                        >
                                            <IconRotate className={`size-4 mr-2.5 ${loadingMap[profile.user_id] ? 'animate-spin' : ''}`} />
                                            Verificar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteUser(profile)}
                                            disabled={loadingMap[profile.user_id]}
                                            className="h-10 w-10 rounded-xl text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 hover:rotate-6 transition-all ring-1 ring-white/5 hover:ring-rose-500/20 shadow-xl active:scale-90"
                                            title="Eliminar permanentemente"
                                        >
                                            <IconTrash className="size-4.5" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
