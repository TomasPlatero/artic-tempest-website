"use client";

import { useState, useRef } from "react";
import { sileo } from "sileo";
import {
    IconRefresh,
    IconUpload,
    IconInnerShadowTop,
    IconDeviceFloppy,
    IconArrowLeft,
    IconBrandDiscord,
    IconSword,
    IconChartBar,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import Link from "next/link";

type GuildInfo = {
    name: string;
    realm: string;
    region: string;
    iconUrl?: string | null;
};

type CredentialsData = {
    discord_client_id: string;
    discord_client_secret: string;
    discord_guild_id: string;
    bnet_client_id: string;
    bnet_client_secret: string;
    wcl_client_id: string;
    wcl_client_secret: string;
};

type SettingsGeneralClientProps = {
    guild: GuildInfo | null;
    rankVisibility: boolean[];
    rankNames: string[];
    rankRoles: string[];
    credentials: CredentialsData;
};

export function SettingsGeneralClient({
    guild,
    rankVisibility: initialRankVisibility,
    rankNames: initialRankNames,
    rankRoles: initialRankRoles,
    credentials: initialCredentials,
}: SettingsGeneralClientProps) {
    const [uploading, setUploading] = useState(false);
    const [ranks, setRanks] = useState<boolean[]>(initialRankVisibility);
    const [names, setNames] = useState<string[]>(initialRankNames);
    const [roles, setRoles] = useState<string[]>(initialRankRoles);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Credentials state
    const [creds, setCreds] = useState<CredentialsData>(initialCredentials);
    const [savingCreds, setSavingCreds] = useState(false);

    const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            sileo.error({
                title: "Formato inválido",
                description: "El archivo debe ser una imagen.",
            });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/guild/icon", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (!res.ok) {
                sileo.error({
                    title: "Error al subir logotipo",
                    description: data.error ?? "No se pudo actualizar el icono.",
                });
                return;
            }

            sileo.success({
                title: "Logotipo actualizado",
                description:
                    "El nuevo icono de la hermandad se ha guardado correctamente.",
            });
            window.location.reload();
        } catch {
            sileo.error({
                title: "Error de conexión",
                description: "No se pudo contactar con el servidor.",
            });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleToggleRank = async (rankId: number, isVisible: boolean) => {
        const orig = [...ranks];
        const next = [...ranks];
        next[rankId] = isVisible;
        setRanks(next);

        try {
            const res = await fetch("/api/guild/ranks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rankId, isVisible, name: names[rankId] }),
            });
            if (!res.ok) throw new Error("API error");
        } catch {
            sileo.error({
                title: "Error",
                description: "No se pudo guardar la configuración del rango.",
            });
            setRanks(orig);
        }
    };

    const handleSaveName = async (rankId: number, newName: string) => {
        try {
            const res = await fetch("/api/guild/ranks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rankId,
                    isVisible: ranks[rankId],
                    name: newName,
                    appRole: roles[rankId]
                }),
            });
            if (!res.ok) throw new Error("API error");
            sileo.success({
                title: "Guardado",
                description: "Nombre de rango actualizado.",
            });
        } catch {
            sileo.error({
                title: "Error",
                description: "No se pudo actualizar el nombre del rango.",
            });
        }
    };

    const handleSaveRole = async (rankId: number, newRole: string) => {
        const nextRoles = [...roles];
        nextRoles[rankId] = newRole;
        setRoles(nextRoles);

        try {
            const res = await fetch("/api/guild/ranks", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rankId,
                    isVisible: ranks[rankId],
                    name: names[rankId],
                    appRole: newRole
                }),
            });
            if (!res.ok) throw new Error("API error");
            sileo.success({
                title: "Guardado",
                description: "Permiso base del rango actualizado.",
            });
        } catch {
            setRoles([...roles]);
            sileo.error({
                title: "Error",
                description: "No se pudo actualizar el permiso del rango.",
            });
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <IconArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Configuración del Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Información de la hermandad y visibilidad de los rangos.
                    </p>
                </div>
            </div>

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
                                        <AvatarImage
                                            src={guild.iconUrl ?? ""}
                                            alt={guild.name}
                                            className="object-cover"
                                        />
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
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? (
                                                <IconRefresh className="size-3 mr-2 animate-spin" />
                                            ) : (
                                                <IconUpload className="size-3 mr-2" />
                                            )}
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
                            <code className="mx-1 rounded bg-muted px-1">guilds_managed</code> en Supabase.
                        </p>
                    )}
                </CardContent>
            </Card>

            {guild && (
                <Card>
                    <CardHeader>
                        <CardTitle>Rangos Visibles</CardTitle>
                        <CardDescription>
                            Personaliza los nombres y la visibilidad de los 10 rangos originales de WoW.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((rankId) => {
                                return (
                                    <div
                                        key={rankId}
                                        className="flex flex-row items-center gap-4 p-3 border rounded-md hover:bg-muted/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-muted-foreground text-xs font-mono w-4">{rankId}</span>
                                            <Input
                                                value={names[rankId]}
                                                onChange={(e) => {
                                                    const next = [...names];
                                                    next[rankId] = e.target.value;
                                                    setNames(next);
                                                }}
                                                onBlur={(e) => handleSaveName(rankId, e.target.value)}
                                                className="h-8 max-w-[200px] text-sm bg-background"
                                                placeholder={`Rango ${rankId}`}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-primary shrink-0"
                                                onClick={() => handleSaveName(rankId, names[rankId])}
                                                title="Guardar nombre"
                                            >
                                                <IconDeviceFloppy className="size-4" />
                                            </Button>
                                            <Select
                                                value={roles[rankId]}
                                                onValueChange={(val: string) => handleSaveRole(rankId, val)}
                                            >
                                                <SelectTrigger className="w-[120px] h-8 text-xs bg-background">
                                                    <SelectValue placeholder="Permiso" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="gm">Guild Master</SelectItem>
                                                    <SelectItem value="officer">Oficial</SelectItem>
                                                    <SelectItem value="raider">Raider / Básico</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Switch
                                            checked={ranks[rankId]}
                                            onCheckedChange={(val: boolean) => handleToggleRank(rankId, val)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Integraciones Externas */}
            <Card>
                <CardHeader>
                    <CardTitle>Integraciones Externas</CardTitle>
                    <CardDescription>
                        Configura las credenciales de Discord y Battle.net. Estos valores se leen desde la base de datos en lugar del archivo .env.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Discord */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#5865F2]">
                            <IconBrandDiscord className="size-5" />
                            Discord OAuth
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Client ID</label>
                                <Input
                                    placeholder="Discord Application Client ID"
                                    className="bg-background font-mono text-sm"
                                    value={creds.discord_client_id}
                                    onChange={e => setCreds(prev => ({ ...prev, discord_client_id: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Client Secret</label>
                                <Input
                                    type="password"
                                    placeholder="Discord Application Client Secret"
                                    className="bg-background font-mono text-sm"
                                    value={creds.discord_client_secret}
                                    onChange={e => setCreds(prev => ({ ...prev, discord_client_secret: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5 max-w-md">
                            <label className="text-xs font-medium text-muted-foreground">Guild (Server) ID</label>
                            <Input
                                placeholder="ID del servidor de Discord"
                                className="bg-background font-mono text-sm"
                                value={creds.discord_guild_id}
                                onChange={e => setCreds(prev => ({ ...prev, discord_guild_id: e.target.value }))}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Battle.net */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-500">
                            <IconSword className="size-5" />
                            Battle.net API
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Client ID</label>
                                <Input
                                    placeholder="Battle.net API Client ID"
                                    className="bg-background font-mono text-sm"
                                    value={creds.bnet_client_id}
                                    onChange={e => setCreds(prev => ({ ...prev, bnet_client_id: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Client Secret</label>
                                <Input
                                    type="password"
                                    placeholder="Battle.net API Client Secret"
                                    className="bg-background font-mono text-sm"
                                    value={creds.bnet_client_secret}
                                    onChange={e => setCreds(prev => ({ ...prev, bnet_client_secret: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* WarcraftLogs */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-orange-500">
                            <IconChartBar className="size-5" />
                            WarcraftLogs API v2
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Client ID</label>
                                <Input
                                    placeholder="WarcraftLogs Client ID"
                                    className="bg-background font-mono text-sm"
                                    value={creds.wcl_client_id}
                                    onChange={e => setCreds(prev => ({ ...prev, wcl_client_id: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Client Secret</label>
                                <Input
                                    type="password"
                                    placeholder="WarcraftLogs Client Secret"
                                    className="bg-background font-mono text-sm"
                                    value={creds.wcl_client_secret}
                                    onChange={e => setCreds(prev => ({ ...prev, wcl_client_secret: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            onClick={async () => {
                                setSavingCreds(true);
                                try {
                                    const res = await fetch("/api/guild/settings/credentials", {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(creds),
                                    });

                                    if (!res.ok) throw new Error("API error");
                                    sileo.success({
                                        title: "Credenciales guardadas",
                                        description: "Los cambios se aplicarán en la próxima operación que las utilice.",
                                    });

                                    // Mask secrets visually after save
                                    const MASK = "••••••••••••••••";
                                    setCreds(prev => ({
                                        ...prev,
                                        discord_client_secret: prev.discord_client_secret && prev.discord_client_secret !== MASK ? MASK : prev.discord_client_secret,
                                        bnet_client_secret: prev.bnet_client_secret && prev.bnet_client_secret !== MASK ? MASK : prev.bnet_client_secret,
                                        wcl_client_secret: prev.wcl_client_secret && prev.wcl_client_secret !== MASK ? MASK : prev.wcl_client_secret,
                                    }));
                                } catch {
                                    sileo.error({
                                        title: "Error",
                                        description: "No se pudieron guardar las credenciales.",
                                    });
                                } finally {
                                    setSavingCreds(false);
                                }
                            }}
                            disabled={savingCreds}
                        >
                            {savingCreds ? (
                                <><IconRefresh className="size-4 mr-2 animate-spin" /> Guardando...</>
                            ) : (
                                <><IconDeviceFloppy className="size-4 mr-2" /> Guardar Credenciales</>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
