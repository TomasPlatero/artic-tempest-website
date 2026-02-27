"use client";

import { useState } from "react";
import { IconBell, IconArrowLeft, IconSend, IconInfoCircle, IconTimeline, IconAlertCircle, IconShieldCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/infrastructure/tailwind/tailwind-utils";

export function SettingsNotificationsClient() {
    const [sending, setSending] = useState(false);
    const [form, setForm] = useState({
        title: "",
        content: "",
        type: "info" as "info" | "update" | "warning" | "important"
    });

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

    const types = [
        { id: 'info', label: 'Informativo', icon: IconInfoCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { id: 'update', label: 'Actualización', icon: IconTimeline, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { id: 'warning', label: 'Aviso', icon: IconAlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { id: 'important', label: 'Importante', icon: IconBell, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    ];

    return (
        <div className="flex flex-col gap-8 p-4 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <IconArrowLeft className="size-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        Notificaciones
                    </h1>
                    <p className="text-muted-foreground">Envía notificaciones masivas a todos los usuarios de la plataforma.</p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="border-2 border-primary/10 shadow-xl bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <IconSend className="size-5 text-primary" />
                            Nuevo Mensaje Global
                        </CardTitle>
                        <CardDescription>
                            Este mensaje aparecerá instantáneamente en la bandeja de entrada de cada miembro.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Título del Aviso</label>
                            <Input
                                placeholder="Ej: Nueva versión v1.2 disponible"
                                value={form.title}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, title: e.target.value })}
                                className="h-12 bg-muted/20 border-border/40 focus:border-primary/50 text-base font-bold"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Categoría</label>
                            <div className="flex flex-wrap gap-2">
                                {types.map(t => (
                                    <Button
                                        key={t.id}
                                        variant={form.type === t.id ? "glow" : "outline"}
                                        size="sm"
                                        onClick={() => setForm({ ...form, type: t.id as any })}
                                        className={cn(
                                            "rounded-xl h-10 px-4",
                                            form.type === t.id ? t.color : "opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                                        )}
                                    >
                                        <t.icon className="size-4" />
                                        <span>{t.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Contenido del Mensaje</label>
                            <Textarea
                                placeholder="Escribe aquí los detalles de la actualización o el aviso..."
                                className="min-h-[150px] bg-muted/20 border-border/40 focus:border-primary/50 text-sm leading-relaxed"
                                value={form.content}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, content: e.target.value })}
                            />
                        </div>

                        <Button
                            className="w-full h-14 text-base font-black gap-3"
                            size="lg"
                            disabled={sending}
                            onClick={handleSend}
                        >
                            {sending ? "Enviando..." : <><IconSend className="size-5" /> Emitir Notificación Global</>}
                        </Button>
                    </CardContent>
                </Card>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-500/80">
                    <IconShieldCheck className="size-5 shrink-0" />
                    <p className="text-xs font-medium italic">
                        Nota: Próximamente estos avisos también se enviarán automáticamente al canal configurado en Discord mediante el bot oficial.
                    </p>
                </div>
            </div>
        </div>
    );
}
