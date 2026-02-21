"use client"

import { useState, useRef } from "react"
import { sileo } from "sileo"
import { IconRefresh, IconCheck, IconX, IconUpload, IconInnerShadowTop } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type GuildInfo = {
    name: string
    realm: string
    region: string
    iconUrl?: string | null
}

type SettingsClientProps = {
    guild: GuildInfo | null
    memberCount: number
    lastSync: string | null
    bnetConfigured: boolean
}

export function SettingsClient({
    guild,
    memberCount,
    lastSync,
    bnetConfigured,
}: SettingsClientProps) {
    const [syncing, setSyncing] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            sileo.error({ title: "Formato inválido", description: "El archivo debe ser una imagen." })
            return
        }

        setUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const res = await fetch("/api/guild/icon", {
                method: "POST",
                body: formData
            })
            const data = await res.json()

            if (!res.ok) {
                sileo.error({ title: "Error al subir logotipo", description: data.error ?? "No se pudo actualizar el icono." })
                return
            }

            sileo.success({ title: "Logotipo actualizado", description: "El nuevo icono de la hermandad se ha guardado correctamente." })
            window.location.reload()
        } catch {
            sileo.error({ title: "Error de conexión", description: "No se pudo contactar con el servidor." })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleSync = async () => {
        setSyncing(true)
        try {
            const res = await fetch("/api/guild/sync", {
                method: "POST",
                credentials: "include",
            })
            const data = await res.json()

            if (!res.ok) {
                sileo.error({
                    title: "Error al sincronizar",
                    description: data.error ?? "Error desconocido",
                })
                return
            }

            sileo.success({
                title: "Roster sincronizado",
                description: `${data.imported} personajes importados de ${data.guild}`,
            })

            // Reload to update counts
            window.location.reload()
        } catch {
            sileo.error({
                title: "Error de conexión",
                description: "No se pudo contactar con el servidor",
            })
        } finally {
            setSyncing(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Guild Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Hermandad</CardTitle>
                    <CardDescription>
                        Información de la hermandad vinculada a este GuildBoard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {guild ? (
                        <div className="grid gap-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Logotipo de Hermandad</span>
                                <div className="flex items-center gap-4">
                                    <Avatar className="size-10 border border-border/50 shadow-sm bg-[#1e1e24]">
                                        <AvatarImage src={guild.iconUrl ?? ""} alt={guild.name} className="object-cover" />
                                        <AvatarFallback className="bg-transparent">
                                            <IconInnerShadowTop className="size-5 text-muted-foreground" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col gap-1 items-end">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleIconUpload}
                                            disabled={uploading}
                                        />
                                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                            {uploading ? <IconRefresh className="size-3 mr-2 animate-spin" /> : <IconUpload className="size-3 mr-2" />}
                                            {uploading ? "Subiendo..." : "Subir nuevo icono"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Nombre</span>
                                <span className="font-medium">{guild.name}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Realm</span>
                                <span className="font-medium">{guild.realm}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Región</span>
                                <Badge variant="outline">{guild.region.toUpperCase()}</Badge>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No hay hermandad configurada. Añade una fila en la tabla
                            <code className="mx-1 rounded bg-muted px-1">guilds_managed</code>
                            en Supabase.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Battle.net Integration */}
            <Card>
                <CardHeader>
                    <CardTitle>Battle.net</CardTitle>
                    <CardDescription>
                        Conexión con la API de Blizzard para importar el roster
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="grid gap-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Estado API</span>
                            {bnetConfigured ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                    <IconCheck className="size-3" />
                                    Configurado
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                                    <IconX className="size-3" />
                                    Sin configurar
                                </Badge>
                            )}
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Miembros importados</span>
                            <span className="font-medium tabular-nums">{memberCount}</span>
                        </div>
                        {lastSync && (
                            <>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Última sincronización</span>
                                    <span className="font-medium">
                                        {new Date(lastSync).toLocaleDateString("es-ES", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {!bnetConfigured && (
                        <p className="text-sm text-muted-foreground rounded-lg bg-muted p-3">
                            Añade <code>BNET_CLIENT_ID</code> y <code>BNET_CLIENT_SECRET</code> en
                            tu <code>.env.local</code> para activar la sincronización.
                            Puedes obtenerlos en{" "}
                            <a
                                href="https://develop.battle.net/access/clients"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                            >
                                develop.battle.net
                            </a>.
                        </p>
                    )}

                    <Button
                        onClick={handleSync}
                        disabled={syncing || !bnetConfigured || !guild}
                        className="w-full sm:w-auto"
                    >
                        <IconRefresh className={syncing ? "animate-spin" : ""} />
                        {syncing ? "Sincronizando..." : "Sincronizar Roster desde Battle.net"}
                    </Button>
                </CardContent>
            </Card>

            {/* Discord Roles */}
            <Card>
                <CardHeader>
                    <CardTitle>Roles de Discord</CardTitle>
                    <CardDescription>
                        Mapeo de roles de Discord con permisos del GuildBoard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Guild Master</span>
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                Acceso total + Ajustes
                            </Badge>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Officer</span>
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                Gestión de roster
                            </Badge>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Raider</span>
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                                Solo lectura
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
