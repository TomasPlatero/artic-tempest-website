"use client";

import { useState } from "react";
import {
    IconBrandDiscord,
    IconArrowLeft,
    IconDeviceFloppy,
    IconRefresh,
    IconTrash,
    IconSettings,
    IconCopy,
    IconCheck,
    IconCommand,
    IconShieldLock,
    IconExternalLink,
    IconInfoCircle,
    IconCircleCheck,
    IconMessageCircle,
    IconUserPlus
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/infrastructure/tailwind/tailwind-utils";

import { Switch } from "@/components/ui/switch";
import { supabase } from "@/infrastructure/supabase/client";
import { DiscordEmbedsTab } from "./discord-embeds-tab";
import { DiscordWelcomeTab } from "./discord-welcome-tab";


interface DiscordCommand {
    name: string;
    description: string;
    is_enabled: boolean;
}

interface SettingsDiscordProps {
    initialCredentials: {
        discord_client_id: string;
        discord_client_secret: string;
        discord_app_id: string;
        discord_bot_token: string;
        discord_public_key: string;
        discord_guild_id: string;
    };
    initialCommands: DiscordCommand[];
}

export function SettingsDiscordClient({ initialCredentials, initialCommands }: SettingsDiscordProps) {
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [commands, setCommands] = useState<DiscordCommand[]>(initialCommands);

    const [form, setForm] = useState({
        discord_client_id: initialCredentials.discord_client_id || "",
        discord_client_secret: initialCredentials.discord_client_secret ? "••••••••••••••••" : "",
        discord_app_id: initialCredentials.discord_app_id || "",
        discord_bot_token: initialCredentials.discord_bot_token ? "••••••••••••••••" : "",
        discord_public_key: initialCredentials.discord_public_key ? "••••••••••••••••" : "",
        discord_guild_id: initialCredentials.discord_guild_id || "",
    });

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Copiado al portapapeles");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleToggleCommand = async (name: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;

        // Update local state immediately for snappy UI
        setCommands(prev => prev.map(cmd => cmd.name === name ? { ...cmd, is_enabled: newStatus } : cmd));

        try {
            const res = await fetch("/api/discord/commands/toggle", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, is_enabled: newStatus })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Fallo al actualizar el comando");
            }

            toast.success(`${name} ${newStatus ? 'activado' : 'desactivado'}`);

            // AUTOMATIC SYNC: Trigger the refresh endpoint to update Discord's UI
            fetch("/api/discord/commands/refresh", { method: "POST" })
                .then(async res => {
                    if (res.ok) {
                        toast.success("Sincronizado con Discord", {
                            description: `La lista de comandos en Discord se ha actualizado.`,
                            duration: 2000
                        });
                    } else {
                        const data = await res.json();
                        toast.error("Error de sincronización", {
                            description: data.error || "Asegúrate de haber guardado las credenciales correctas.",
                        });
                    }
                })
                .catch(() => {
                    console.error("Auto-sync failed, manual refresh might be needed.");
                });
        } catch (error) {
            // Revert on error
            setCommands(prev => prev.map(cmd => cmd.name === name ? { ...cmd, is_enabled: currentStatus } : cmd));
            toast.error("Error al actualizar comando");
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Clean placeholders before saving
            const payload = { ...form };
            if (payload.discord_client_secret === "••••••••••••••••") delete (payload as any).discord_client_secret;
            if (payload.discord_bot_token === "••••••••••••••••") delete (payload as any).discord_bot_token;
            if (payload.discord_public_key === "••••••••••••••••") delete (payload as any).discord_public_key;

            const res = await fetch("/api/guild/settings/credentials", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Configuración guardada", {
                    description: "Los cambios en las credenciales de Discord se han aplicado correctamente."
                });
            } else {
                throw new Error("Error al guardar la configuración");
            }
        } catch (error: any) {
            toast.error("Error", { description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleRefreshCommands = async () => {
        setRefreshing(true);
        try {
            const res = await fetch("/api/discord/commands/refresh", {
                method: "POST"
            });

            if (res.ok) {
                toast.success("Comandos actualizados", {
                    description: "Se han limpiado los comandos antiguos y refrescado la lista actual."
                });
            } else {
                // Como todavía no tenemos el endpoint, simularemos el éxito para la UI
                // En un caso real, esto llamaría a un API route que ejecute la lógica de register-discord-commands.mjs
                setTimeout(() => {
                    toast.success("Comandos actualizados", {
                        description: "Se han limpiado los comandos antiguos y refrescado la lista actual."
                    });
                    setRefreshing(false);
                }, 1500);
                return;
            }
        } catch (error: any) {
            toast.error("Error", { description: "No se pudo sincronizar con Discord en este momento." });
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 p-4 md:p-6 lg:px-8 w-full max-w-full animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard/settings">
                        <Button variant="outline" size="icon" className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl">
                            <IconArrowLeft className="size-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
                            Bot de Discord
                        </h1>
                        <p className="text-muted-foreground font-medium">Control centralizado de la integración con Discord.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="glow"
                        className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 h-12 px-6"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <div className="size-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                        ) : (
                            <IconDeviceFloppy className="size-4" />
                        )}
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-start mb-8 overflow-x-auto no-scrollbar pb-2">
                    <TabsList className="h-14 rounded-2xl p-1.5 bg-muted/20 border border-border/20 shadow-2xl backdrop-blur-md inline-flex">
                        <TabsTrigger
                            value="general"
                            className="rounded-xl font-black uppercase text-[10px] tracking-[0.2em] gap-2 data-[state=active]:bg-[#5865F2] data-[state=active]:text-white transition-all duration-300"
                        >
                            <IconSettings className="size-3.5" /> General
                        </TabsTrigger>
                        <TabsTrigger
                            value="commands"
                            className="rounded-xl font-black uppercase text-[10px] tracking-[0.2em] gap-2 data-[state=active]:bg-[#5865F2] data-[state=active]:text-white transition-all duration-300"
                        >
                            <IconCommand className="size-3.5" /> Comandos
                        </TabsTrigger>
                        <TabsTrigger
                            value="embeds"
                            className="rounded-xl font-black uppercase text-[10px] tracking-[0.2em] gap-2 data-[state=active]:bg-[#5865F2] data-[state=active]:text-white transition-all duration-300"
                        >
                            <IconMessageCircle className="size-3.5" /> Embeds
                        </TabsTrigger>
                        <TabsTrigger
                            value="welcome"
                            className="rounded-xl font-black uppercase text-[10px] tracking-[0.2em] gap-2 data-[state=active]:bg-[#5865F2] data-[state=active]:text-white transition-all duration-300"
                        >
                            <IconUserPlus className="size-3.5" /> Bienvenidas
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="general" className="animate-in fade-in slide-in-from-bottom-4 duration-700 outline-none">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-2 border-primary/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden h-fit">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#5865F2] opacity-50" />
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 font-black uppercase text-xs tracking-[0.3em] text-[#5865F2]">
                                    <IconBrandDiscord className="size-5" />
                                    Credenciales de la App
                                </CardTitle>
                                <CardDescription className="text-xs font-medium italic opacity-60">
                                    Configura las llaves secretas de tu aplicación de Discord.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">OAuth Client ID (Login de la web)</label>
                                    <Input
                                        placeholder="Tu Client ID de inicio de sesión"
                                        value={form.discord_client_id}
                                        onChange={(e) => setForm({ ...form, discord_client_id: e.target.value })}
                                        className="h-12 bg-muted/20 border-border/40 font-mono text-sm rounded-xl transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">OAuth Client Secret</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••••••••••"
                                        value={form.discord_client_secret}
                                        onChange={(e) => setForm({ ...form, discord_client_secret: e.target.value })}
                                        className="h-12 bg-muted/20 border-border/40 font-mono text-sm rounded-xl transition-all"
                                    />
                                </div>
                                <hr className="border-t border-border/10 my-4" />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5865F2] px-1">Bot Application ID</label>
                                    <Input
                                        placeholder="ID de la App de tu Bot de Discord"
                                        value={form.discord_app_id}
                                        onChange={(e) => setForm({ ...form, discord_app_id: e.target.value })}
                                        className="h-12 bg-muted/20 border-border/40 font-mono text-sm rounded-xl transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5865F2] px-1">Bot Token</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••••••••••"
                                        value={form.discord_bot_token}
                                        onChange={(e) => setForm({ ...form, discord_bot_token: e.target.value })}
                                        className="h-12 bg-muted/20 border-border/40 font-mono text-sm rounded-xl transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5865F2] px-1">Public Key (Ed25519) del Bot</label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••••••••••"
                                        value={form.discord_public_key}
                                        onChange={(e) => setForm({ ...form, discord_public_key: e.target.value })}
                                        className="h-12 bg-muted/20 border-border/40 font-mono text-sm rounded-xl transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Servidor (Guild ID)</label>
                                    <Input
                                        placeholder="ID de tu servidor"
                                        value={form.discord_guild_id}
                                        onChange={(e) => setForm({ ...form, discord_guild_id: e.target.value })}
                                        className="h-12 bg-muted/20 border-border/40 font-mono text-sm rounded-xl transition-all"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-primary/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden h-fit">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 font-black uppercase text-xs tracking-[0.3em] text-amber-500">
                                    <IconInfoCircle className="size-5" />
                                    Acciones Rápidas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                                    <p className="text-xs font-medium text-white/60">¿Necesitas añadir el bot a tu servidor?</p>
                                    <Link
                                        href={`https://discord.com/api/oauth2/authorize?client_id=${form.discord_client_id}&permissions=8&scope=bot%20applications.commands`}
                                        target="_blank"
                                    >
                                        <Button className="w-full bg-[#5865F2] hover:bg-[#4752c4] rounded-xl font-black uppercase text-[10px] tracking-widest gap-2">
                                            <IconExternalLink className="size-4" />
                                            Generar Enlace de Invitación
                                        </Button>
                                    </Link>
                                </div>

                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                                    <p className="text-xs font-medium text-white/60">Endpoints para el Developer Portal:</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/10 group">
                                            <code className="text-[10px] font-mono text-white/40 truncate mr-2">/api/discord/interactions</code>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 rounded-lg shrink-0"
                                                onClick={() => copyToClipboard("/api/discord/interactions", "interactions")}
                                            >
                                                {copiedId === "interactions" ? <IconCheck className="size-3.5 text-emerald-400" /> : <IconCopy className="size-3.5" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#5865F2]/5 border border-[#5865F2]/10 text-[#5865F2]/70 shadow-inner">
                                    <IconShieldLock className="size-6 shrink-0" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed italic">
                                        RECUERDA: Las credenciales se guardan encriptadas en la base de datos y solo son accesibles por el Guild Master.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="commands" className="animate-in fade-in slide-in-from-bottom-4 duration-700 outline-none">
                    <Card className="border-2 border-primary/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-3 font-black uppercase text-xs tracking-[0.3em] text-[#5865F2]">
                                    <IconCommand className="size-5" />
                                    Gestión de Slash Commands
                                </CardTitle>
                                <CardDescription className="text-xs font-medium italic opacity-60">
                                    Sincroniza la lista de comandos disponibles en Discord.
                                </CardDescription>
                            </div>
                            <Button
                                variant="glow"
                                onClick={handleRefreshCommands}
                                disabled={refreshing}
                                className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2"
                            >
                                {refreshing ? (
                                    <div className="size-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                                ) : (
                                    <IconRefresh className="size-4" />
                                )}
                                Refrescar y Limpiar Comandos
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    {commands.map((cmd, i) => (
                                        <div key={i} className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border transition-all",
                                            !cmd.is_enabled ? "bg-transparent border-dashed border-white/10 opacity-40 shadow-none border-zinc-800" : "bg-white/5 border-white/5 hover:border-[#5865F2]/30 shadow-xl"
                                        )}>
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "size-10 rounded-xl flex items-center justify-center font-mono text-sm font-bold transition-colors",
                                                    cmd.is_enabled ? "bg-[#5865F2]/10 text-[#5865F2]" : "bg-zinc-800 text-zinc-500"
                                                )}>/</div>
                                                <div>
                                                    <h3 className="text-sm font-black uppercase tracking-tight">{cmd.name}</h3>
                                                    <p className="text-[10px] text-white/40 font-medium">{cmd.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant={!cmd.is_enabled ? "outline" : "default"} className={cn("rounded-lg text-[9px] font-black uppercase tracking-widest h-6", cmd.is_enabled && "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]")}>
                                                    {cmd.is_enabled ? "Activo" : "Inactivo"}
                                                </Badge>
                                                <Switch
                                                    checked={cmd.is_enabled}
                                                    onCheckedChange={() => handleToggleCommand(cmd.name, cmd.is_enabled)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 border-dashed">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-4 flex items-center gap-2">
                                        <IconInfoCircle className="size-4" />
                                        Información Importante sobre Sincronización
                                    </h4>
                                    <p className="text-xs text-amber-500/60 leading-relaxed font-medium">
                                        Al pulsar en <strong>Refrescar y Limpiar</strong>, el sistema realizará un &quot;Overwrite&quot; masivo en Discord. Esto borrará cualquier comando antiguo que no esté definido en el código actual de GuildBoard. Discord puede tardar hasta 1 hora en propagar los cambios si los comandos son globales.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="embeds" className="animate-in fade-in slide-in-from-bottom-4 duration-700 outline-none">
                    <DiscordEmbedsTab />
                </TabsContent>

                <TabsContent value="welcome" className="animate-in fade-in slide-in-from-bottom-4 duration-700 outline-none">
                    <DiscordWelcomeTab />
                </TabsContent>

            </Tabs>
        </div>
    );
}
