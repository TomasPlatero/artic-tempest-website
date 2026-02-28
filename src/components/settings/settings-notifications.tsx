"use client";

import { IconBell, IconArrowLeft, IconSend, IconInfoCircle, IconTimeline, IconAlertCircle, IconShieldCheck, IconTrash, IconClock } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import DOMPurify from "isomorphic-dompurify";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/infrastructure/tailwind/tailwind-utils";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/infrastructure/supabase/client";

export function SettingsNotificationsClient() {
    const [sending, setSending] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        title: "",
        content: "",
        type: "info" as "info" | "update" | "warning" | "important"
    });
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications");
            const data = await res.json();
            if (Array.isArray(data)) {
                setNotifications(data);
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();

        const channel = supabase
            .channel('settings_notifications_sync')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'system_notifications',
                },
                () => {
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchNotifications]);

    const handleSend = async () => {
        if (!form.title || !form.content) {
            toast.error("Faltan datos", { description: "El título y el contenido son obligatorios." });
            return;
        }

        setSending(true);
        try {
            const res = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                toast.success("Notificación enviada", {
                    description: "Todos los usuarios recibirán el aviso en su bandeja de entrada."
                });
                setForm({ title: "", content: "", type: "info" });
            } else {
                const err = await res.json();
                throw new Error(err.error || "Error al enviar");
            }
        } catch (error: any) {
            toast.error("Error", { description: error.message });
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que quieres eliminar esta notificación? Se borrará para todos los usuarios.")) return;

        setDeletingId(id);
        try {
            const res = await fetch("/api/notifications", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                toast.success("Eliminada", { description: "La notificación ha sido eliminada del sistema." });
            } else {
                const err = await res.json();
                throw new Error(err.error || "Error al eliminar");
            }
        } catch (error: any) {
            toast.error("Error", { description: error.message });
        } finally {
            setDeletingId(null);
        }
    };

    const types = [
        { id: 'info', label: 'Informativo', icon: IconInfoCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { id: 'update', label: 'Actualización', icon: IconTimeline, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { id: 'warning', label: 'Aviso', icon: IconAlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { id: 'important', label: 'Importante', icon: IconBell, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    ];

    const getTypeStyles = (type: string) => {
        const t = types.find(x => x.id === type) || types[0];
        return {
            icon: t.icon,
            color: t.color,
            bg: t.bg,
            label: t.label
        };
    };

    const [activeHistoryFilter, setActiveHistoryFilter] = useState<'all' | 'info' | 'update' | 'warning' | 'important'>('all');

    const filteredNotifications = useMemo(() => {
        if (activeHistoryFilter === 'all') return notifications;
        return notifications.filter(n => n.type === activeHistoryFilter);
    }, [notifications, activeHistoryFilter]);

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 w-full animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/settings">
                        <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10">
                            <IconArrowLeft className="size-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                            Notificaciones
                        </h1>
                        <p className="text-muted-foreground font-medium">Gestiona los comunicados para el equipo de Artic Tempest.</p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="send" className="w-full">
                <div className="flex justify-center mb-8">
                    <TabsList className="grid w-full max-w-md grid-cols-2 h-14 rounded-2xl p-1.5 bg-muted/20 border border-border/20 shadow-2xl backdrop-blur-md">
                        <TabsTrigger
                            value="send"
                            className="rounded-xl font-black uppercase text-[10px] tracking-[0.2em] gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-300"
                        >
                            <IconSend className="size-3.5" /> Enviar
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            className="rounded-xl font-black uppercase text-[10px] tracking-[0.2em] gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-300"
                        >
                            <IconTimeline className="size-3.5" /> Historial
                            {notifications.length > 0 && (
                                <Badge variant="secondary" className="px-1.5 py-0 h-4 bg-muted/30 group-data-[state=active]:bg-white/20 text-[9px] font-bold">{notifications.length}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="send" className="animate-in fade-in slide-in-from-bottom-4 duration-700 outline-none">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <Card className="border-2 border-primary/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-[0_5px_15px_rgba(59,130,246,0.3)]" />
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 font-black uppercase text-xs tracking-[0.3em] text-blue-400">
                                    <IconSend className="size-5" />
                                    Nuevo Mensaje Global
                                </CardTitle>
                                <CardDescription className="text-xs font-medium italic opacity-60">
                                    Este mensaje aparecerá en la bandeja de entrada de cada miembro con su respectivo aviso.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Título del Aviso</label>
                                    <Input
                                        placeholder="Ej: Nueva versión v0.9 Beta"
                                        value={form.title}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, title: e.target.value })}
                                        className="h-14 bg-muted/20 border-border/40 focus:border-blue-500/50 text-base font-bold rounded-2xl transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Categoría</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {types.map(t => (
                                            <Button
                                                key={t.id}
                                                variant={form.type === t.id ? "glow" : "outline"}
                                                size="sm"
                                                onClick={() => setForm({ ...form, type: t.id as any })}
                                                className={cn(
                                                    "rounded-xl h-12 flex flex-col items-center justify-center gap-1 border-border/40 h-auto py-3",
                                                    form.type === t.id ? t.color : "opacity-40 grayscale hover:grayscale-0 hover:opacity-100 bg-muted/10"
                                                )}
                                            >
                                                <t.icon className="size-4" />
                                                <span className="text-[8px] uppercase font-black tracking-widest leading-none">{t.label}</span>
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Contenido del Mensaje</label>
                                    <RichTextEditor
                                        value={form.content}
                                        onChange={(val) => setForm({ ...form, content: val })}
                                        placeholder="Escribe aquí los detalles del anuncio..."
                                    />
                                </div>

                                <Button
                                    className="w-full h-16 text-base font-black gap-3 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all"
                                    size="lg"
                                    disabled={sending}
                                    onClick={handleSend}
                                >
                                    {sending ? (
                                        <div className="flex items-center gap-3">
                                            <div className="size-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                                            <span>Emitiendo Notificación...</span>
                                        </div>
                                    ) : (
                                        <><IconSend className="size-5" /> Emitir Notificación Global</>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="flex items-center gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-500/70 shadow-inner">
                            <IconShieldCheck className="size-6 shrink-0" />
                            <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed italic">
                                Nota: Recuerda que las notificaciones son permanentes a menos que un administrador las elimine manualmente del historial.
                            </p>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-700 outline-none">
                    <div className="w-full space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 flex items-center gap-2">
                                <IconTimeline className="size-4" />
                                Secuencial de envíos registrados
                            </h2>

                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    variant={activeHistoryFilter === 'all' ? "glow" : "outline"}
                                    size="sm"
                                    className="rounded-full text-[9px] font-black uppercase tracking-widest h-8"
                                    onClick={() => setActiveHistoryFilter('all')}
                                >
                                    Todos ({notifications.length})
                                </Button>
                                {types.map(t => (
                                    <Button
                                        key={t.id}
                                        variant={activeHistoryFilter === t.id ? "glow" : "outline"}
                                        size="sm"
                                        onClick={() => setActiveHistoryFilter(t.id as any)}
                                        className={cn(
                                            "rounded-full text-[9px] font-black uppercase tracking-widest h-8 gap-2",
                                            activeHistoryFilter === t.id ? t.color : "opacity-40 grayscale hover:grayscale-0 hover:opacity-100 bg-muted/5"
                                        )}
                                    >
                                        <t.icon className="size-3" />
                                        {t.label} ({notifications.filter((n: any) => n.type === t.id).length})
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-32 w-full bg-muted/10 animate-pulse rounded-2xl border border-border/20" />
                                ))}
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <Card className="bg-card/20 border-dashed border-border/40 py-24 flex flex-col items-center justify-center text-center rounded-3xl backdrop-blur-sm">
                                <div className="size-20 rounded-3xl bg-muted/10 flex items-center justify-center mb-6 opacity-20">
                                    <IconBell className="size-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/50">No hay resultados</h3>
                                <p className="text-[10px] font-medium text-muted-foreground/30 italic mt-2 px-8">No se han encontrado notificaciones emitidas bajo este filtro.</p>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {filteredNotifications.map((n: any) => {
                                    const styles = getTypeStyles(n.type);
                                    return (
                                        <Card key={n.id} className="bg-card/30 border-border/20 hover:border-blue-500/20 transition-all duration-300 group hover:shadow-2xl hover:shadow-blue-500/5 rounded-2xl overflow-hidden">
                                            <CardContent className="p-0">
                                                <div className="flex items-stretch">
                                                    <div className={cn("w-1.5 shrink-0 transition-opacity", styles.bg)} />
                                                    <div className="flex-1 p-6 flex gap-6 items-start">
                                                        <div className={cn("p-4 rounded-2xl shrink-0 border border-current opacity-20 bg-muted/5", styles.color)}>
                                                            <styles.icon className="size-6 text-current" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                                <h3 className="font-black text-lg text-zinc-100 tracking-tight group-hover:text-blue-400 transition-colors uppercase">{n.title}</h3>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDelete(n.id)}
                                                                    disabled={deletingId === n.id}
                                                                    className="size-10 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0 -mt-1 -mr-1"
                                                                >
                                                                    {deletingId === n.id ? (
                                                                        <div className="size-5 border-2 border-rose-500/30 border-t-rose-500 animate-spin rounded-full" />
                                                                    ) : (
                                                                        <IconTrash className="size-5" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                            <div className="relative">
                                                                <div
                                                                    className={cn(
                                                                        "text-sm text-muted-foreground font-medium leading-relaxed mb-4 group-hover:text-zinc-200 transition-colors prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-2 prose-li:my-0.5 prose-img:rounded-xl",
                                                                        !expandedIds.has(n.id) && "line-clamp-3 overflow-hidden"
                                                                    )}
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: DOMPurify.sanitize(n.content)
                                                                    }}
                                                                />
                                                                {n.content?.length > 300 && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => toggleExpand(n.id)}
                                                                        className="h-8 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-0 mb-6"
                                                                    >
                                                                        {expandedIds.has(n.id) ? "Ver menos" : "Seguir leyendo"}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-4">
                                                                <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border border-current/20 shadow-sm", styles.color, styles.bg)}>
                                                                    {styles.label}
                                                                </span>
                                                                <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest ml-auto">
                                                                    <IconClock className="size-4" />
                                                                    {new Date(n.created_at).toLocaleDateString("es-ES", { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
