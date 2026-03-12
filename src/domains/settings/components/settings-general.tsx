"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
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
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import Link from "next/link";

type GuildInfo = {
    name: string;
    realm: string;
    region: string;
    iconUrl?: string | null;
    mobileIconUrl?: string | null;
    version: string;
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
    const [uploadingMobile, setUploadingMobile] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mobileFileInputRef = useRef<HTMLInputElement>(null);

    // Version state
    const [version, setVersion] = useState(guild?.version || "v1.0.0");
    const [savingVersion, setSavingVersion] = useState(false);

    // Credentials state
    const [creds, setCreds] = useState<CredentialsData>(initialCredentials);
    const [savingCreds, setSavingCreds] = useState(false);

    const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'mobile' = 'main') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Formato inválido", {
                description: "El archivo debe ser una imagen.",
            });
            return;
        }

        const isMobile = type === 'mobile';
        if (isMobile) setUploadingMobile(true);
        else setUploading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        try {
            const res = await fetch("/api/guild/icon", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error("Error al subir logotipo", {
                    description: data.error ?? "No se pudo actualizar el icono.",
                });
                return;
            }

            toast.success("Logotipo actualizado", {
                description: isMobile
                    ? "El icono para dispositivos móviles se ha guardado correctamente."
                    : "El logotipo principal de la hermandad se ha guardado correctamente.",
            });
            window.location.reload();
        } catch {
            toast.error("Error de conexión", {
                description: "No se pudo contactar con el servidor.",
            });
        } finally {
            if (isMobile) {
                setUploadingMobile(false);
                if (mobileFileInputRef.current) mobileFileInputRef.current.value = "";
            } else {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        }
    };



    return (
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:px-8 w-full max-w-full animate-in fade-in duration-500">
            <div className="flex items-center gap-6">
                <Link href="/dashboard/configuracion">
                    <Button variant="outline" size="icon" className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl">
                        <IconArrowLeft className="size-6" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black font-heading italic tracking-tight uppercase flex items-center gap-3">
                        CONFIGURACIÓN GENERAL
                    </h1>
                    <p className="text-sm font-medium text-white/40 mt-2 uppercase tracking-widest">
                        Información básica de la hermandad y credenciales de sistema.
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
                                <div className="space-y-0.5">
                                    <span className="text-muted-foreground block text-xs uppercase font-bold tracking-tight">Logotipo Principal</span>
                                    <p className="text-[10px] text-muted-foreground/40 leading-tight">
                                        Se utiliza en la barra lateral y en la web principal.
                                    </p>
                                </div>
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
                                            onChange={(e) => handleIconUpload(e, 'main')}
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
                                            {uploading ? "Subiendo..." : "Actualizar"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="text-muted-foreground block text-xs uppercase font-bold tracking-tight text-amber-500/80">Logotipo para Móvil</span>
                                    <p className="text-[10px] text-muted-foreground/40 leading-tight">
                                        Se muestra exclusivamente en la cabecera cuando accedes desde el móvil.
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Avatar className="size-10 border border-border/50 shadow-sm bg-[#1e1e24]">
                                        <AvatarImage
                                            src={guild.mobileIconUrl ?? ""}
                                            alt="Móvil"
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="bg-transparent text-[10px] font-black italic text-muted-foreground/20">
                                            MOB
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col gap-1 items-end">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            ref={mobileFileInputRef}
                                            onChange={(e) => handleIconUpload(e, 'mobile')}
                                            disabled={uploadingMobile}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => mobileFileInputRef.current?.click()}
                                            disabled={uploadingMobile}
                                        >
                                            {uploadingMobile ? (
                                                <IconRefresh className="size-3 mr-2 animate-spin" />
                                            ) : (
                                                <IconUpload className="size-3 mr-2" />
                                            )}
                                            {uploadingMobile ? "Subiendo..." : "Subir"}
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
                            <Separator />
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                                <div className="space-y-1">
                                    <span className="text-muted-foreground block">Versión del Dashboard</span>
                                    <p className="text-[10px] text-muted-foreground/60 leading-tight">
                                        Se muestra en la barra lateral debajo del nombre de la hermandad.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input
                                        className="h-9 w-[180px] font-mono text-xs bg-white/5 border-white/10"
                                        value={version}
                                        onChange={e => setVersion(e.target.value)}
                                        placeholder="v1.0.0"
                                    />
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        disabled={savingVersion || version === guild.version}
                                        onClick={async () => {
                                            setSavingVersion(true);
                                            try {
                                                const res = await fetch("/api/guild/settings/version", {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ version }),
                                                });
                                                if (!res.ok) throw new Error();
                                                toast.success("Versión actualizada", {
                                                    description: "El cambio se aplicará al recargar o navegar."
                                                });
                                            } catch {
                                                toast.error("Error", { description: "No se pudo actualizar la versión." });
                                            } finally {
                                                setSavingVersion(false);
                                            }
                                        }}
                                    >
                                        {savingVersion ? <IconRefresh className="size-3 animate-spin" /> : <IconDeviceFloppy className="size-3 mr-2" />}
                                        Actualizar
                                    </Button>
                                </div>
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
                                    toast.success("Credenciales guardadas", {
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
                                    toast.error("Error", {
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
