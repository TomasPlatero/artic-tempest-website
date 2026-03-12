"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { UNICODE_EMOJIS } from "@/shared/lib/discord/emojis";
import {
    IconUsers,
    IconHash,
    IconMoodSmile,
    IconSearch,
    IconMessageCircle,
    IconDeviceFloppy,
    IconEdit,
    IconTrash,
    IconPlus,
    IconSend,
    IconLoader2,
    IconEye
} from "@tabler/icons-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { toast } from "sonner";
import { cn } from "@/shared/tailwind/tailwind-utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui/dialog";

interface EmbedItem {
    id: string; // Client-side ID for list management
    title: string;
    description: string;
    color: number;
    thumbnail_url: string;
    image_url: string;
    footer_text: string;
}

interface DiscordEmbed {
    id: string;
    name: string;
    channel_id: string;
    content: string | null;
    embeds: EmbedItem[]; // Multi-embed support
    last_published_at: string | null;
    last_message_id: string | null;
    created_at: string;
}

interface DiscordRole {
    id: string;
    name: string;
    color: number;
}

interface DiscordEmoji {
    id: string;
    name: string;
    animated: boolean;
}

// Internal Emoji Picker Component
function DiscordEmojiPicker({
    onSelect,
    serverEmojis,
    standardEmojis,
    onClose
}: {
    onSelect: (item: any) => void,
    serverEmojis: any[],
    standardEmojis: any[],
    onClose: () => void
}) {
    const [search, setSearch] = useState("");
    const [hovered, setHovered] = useState<any>(null);

    const filteredServer = serverEmojis.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    const filteredStandard = standardEmojis.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col w-[440px] h-[480px] bg-[#1e1f22] rounded-xl shadow-2xl overflow-hidden border border-black/20 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Tabs */}
            <div className="flex items-center p-3 gap-6 border-b border-black/10 bg-[#2b2d31]">
                <div className="flex gap-4">
                    <div className="relative">
                        <span className="text-[14px] font-black text-white cursor-default">Emojis</span>
                        <div className="absolute -bottom-3 left-0 right-0 h-1 bg-[#5865f2] rounded-t-full" />
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="p-3 bg-[#2b2d31]">
                <div className="relative">
                    <input
                        className="w-full bg-[#1e1f22] text-sm p-1.5 px-3 rounded text-white/80 placeholder:text-white/20 focus:outline-none border-none"
                        placeholder="Busca un emoji..."
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <IconSearch className="absolute right-3 top-2.5 size-3.5 text-white/20" />
                </div>
            </div>

            {/* Grid Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4 bg-[#2b2d31]">
                {filteredServer.length > 0 && (
                    <div className="space-y-2">
                        <h5 className="text-[11px] font-black text-white/40 uppercase tracking-wider flex items-center gap-2">
                            <IconUsers className="size-3 text-white/20" /> Artic Tempest
                        </h5>
                        <div className="grid grid-cols-9 gap-1">
                            {filteredServer.map(emoji => (
                                <button
                                    key={emoji.id}
                                    onClick={() => onSelect(emoji)}
                                    onMouseEnter={() => setHovered({ ...emoji, source: 'Artic Tempest' })}
                                    className="size-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all hover:scale-115 active:scale-90"
                                >
                                    <Image
                                        src={`https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? 'gif' : 'webp'}?size=48&quality=lossless`}
                                        className="size-7 object-contain"
                                        alt={emoji.name}
                                        width={28}
                                        height={28}
                                        unoptimized
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {filteredStandard.length > 0 && (
                    <div className="space-y-2">
                        <h5 className="text-[11px] font-black text-white/40 uppercase tracking-wider">Emojis Estándar</h5>
                        <div className="grid grid-cols-9 gap-1">
                            {filteredStandard.map((emoji, idx) => (
                                <button
                                    key={`std-${idx}`}
                                    onClick={() => onSelect(emoji)}
                                    onMouseEnter={() => setHovered({ ...emoji, source: 'Unicode' })}
                                    className="size-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all hover:scale-115 active:scale-90"
                                >
                                    <span className="text-2xl">{emoji.emoji}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Preview */}
            <div className="h-12 bg-[#232428] border-t border-black/10 flex items-center px-4 gap-3 shrink-0">
                {hovered ? (
                    <>
                        <div className="size-8 flex items-center justify-center">
                            {hovered.id ? (
                                <Image
                                    src={`https://cdn.discordapp.com/emojis/${hovered.id}.${hovered.animated ? 'gif' : 'webp'}?size=48&quality=lossless`}
                                    className="size-7 object-contain"
                                    alt={hovered.name}
                                    width={28}
                                    height={28}
                                    unoptimized
                                    onError={(e) => (e.currentTarget.src = "/placeholder-emoji.png")}
                                />
                            ) : (
                                <span className="text-2xl">{hovered.emoji}</span>
                            )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[13px] font-black text-white truncate">:{hovered.name}:</p>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-tight">{hovered.source}</p>
                        </div>
                    </>
                ) : (
                    <p className="text-[11px] font-bold text-white/20 uppercase">Selecciona un emoji</p>
                )}
            </div>
        </div>
    );
}

export function DiscordEmbedsTab() {
    const [embeds, setEmbeds] = useState<DiscordEmbed[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [channels, setChannels] = useState<{ id: string, name: string }[]>([]);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [emojis, setEmojis] = useState<DiscordEmoji[]>([]);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingEmbed, setEditingEmbed] = useState<Partial<DiscordEmbed> | null>(null);
    const [activeEmbedIndex, setActiveEmbedIndex] = useState(0);
    const [saving, setSaving] = useState(false);
    const [publishingId, setPublishingId] = useState<string | null>(null);

    // Suggestion state
    const [suggestionState, setSuggestionState] = useState<{
        active: boolean;
        trigger: "@" | "#" | ":" | null;
        query: string;
        cursorPos: number;
        textareaId: string | null;
    }>({ active: false, trigger: null, query: "", cursorPos: 0, textareaId: null });

    const [pickerState, setPickerState] = useState<{
        open: boolean;
        textareaId: string | null;
        isShared: boolean;
    }>({ open: false, textareaId: null, isShared: false });

    useEffect(() => {
        fetchEmbeds();
        fetchChannels();
        fetchRoles();
        fetchEmojis();
    }, []);

    const fetchEmbeds = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/discord/embeds");
            if (res.ok) {
                const data = await res.json();
                const sanitizedData = data.map((e: any) => ({
                    ...e,
                    embeds: e.embeds || []
                }));
                setEmbeds(sanitizedData);
            }
        } catch (e) {
            toast.error("Error al cargar los embeds");
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

    const fetchRoles = async () => {
        try {
            const res = await fetch("/api/discord/roles");
            if (res.ok) {
                const data = await res.json();
                setRoles(data);
            }
        } catch (e) { }
    };

    const fetchEmojis = async () => {
        try {
            const res = await fetch("/api/discord/emojis");
            if (res.ok) {
                const data = await res.json();
                setEmojis(data);
            }
        } catch (e) { }
    };

    const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>, id: string, isShared: boolean) => {
        const target = e.target as HTMLTextAreaElement;

        // Auto-resize
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;

        const val = target.value;
        const pos = target.selectionStart;
        const textBefore = val.slice(0, pos);

        const lastAt = textBefore.lastIndexOf("@");
        const lastHash = textBefore.lastIndexOf("#");
        const lastColon = textBefore.lastIndexOf(":");

        const lastTriggerPos = Math.max(lastAt, lastHash, lastColon);
        let trigger: "@" | "#" | ":" | null = null;
        if (lastTriggerPos === lastAt) trigger = "@";
        else if (lastTriggerPos === lastHash) trigger = "#";
        else if (lastTriggerPos === lastColon) trigger = ":";

        // Check if there's a trigger and no space between trigger and cursor
        if (lastTriggerPos !== -1 && !textBefore.slice(lastTriggerPos + 1, pos).includes(" ")) {
            setSuggestionState({
                active: true,
                trigger,
                query: textBefore.slice(lastTriggerPos + 1, pos),
                cursorPos: pos,
                textareaId: id
            });
        } else {
            setSuggestionState(p => ({ ...p, active: false }));
        }

        // Update value
        if (isShared) {
            setEditingEmbed(p => ({ ...p!, content: val }));
        } else {
            updateActiveEmbed("description", val);
        }
    };

    const insertMention = (item: any) => {
        if (!suggestionState.textareaId) return;

        const textArea = document.getElementById(suggestionState.textareaId) as HTMLTextAreaElement;
        if (!textArea) return;

        const val = textArea.value;
        const pos = suggestionState.cursorPos;
        const textBefore = val.slice(0, pos);
        const lastTriggerPos = Math.max(
            textBefore.lastIndexOf("@"),
            textBefore.lastIndexOf("#"),
            textBefore.lastIndexOf(":")
        );

        let mention = "";
        if (suggestionState.trigger === "@") mention = `<@&${item.id}> `;
        else if (suggestionState.trigger === "#") mention = `<#${item.id}> `;
        else if (suggestionState.trigger === ":") {
            if (item.id) {
                mention = item.animated ? `<a:${item.name}:${item.id}>` : `<:${item.name}:${item.id}>`;
            } else {
                mention = item.emoji;
            }
        }

        const newVal = val.slice(0, lastTriggerPos) + mention + val.slice(pos);

        if (suggestionState.textareaId === "shared-content") {
            setEditingEmbed(p => ({ ...p!, content: newVal }));
        } else {
            updateActiveEmbed("description", newVal);
        }

        setSuggestionState(p => ({ ...p, active: false }));

        // Refocus and set cursor
        setTimeout(() => {
            textArea.focus();
            const newPos = lastTriggerPos + mention.length;
            textArea.setSelectionRange(newPos, newPos);
            // Trigger auto-resize after mention
            textArea.style.height = 'auto';
            textArea.style.height = `${textArea.scrollHeight}px`;
        }, 10);
    };

    const handleSaveEmbed = async () => {
        if (!editingEmbed?.name || !editingEmbed?.channel_id) {
            toast.error("Nombre y canal son obligatorios");
            return;
        }

        setSaving(true);
        try {
            const isNew = !editingEmbed.id;
            const res = await fetch(isNew ? "/api/discord/embeds" : `/api/discord/embeds/${editingEmbed.id}`, {
                method: isNew ? "POST" : "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingEmbed)
            });

            if (res.ok) {
                toast.success(isNew ? "Embed creado" : "Embed actualizado");
                fetchEmbeds();
                setIsEditorOpen(false);
            } else {
                throw new Error("Error al guardar");
            }
        } catch (e) {
            toast.error("Error al guardar el embed");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEmbed = async (id: string) => {
        if (!confirm("¿Seguro que quieres borrar este mensaje completo?")) return;

        try {
            const res = await fetch(`/api/discord/embeds/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Embed borrado");
                setEmbeds(prev => prev.filter(e => e.id !== id));
            }
        } catch (e) {
            toast.error("Error al borrar");
        }
    };

    const handlePublishEmbed = async (id: string) => {
        setPublishingId(id);
        try {
            const res = await fetch(`/api/discord/embeds/${id}/publish`, { method: "POST" });
            if (res.ok) {
                toast.success("Publicado en Discord");
                fetchEmbeds();
            } else {
                throw new Error("Error en el envío");
            }
        } catch (e) {
            toast.error("Error al publicar");
        } finally {
            setPublishingId(null);
        }
    };

    const createNewEmbedItem = (): EmbedItem => ({
        id: Math.random().toString(36).substring(7),
        title: "Nuevo Embed",
        description: "",
        color: 0x5865F2,
        thumbnail_url: "",
        image_url: "",
        footer_text: ""
    });

    const openNewEmbed = () => {
        setEditingEmbed({
            name: "Nuevo Post Multipanel",
            channel_id: "",
            content: "¡Hey @everyone!",
            embeds: [createNewEmbedItem()]
        });
        setActiveEmbedIndex(0);
        setIsEditorOpen(true);
    };

    const addEmbedItem = () => {
        if (!editingEmbed?.embeds) return;
        if (editingEmbed.embeds.length >= 10) {
            toast.error("Discord solo permite hasta 10 embeds por mensaje");
            return;
        }
        const newEmbeds = [...editingEmbed.embeds, createNewEmbedItem()];
        setEditingEmbed({ ...editingEmbed, embeds: newEmbeds });
        setActiveEmbedIndex(newEmbeds.length - 1);
    };

    const removeEmbedItem = (index: number) => {
        if (!editingEmbed?.embeds || editingEmbed.embeds.length <= 1) return;
        const newEmbeds = editingEmbed.embeds.filter((_, i) => i !== index);
        setEditingEmbed({ ...editingEmbed, embeds: newEmbeds });
        if (activeEmbedIndex >= newEmbeds.length) {
            setActiveEmbedIndex(newEmbeds.length - 1);
        }
    };

    const updateActiveEmbed = (field: keyof EmbedItem, value: any) => {
        if (!editingEmbed?.embeds) return;
        const newEmbeds = [...editingEmbed.embeds];
        newEmbeds[activeEmbedIndex] = { ...newEmbeds[activeEmbedIndex], [field]: value };
        setEditingEmbed({ ...editingEmbed, embeds: newEmbeds });
    };

    const filterEmbeds = embeds.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        channels.find(c => c.id === e.channel_id)?.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* List View */}
            <Card className="border-2 border-primary/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-3 font-black uppercase text-xs tracking-[0.3em] text-[#5865F2]">
                                <IconMessageCircle className="size-5" />
                                Mensajes Multipanel (Discord)
                            </CardTitle>
                            <CardDescription className="text-xs font-medium italic opacity-60">
                                Gestiona anuncios complejos con hasta 10 paneles integrados en un solo mensaje.
                            </CardDescription>
                        </div>
                        <Button
                            variant="glow"
                            className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2"
                            onClick={openNewEmbed}
                        >
                            <IconPlus className="size-4" />
                            Nuevo Mensaje Multipanel
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl h-12">
                        <IconSearch className="size-4 text-white/40" />
                        <Input
                            placeholder="Buscar por nombre o canal..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none focus-visible:ring-0 p-0 h-auto text-sm"
                        />
                    </div>

                    <div className="grid gap-4">
                        {loading ? (
                            <div className="py-24 flex flex-col items-center justify-center opacity-40 italic">
                                <IconLoader2 className="size-10 animate-spin" />
                            </div>
                        ) : filterEmbeds.map((embed) => (
                            <div key={embed.id} className="group relative flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-[#5865F2]/30 transition-all shadow-xl gap-4">
                                <div className="flex items-center gap-5">
                                    <div className="size-10 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center">
                                        <Badge className="bg-[#5865F2] text-white rounded-md text-[9px] font-black">{embed.embeds?.length || 1}</Badge>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-black uppercase tracking-tight">{embed.name}</h3>
                                            {!embed.last_message_id && <Badge className="text-[8px] bg-white/5 text-white/40 border-none">Borrador</Badge>}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-medium text-white/40">
                                            <span># {channels.find(c => c.id === embed.channel_id)?.name || "Sin canal"}</span>
                                            {embed.last_published_at && (
                                                <span className="italic">• Publicado {new Date(embed.last_published_at).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-10 px-4 rounded-xl border-white/10 hover:bg-[#5865F2] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest gap-2"
                                        onClick={() => handlePublishEmbed(embed.id)}
                                        disabled={publishingId === embed.id}
                                    >
                                        {publishingId === embed.id ? <IconLoader2 className="size-3.5 animate-spin" /> : <IconSend className="size-3.5" />}
                                        {embed.last_message_id ? "Actualizar" : "Publicar"}
                                    </Button>
                                    <Button variant="outline" size="icon" className="size-10 rounded-xl" onClick={() => {
                                        setEditingEmbed(embed);
                                        setActiveEmbedIndex(0);
                                        setIsEditorOpen(true);
                                    }}>
                                        <IconEdit className="size-4 text-white/60" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-10 rounded-xl" onClick={() => handleDeleteEmbed(embed.id)}>
                                        <IconTrash className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Multipanel Editor Dialog */}
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <DialogContent className="sm:max-w-none md:w-[1300px] w-[95vw] max-h-[95vh] flex flex-col bg-[#0a0a0b] border-white/10 rounded-[3rem] p-0 gap-0 shadow-2xl overflow-hidden translate-x-[-50%] translate-y-[-50%]">
                    <DialogHeader className="p-10 pb-6 border-b border-white/5 shrink-0 bg-white/2">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                                    Editor Multipanel
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-40">
                                    Diseñando post para Discord: {editingEmbed?.name}
                                </DialogDescription>
                            </div>
                            <div className="flex gap-3">
                                <Badge className="bg-[#5865F2]/20 text-[#5865F2] border-none font-black">{editingEmbed?.embeds?.length || 0}/10 Embeds</Badge>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex flex-1 overflow-hidden h-full">
                        {/* 1. Embed Tabs (Vertical Sidebar) */}
                        <div className="w-[80px] border-r border-white/5 bg-black/40 flex flex-col items-center py-6 gap-3 shrink-0 scrollbar-none overflow-y-auto">
                            {editingEmbed?.embeds?.map((item, idx) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveEmbedIndex(idx)}
                                    className={cn(
                                        "size-12 rounded-2xl flex items-center justify-center transition-all border shrink-0",
                                        activeEmbedIndex === idx
                                            ? "bg-[#5865F2] border-[#5865F2] shadow-lg shadow-[#5865F2]/20 text-white"
                                            : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                    )}
                                >
                                    <span className="font-black text-xs">{idx + 1}</span>
                                </button>
                            ))}
                            <button
                                onClick={addEmbedItem}
                                className="size-12 rounded-2xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-all shrink-0 mt-2"
                            >
                                <IconPlus className="size-5" />
                            </button>
                        </div>

                        {/* 2. Active Embed Editor */}
                        <div className="flex-1 p-10 space-y-8 overflow-y-auto custom-scrollbar bg-white/2">
                            {/* Shared Settings only on first panel or global header? Let's put them always reachable */}
                            <div className="grid grid-cols-2 gap-6 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1">Nombre del Post</label>
                                    <Input
                                        value={editingEmbed?.name || ""}
                                        onChange={(e) => setEditingEmbed(p => ({ ...p!, name: e.target.value }))}
                                        className="h-11 bg-black/20 border-white/5 rounded-xl font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-1">Canal</label>
                                    <Select
                                        value={editingEmbed?.channel_id || ""}
                                        onValueChange={(val) => setEditingEmbed(p => ({ ...p!, channel_id: val }))}
                                    >
                                        <SelectTrigger className="h-11 bg-black/20 border-white/5 rounded-xl">
                                            <SelectValue placeholder="Elegir canal" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#121214] border-white/10">
                                            {channels.map(c => <SelectItem key={c.id} value={c.id}># {c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5865F2] px-1 font-black">Contenido del Mensaje (Markdown / Reglas)</label>
                                    <div className="relative group/field">
                                        <Textarea
                                            id="shared-content"
                                            value={editingEmbed?.content || ""}
                                            onInput={(e) => handleTextareaInput(e, "shared-content", true)}
                                            placeholder="Escribe aquí las reglas o el mensaje principal. Soporta Markdown (# Título, **Negrita**, etc.)"
                                            className="bg-black/20 border-white/5 rounded-[1.5rem] text-[14px] leading-relaxed custom-scrollbar p-6 pr-14 focus:border-[#5865F2]/50 transition-all font-medium overflow-hidden resize-none min-h-[120px]"
                                        />

                                        <button
                                            onClick={() => setPickerState({ open: !pickerState.open, textareaId: 'shared-content', isShared: true })}
                                            className="absolute right-6 top-6 text-white/20 hover:text-[#5865f2] transition-colors"
                                        >
                                            <IconMoodSmile className="size-6" />
                                        </button>

                                        {pickerState.open && pickerState.textareaId === "shared-content" && (
                                            <div className="absolute right-0 top-14 z-[100]">
                                                <DiscordEmojiPicker
                                                    serverEmojis={emojis}
                                                    standardEmojis={UNICODE_EMOJIS}
                                                    onClose={() => setPickerState(p => ({ ...p, open: false }))}
                                                    onSelect={(emoji) => {
                                                        const textArea = document.getElementById('shared-content') as HTMLTextAreaElement;
                                                        const pos = textArea.selectionStart;
                                                        const val = textArea.value;
                                                        const mention = emoji.id
                                                            ? (emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`)
                                                            : emoji.emoji;

                                                        const newVal = val.slice(0, pos) + mention + val.slice(pos);
                                                        setEditingEmbed(p => ({ ...p!, content: newVal }));
                                                        setPickerState(p => ({ ...p, open: false }));
                                                        setTimeout(() => {
                                                            textArea.focus();
                                                            textArea.setSelectionRange(pos + mention.length, pos + mention.length);
                                                            textArea.style.height = 'auto';
                                                            textArea.style.height = `${textArea.scrollHeight}px`;
                                                        }, 10);
                                                    }}
                                                />
                                            </div>
                                        )}
                                        {suggestionState.active && suggestionState.textareaId === "shared-content" && (
                                            <div className="absolute z-50 bg-[#121214] border border-white/10 rounded-xl shadow-2xl mt-1 w-64 max-h-48 overflow-y-auto custom-scrollbar p-1 animate-in zoom-in-95 duration-200">
                                                {(() => {
                                                    const list = suggestionState.trigger === "@" ? roles :
                                                        suggestionState.trigger === "#" ? channels :
                                                            [...emojis, ...UNICODE_EMOJIS];
                                                    return list
                                                        .filter(item => item.name.toLowerCase().includes(suggestionState.query.toLowerCase()))
                                                        .slice(0, 50)
                                                        .map((item: any, idx) => (
                                                            <button
                                                                key={item.id || `uni-${idx}`}
                                                                onClick={() => insertMention(item)}
                                                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors text-left"
                                                            >
                                                                {suggestionState.trigger === "@" && <IconUsers className="size-3.5 text-zinc-500" />}
                                                                {suggestionState.trigger === "#" && <IconHash className="size-3.5 text-zinc-500" />}
                                                                {suggestionState.trigger === ":" && (
                                                                    item.id ? (
                                                                        <Image
                                                                            src={`https://cdn.discordapp.com/emojis/${item.id}.${item.animated ? 'gif' : 'webp'}?size=48&quality=lossless`}
                                                                            className="size-5 object-contain"
                                                                            alt={item.name}
                                                                            width={20}
                                                                            height={20}
                                                                            unoptimized
                                                                        />
                                                                    ) : (
                                                                        <span className="size-5 flex items-center justify-center text-lg leading-none">{item.emoji}</span>
                                                                    )
                                                                )}
                                                                <div className="flex-1 overflow-hidden">
                                                                    <p className="text-xs font-bold text-white/90 truncate">:{item.name}:</p>
                                                                    {suggestionState.trigger !== ":" && <p className="text-[9px] opacity-40 font-mono">ID: {item.id}</p>}
                                                                    {suggestionState.trigger === ":" && !item.id && <p className="text-[9px] opacity-40 font-mono">Emoji Estándar</p>}
                                                                    {suggestionState.trigger === ":" && item.id && <p className="text-[9px] opacity-40 font-mono">Emoji del Servidor</p>}
                                                                </div>
                                                            </button>
                                                        ));
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between px-2 pt-4">
                                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-[#5865F2] flex items-center gap-3 italic">
                                    Editando Panel #{activeEmbedIndex + 1}
                                </h3>
                                {editingEmbed?.embeds && editingEmbed.embeds.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive font-black text-[10px] uppercase gap-2"
                                        onClick={() => removeEmbedItem(activeEmbedIndex)}
                                    >
                                        <IconTrash className="size-3.5" /> Eliminar panel
                                    </Button>
                                )}
                            </div>

                            {editingEmbed?.embeds?.[activeEmbedIndex] && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-tight text-white/80">Título del Panel</label>
                                        <Input
                                            value={editingEmbed.embeds[activeEmbedIndex].title}
                                            onChange={(e) => updateActiveEmbed("title", e.target.value)}
                                            className="h-12 bg-white/5 border-white/5 rounded-xl font-black text-lg"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-tight text-white/80">Descripción / Cuerpo</label>
                                        <div className="relative group/field">
                                            <Textarea
                                                id={`embed-desc-${activeEmbedIndex}`}
                                                value={editingEmbed.embeds[activeEmbedIndex].description}
                                                onInput={(e) => handleTextareaInput(e, `embed-desc-${activeEmbedIndex}`, false)}
                                                placeholder="Contenido principal del panel..."
                                                className="bg-white/5 border-white/5 rounded-xl text-sm leading-relaxed custom-scrollbar p-4 pr-12 overflow-hidden resize-none min-h-[120px]"
                                            />

                                            <button
                                                onClick={() => setPickerState({ open: !pickerState.open, textareaId: `embed-desc-${activeEmbedIndex}`, isShared: false })}
                                                className="absolute right-4 top-4 text-white/20 hover:text-[#5865f2] transition-colors"
                                            >
                                                <IconMoodSmile className="size-5" />
                                            </button>

                                            {pickerState.open && pickerState.textareaId === `embed-desc-${activeEmbedIndex}` && (
                                                <div className="absolute right-0 top-12 z-[100]">
                                                    <DiscordEmojiPicker
                                                        serverEmojis={emojis}
                                                        standardEmojis={UNICODE_EMOJIS}
                                                        onClose={() => setPickerState(p => ({ ...p, open: false }))}
                                                        onSelect={(emoji) => {
                                                            const textArea = document.getElementById(`embed-desc-${activeEmbedIndex}`) as HTMLTextAreaElement;
                                                            const pos = textArea.selectionStart;
                                                            const val = textArea.value;
                                                            const mention = emoji.id
                                                                ? (emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`)
                                                                : emoji.emoji;

                                                            const newVal = val.slice(0, pos) + mention + val.slice(pos);
                                                            updateActiveEmbed("description", newVal);
                                                            setPickerState(p => ({ ...p, open: false }));
                                                            setTimeout(() => {
                                                                textArea.focus();
                                                                textArea.setSelectionRange(pos + mention.length, pos + mention.length);
                                                                textArea.style.height = 'auto';
                                                                textArea.style.height = `${textArea.scrollHeight}px`;
                                                            }, 10);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {suggestionState.active && suggestionState.textareaId === `embed-desc-${activeEmbedIndex}` && (
                                                <div className="absolute z-50 bg-[#121214] border border-white/10 rounded-xl shadow-2xl mt-1 w-64 max-h-48 overflow-y-auto custom-scrollbar p-1 animate-in zoom-in-95 duration-200">
                                                    {(() => {
                                                        const list = suggestionState.trigger === "@" ? roles :
                                                            suggestionState.trigger === "#" ? channels :
                                                                [...emojis, ...UNICODE_EMOJIS];
                                                        return list
                                                            .filter(item => item.name.toLowerCase().includes(suggestionState.query.toLowerCase()))
                                                            .slice(0, 50)
                                                            .map((item: any, idx) => (
                                                                <button
                                                                    key={item.id || `uni-desc-${idx}`}
                                                                    onClick={() => insertMention(item)}
                                                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors text-left"
                                                                >
                                                                    {suggestionState.trigger === "@" && <IconUsers className="size-3.5 text-zinc-500" />}
                                                                    {suggestionState.trigger === "#" && <IconHash className="size-3.5 text-zinc-500" />}
                                                                    {suggestionState.trigger === ":" && (
                                                                        item.id ? (
                                                                            <Image
                                                                                src={`https://cdn.discordapp.com/emojis/${item.id}.${item.animated ? 'gif' : 'webp'}?size=48&quality=lossless`}
                                                                                className="size-5 object-contain"
                                                                                alt={item.name}
                                                                                width={20}
                                                                                height={20}
                                                                                unoptimized
                                                                            />
                                                                        ) : (
                                                                            <span className="size-5 flex items-center justify-center text-lg leading-none">{item.emoji}</span>
                                                                        )
                                                                    )}
                                                                    <div className="flex-1 overflow-hidden">
                                                                        <p className="text-xs font-bold text-white/90 truncate">:{item.name}:</p>
                                                                        {suggestionState.trigger !== ":" && <p className="text-[9px] opacity-40 font-mono">ID: {item.id}</p>}
                                                                        {suggestionState.trigger === ":" && !item.id && <p className="text-[9px] opacity-40 font-mono">Emoji Estándar</p>}
                                                                        {suggestionState.trigger === ":" && item.id && <p className="text-[9px] opacity-40 font-mono">Emoji del Servidor</p>}
                                                                    </div>
                                                                </button>
                                                            ));
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Color de Borde</label>
                                            <div className="flex gap-3">
                                                <label className="size-11 rounded-xl border border-white/10 flex-shrink-0 cursor-pointer overflow-hidden relative hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-black/40">
                                                    <div
                                                        className="absolute inset-0"
                                                        style={{ backgroundColor: `#${editingEmbed.embeds[activeEmbedIndex].color.toString(16).padStart(6, '0')}` }}
                                                    />
                                                    <input
                                                        type="color"
                                                        className="absolute inset-0 opacity-0 cursor-pointer w-[200%] h-[200%] -left-1/2 -top-1/2"
                                                        value={`#${editingEmbed.embeds[activeEmbedIndex].color.toString(16).padStart(6, '0')}`}
                                                        onChange={(e) => {
                                                            const hex = e.target.value.replace('#', '');
                                                            updateActiveEmbed("color", parseInt(hex, 16));
                                                        }}
                                                    />
                                                </label>
                                                <div className="relative flex-1 group/input">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 font-mono text-sm group-focus-within/input:text-[#5865F2] transition-colors">#</span>
                                                    <Input
                                                        value={editingEmbed.embeds[activeEmbedIndex].color.toString(16).toUpperCase().padStart(6, '0')}
                                                        onChange={(e) => {
                                                            const clean = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
                                                            updateActiveEmbed("color", parseInt(clean || "0", 16));
                                                        }}
                                                        maxLength={6}
                                                        className="h-11 bg-white/5 border-white/5 rounded-xl font-mono pl-7 transition-all focus:bg-white/10"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Miniatura (URL)</label>
                                            <Input
                                                value={editingEmbed.embeds[activeEmbedIndex].thumbnail_url}
                                                onChange={(e) => updateActiveEmbed("thumbnail_url", e.target.value)}
                                                className="h-11 bg-white/5 border-white/5 rounded-xl text-[10px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Imagen Grande / Banner (URL)</label>
                                        <Input
                                            value={editingEmbed.embeds[activeEmbedIndex].image_url}
                                            onChange={(e) => updateActiveEmbed("image_url", e.target.value)}
                                            className="h-11 bg-white/5 border-white/5 rounded-xl text-[10px]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Texto de Pie de Página (Footer)</label>
                                        <Input
                                            value={editingEmbed.embeds[activeEmbedIndex].footer_text}
                                            onChange={(e) => updateActiveEmbed("footer_text", e.target.value)}
                                            className="h-11 bg-white/5 border-white/5 rounded-xl text-[10px] font-bold opacity-60"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Real-time Multi-Preview */}
                        <div className="w-[500px] p-10 bg-black/40 border-l border-white/5 overflow-y-auto custom-scrollbar shrink-0">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 px-2 flex items-center gap-3 mb-8">
                                <IconEye className="size-4" /> Live Discord Preview
                            </h4>

                            <div className="flex gap-4">
                                <div className="size-11 rounded-full bg-[#5865F2] flex items-center justify-center shrink-0 shadow-lg">
                                    <IconMessageCircle className="size-6 text-white" />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-[15px] text-white">Bot de GuildBoard</span>
                                        <Badge className="bg-[#5865f2] text-[9px] h-4 rounded-sm text-white font-black px-1 border-none">BOT</Badge>
                                        <span className="text-[11px] opacity-40">Hoy a las 22:15</span>
                                    </div>

                                    {editingEmbed?.content && (
                                        <p className="text-[15px] text-[#dcddde] leading-normal whitespace-pre-wrap">{editingEmbed.content}</p>
                                    )}

                                    <div className="space-y-2">
                                        {editingEmbed?.embeds?.map((item, idx) => (
                                            <div
                                                key={item.id}
                                                className={cn(
                                                    "rounded border-l-4 bg-[#2f3136] p-4 shadow-sm relative group overflow-hidden transition-all",
                                                    activeEmbedIndex === idx ? "ring-2 ring-[#5865F2]/20 border-l-[6px]" : "border-l-4"
                                                )}
                                                style={{ borderLeftColor: `#${item.color.toString(16).padStart(6, '0')}` }}
                                            >
                                                <div className="flex justify-between gap-4">
                                                    <div className="space-y-1 flex-1 min-w-0">
                                                        {item.title && <h3 className="font-bold text-[16px] text-white hover:text-[#00aff4] cursor-pointer break-words">{item.title}</h3>}
                                                        {item.description && <p className="text-[14px] text-[#dcddde] whitespace-pre-wrap break-words">{item.description}</p>}
                                                    </div>
                                                    {item.thumbnail_url && <Image src={item.thumbnail_url} width={80} height={80} className="size-20 rounded object-cover shrink-0" alt="thumb" unoptimized />}
                                                </div>
                                                {item.image_url && <Image src={item.image_url} width={450} height={300} className="mt-3 rounded w-full max-h-[300px] object-cover" alt="banner" unoptimized />}
                                                {item.footer_text && <div className="mt-3 text-[11px] text-[#b9bbbe] font-medium">{item.footer_text}</div>}

                                                {activeEmbedIndex === idx && (
                                                    <div className="absolute top-1 right-1 bg-[#5865F2] text-[8px] font-black px-1.5 py-0.5 rounded text-white active-label">ACTIVO</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-10 border-t border-white/5 bg-white/2 flex flex-col md:flex-row gap-4 items-center justify-end shrink-0">
                        <Button
                            variant="ghost"
                            className="w-full md:w-auto h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white/40 hover:text-white"
                            onClick={() => setIsEditorOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="glow"
                            className="w-full md:w-auto px-16 h-12 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl"
                            onClick={handleSaveEmbed}
                            disabled={saving}
                        >
                            {saving ? <IconLoader2 className="mr-3 h-4 w-4 animate-spin" /> : <IconDeviceFloppy className="mr-3 h-4 w-4" />}
                            Guardar todo el Post
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
