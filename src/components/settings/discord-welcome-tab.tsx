"use client";

import { useState, useEffect } from "react";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    IconUserPlus,
    IconSettings,
    IconDeviceFloppy,
    IconLoader2,
    IconPhoto,
    IconPalette,
    IconMessageCircle,
    IconTypography,
    IconEye,
    IconUpload
} from "@tabler/icons-react";
import { toast } from "sonner";
import { supabase } from "@/infrastructure/supabase/client";

interface WelcomeConfig {
    guild_id: string;
    is_enabled: boolean;
    channel_id: string | null;
    message_text: string;
    card_background_url: string | null;
    card_background_color: string;
    card_text_color: string;
    card_overlay_opacity: number;
    card_font_family: string;
    card_title_template: string;
    card_subtitle_template: string;
}

const FONT_OPTIONS = [
    { label: "Inter (Moderna)", value: "Inter" },
    { label: "Montserrat (Impacto)", value: "Montserrat" },
    { label: "Bebas Neue (Titular)", value: "Bebas Neue" },
    { label: "Oswald (Condensada)", value: "Oswald" },
    { label: "Cinzel (Épica / WoW)", value: "Cinzel" }
];

export function DiscordWelcomeTab() {
    const [config, setConfig] = useState<WelcomeConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [channels, setChannels] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        fetchConfig();
        fetchChannels();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch("/api/discord/welcome/config");
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
            }
        } catch (e) {
            toast.error("Error al cargar la configuración");
        } finally {
            setLoading(false);
        }
    };

    const fetchChannels = async () => {
        try {
            const res = await fetch("/api/discord/channels");
            if (res.ok) {
                const data = await res.json();
                setChannels(data);
            }
        } catch (e) { }
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            const res = await fetch("/api/discord/welcome/config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                toast.success("Configuración guardada correctamente");
            } else {
                throw new Error();
            }
        } catch (e) {
            toast.error("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bucket', 'guild_assets');
            formData.append('folder', 'welcome_backgrounds');

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Error al subir");
            }

            const data = await res.json();
            setConfig(p => ({ ...p!, card_background_url: data.url }));
            toast.success("Imagen subida correctamente");
        } catch (err: any) {
            toast.error(err.message || "Error al subir la imagen");
        } finally {
            setUploading(false);
        }
    };

    if (loading || !config) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-40">
                <IconLoader2 className="size-10 animate-spin" />
                <p className="font-black uppercase tracking-[0.3em] text-xs italic">Cargando sistema...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full max-w-full animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@700&family=Montserrat:wght@900&family=Oswald:wght@700&display=swap" rel="stylesheet" />

            {/* Header & Main Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="size-14 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center">
                        <IconUserPlus className="size-8 text-[#5865F2]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-3">
                            Sistema de Bienvenidas
                            {config.is_enabled ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-2 py-0 text-[10px] font-black uppercase">Activo</Badge>
                            ) : (
                                <Badge className="bg-white/5 text-white/40 border-none px-2 py-0 text-[10px] font-black uppercase">Inactivo</Badge>
                            )}
                        </h2>
                        <p className="text-xs font-medium text-white/40 mt-1">Saluda a tus nuevos miembros con una tarjeta personalizada al estilo de nuestro clan.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-black/40 p-2 pl-6 rounded-2xl border border-white/5 self-start md:self-center">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Botón de encendido</span>
                    <Switch
                        checked={config.is_enabled}
                        onCheckedChange={async (val) => {
                            setConfig(p => ({ ...p!, is_enabled: val }));
                            try {
                                await fetch("/api/discord/welcome/config", {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ ...config, is_enabled: val })
                                });
                                toast.success(val ? "Sistema de Bienvenidas: Encendido" : "Sistema de Bienvenidas: Apagado");
                            } catch (e) {
                                toast.error("Error al guardar estado");
                            }
                        }}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
                <div className="space-y-8">
                    {/* Channel & Base Text */}
                    <Card className="border-2 border-primary/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden rounded-[2rem]">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3 opacity-60">
                                <IconSettings className="size-4" /> Configuración Base
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Canal de Bienvenida</label>
                                <Select
                                    value={config.channel_id || ""}
                                    onValueChange={(val) => setConfig(p => ({ ...p!, channel_id: val }))}
                                >
                                    <SelectTrigger className="h-12 bg-white/5 border-white/5 text-sm rounded-xl">
                                        <SelectValue placeholder="Selecciona el canal" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#121214] border-white/10 rounded-xl shadow-2xl">
                                        {channels.map(c => (
                                            <SelectItem key={c.id} value={c.id}># {c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Mensaje de Texto</label>
                                    <span className="text-[9px] opacity-40 font-bold uppercase italic tracking-tighter">Variables: {"{user}, {guild}"}</span>
                                </div>
                                <Textarea
                                    value={config.message_text}
                                    onChange={(e) => setConfig(p => ({ ...p!, message_text: e.target.value }))}
                                    placeholder="¡Bienvenido/a {user}!"
                                    className="bg-white/5 border-white/5 rounded-2xl resize-none text-sm font-medium focus:border-[#5865F2]/40 transition-all p-4"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card Customization */}
                    <Card className="border-2 border-primary/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden rounded-[2.5rem]">
                        <CardHeader className="pb-4 border-b border-white/5 bg-white/2">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                                <IconPalette className="size-4 text-[#5865F2]" /> Diseño de la Tarjeta
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                                        <IconPhoto className="size-3" /> Imagen de Fondo
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={config.card_background_url || ""}
                                            onChange={(e) => setConfig(p => ({ ...p!, card_background_url: e.target.value }))}
                                            placeholder="URL o sube una imagen..."
                                            className="h-12 bg-white/5 border-white/5 rounded-xl text-xs font-medium flex-1"
                                        />
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id="welcome-bg-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileUpload}
                                                disabled={uploading}
                                            />
                                            <Button
                                                variant="outline"
                                                className="h-12 w-12 rounded-xl border-white/5 bg-white/5 hover:bg-white/10"
                                                asChild
                                            >
                                                <label htmlFor="welcome-bg-upload" className="cursor-pointer flex items-center justify-center">
                                                    {uploading ? <IconLoader2 className="size-4 animate-spin" /> : <IconUpload className="size-4" />}
                                                </label>
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Color del Texto</label>
                                        <div className="flex gap-2">
                                            <label className="size-10 rounded-lg border border-white/10 cursor-pointer overflow-hidden relative hover:scale-105 transition-transform active:scale-95 shadow-lg">
                                                <div className="absolute inset-0" style={{ backgroundColor: config.card_text_color }} />
                                                <input
                                                    type="color"
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-[200%] h-[200%] -left-1/2 -top-1/2"
                                                    value={config.card_text_color.startsWith('#') ? config.card_text_color : '#FFFFFF'}
                                                    onChange={(e) => setConfig(p => ({ ...p!, card_text_color: e.target.value.toUpperCase() }))}
                                                />
                                            </label>
                                            <div className="relative flex-1 group/color">
                                                <Input
                                                    value={config.card_text_color}
                                                    onChange={(e) => setConfig(p => ({ ...p!, card_text_color: e.target.value }))}
                                                    className="h-10 bg-white/5 border-white/5 font-mono text-center text-xs uppercase rounded-lg transition-all focus:bg-white/10"
                                                    maxLength={7}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Opacidad Overlay</label>
                                        <div className="flex items-center gap-4 h-10">
                                            <Slider
                                                value={[config.card_overlay_opacity * 100]}
                                                onValueChange={([val]: number[]) => setConfig(p => ({ ...p!, card_overlay_opacity: val / 100 }))}
                                                max={100}
                                                step={1}
                                                className="flex-1"
                                            />
                                            <span className="text-[10px] font-black opacity-40 min-w-[30px]">{Math.round(config.card_overlay_opacity * 100)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1 flex items-center gap-2">
                                    <IconTypography className="size-3" /> Fuente del Texto
                                </label>
                                <Select
                                    value={config.card_font_family || "Inter"}
                                    onValueChange={(val) => setConfig(p => ({ ...p!, card_font_family: val }))}
                                >
                                    <SelectTrigger className="h-12 bg-white/5 border-white/5 text-sm font-medium rounded-xl">
                                        <SelectValue placeholder="Selecciona una fuente" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#121214] border-white/10 rounded-xl shadow-2xl">
                                        {FONT_OPTIONS.map(f => (
                                            <SelectItem key={f.value} value={f.value} className="font-medium" style={{ fontFamily: f.value }}>
                                                {f.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <hr className="border-white/5" />

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Título de la Tarjeta</label>
                                    <Input
                                        value={config.card_title_template}
                                        onChange={(e) => setConfig(p => ({ ...p!, card_title_template: e.target.value }))}
                                        className="h-12 bg-white/5 border-white/5 rounded-xl text-sm font-black"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Subtítulo de la Tarjeta</label>
                                    <Input
                                        value={config.card_subtitle_template}
                                        onChange={(e) => setConfig(p => ({ ...p!, card_subtitle_template: e.target.value }))}
                                        className="h-12 bg-white/5 border-white/5 rounded-xl text-xs font-medium text-white/60"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full h-14 bg-[#5865F2] hover:bg-[#4752c4] rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl transition-all shadow-[#5865F2]/20 border-t border-white/10"
                            >
                                {saving ? <IconLoader2 className="size-4 animate-spin mr-2" /> : <IconDeviceFloppy className="size-4 mr-2" />}
                                Guardar Configuración
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Live Preview */}
                <div className="sticky top-8 space-y-6">
                    <div className="px-4 flex items-center gap-3">
                        <IconEye className="size-4 text-white/20" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">Previsualización Premium</h4>
                    </div>

                    {/* Discord Chat Preview */}
                    <div className="bg-[#2b2d31] rounded-[2.5rem] p-8 shadow-2xl border border-white/5 space-y-6 overflow-hidden relative">
                        <div className="flex gap-4">
                            <div className="size-11 rounded-full bg-[#5865F2] flex items-center justify-center shrink-0 shadow-lg border-2 border-white/5">
                                <IconMessageCircle className="size-6 text-white" />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-[15px] text-white">Bot de GuildBoard</span>
                                    <Badge className="bg-[#5865f2] text-[9px] h-4 rounded text-white font-black px-1 border-none shadow-sm">BOT</Badge>
                                    <span className="text-[11px] opacity-40">Hoy a las 22:04</span>
                                </div>

                                <p className="text-[15px] text-[#dbdee1] font-medium leading-normal">
                                    {config.message_text.replace("{user}", "@Tomas").replace("{guild}", "Artic Tempest")}
                                </p>

                                {/* Our Premium Welcome Card Styled Preview */}
                                <div
                                    className="relative w-full aspect-[21/9] rounded-[2rem] overflow-hidden shadow-2xl transition-all group border border-white/10"
                                    style={{ backgroundColor: config.card_background_color }}
                                >
                                    {config.card_background_url && (
                                        <img
                                            src={config.card_background_url}
                                            className="absolute inset-0 w-full h-full object-cover grayscale-[30%] opacity-80"
                                            alt="bg"
                                        />
                                    )}
                                    <div
                                        className="absolute inset-0 backdrop-blur-[2px]"
                                        style={{ backgroundColor: `rgba(0,0,0,${config.card_overlay_opacity})` }}
                                    />

                                    <div className="relative h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                                        {/* Avatar Mask */}
                                        <div className="relative mb-1">
                                            <div className="size-20 rounded-full border-[3px] border-white/20 p-1 bg-black/40 shadow-2xl">
                                                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#5865F2] to-indigo-400 flex items-center justify-center">
                                                    <IconUserPlus className="size-8 text-white/80" />
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 size-7 bg-emerald-500 rounded-full border-[3px] border-[#1e1f22] flex items-center justify-center">
                                                <div className="size-2.5 bg-white transform rotate-45" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3
                                                className="text-2xl font-black uppercase tracking-tighter drop-shadow-2xl"
                                                style={{ color: config.card_text_color, fontFamily: config.card_font_family, fontWeight: config.card_font_family === 'Montserrat' ? 900 : 700 }}
                                            >
                                                {config.card_title_template.replace("{user}", "Tomas").replace("{guild}", "Artic Tempest")}
                                            </h3>
                                            <p
                                                className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80"
                                                style={{ color: config.card_text_color, fontFamily: config.card_font_family, fontWeight: config.card_font_family === 'Montserrat' ? 700 : 600 }}
                                            >
                                                {config.card_subtitle_template.replace("{user}", "Tomas").replace("{guild}", "Artic Tempest")}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Glassmorphism accents */}
                                    <div className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-widest opacity-20 rotate-90 origin-right">
                                        GuildBoard System v2.0
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tip */}
                        <div className="mt-8 p-4 bg-white/2 border border-white/5 rounded-2xl flex items-start gap-3">
                            <span className="text-emerald-400 font-black text-xs">TIP</span>
                            <p className="text-[10px] text-white/40 font-medium italic">
                                Usa imágenes de fondo con resolución panorámica (estilo banner) para que se adapte mejor a la tarjeta.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
