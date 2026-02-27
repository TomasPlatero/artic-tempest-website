"use client"

import { useState } from "react"
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
    IconClock
} from "@tabler/icons-react"
import { toast } from "sonner"
import Image from "next/image"

export function AccountsClient({ initialProfiles }: { initialProfiles: any[] }) {
    const [profiles, setProfiles] = useState(initialProfiles)
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

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
                // Update local state (you might want to re-fetch or just update the row)
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
        <div className="rounded-2xl border border-white/5 bg-zinc-950/50 backdrop-blur-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="py-4">Usuario</TableHead>
                        <TableHead>Rol Actual</TableHead>
                        <TableHead>Vinculaciones</TableHead>
                        <TableHead>Salud API</TableHead>
                        <TableHead>Última Verificación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {profiles.map((profile) => (
                        <TableRow key={profile.user_id} className="border-white/5 hover:bg-white/[0.02]">
                            <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative size-10 rounded-full overflow-hidden border border-white/10 bg-zinc-900">
                                        {profile.discord_avatar ? (
                                            <Image src={profile.discord_avatar} alt="Avatar" fill />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <IconBrandDiscord className="size-5 text-white/20" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white">{profile.discord_username}</span>
                                        <span className="text-[10px] text-zinc-500 font-mono">{profile.user_id.slice(0, 8)}...</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(profile.role_level)}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <IconBrandDiscord className={`size-4 ${profile.discord_refresh_token ? 'text-blue-400' : 'text-zinc-600'}`} />
                                    <IconBrandOpenSource className={`size-4 ${profile.battlenet_id ? 'text-amber-400' : 'text-zinc-600'}`} />
                                </div>
                            </TableCell>
                            <TableCell>
                                {profile.tokens_invalidated ? (
                                    <div className="flex items-center gap-1.5 text-rose-400">
                                        <IconAlertTriangle className="size-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-tight">Token Expirado</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 text-emerald-500">
                                        <IconCheck className="size-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-tight">Saludable</span>
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <IconClock className="size-3.5" />
                                    <span className="text-xs">
                                        {profile.last_verification_check
                                            ? new Date(profile.last_verification_check).toLocaleDateString()
                                            : 'Nunca'}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleVerifySync(profile.user_id)}
                                    disabled={loadingMap[profile.user_id]}
                                    className="rounded-lg h-8 px-3 border-white/10 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30"
                                >
                                    <IconRotate className={`size-3.5 mr-1.5 ${loadingMap[profile.user_id] ? 'animate-spin' : ''}`} />
                                    Sincronizar
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
