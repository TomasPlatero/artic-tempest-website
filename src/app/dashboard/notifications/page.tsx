"use client";

import React, { useEffect, useState } from "react";
import { IconBell, IconInfoCircle, IconAlertCircle, IconTimeline, IconCheck } from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/infrastructure/tailwind/tailwind-utils";
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"

interface Notification {
    id: string;
    title: string;
    content: string;
    type: 'info' | 'update' | 'warning' | 'important';
    created_at: string;
    isRead: boolean;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch("/api/notifications/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: id })
            });

            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'update': return <IconTimeline className="size-5 text-blue-400" />;
            case 'warning': return <IconAlertCircle className="size-5 text-amber-400" />;
            case 'important': return <IconBell className="size-5 text-rose-400" />;
            default: return <IconInfoCircle className="size-5 text-emerald-400" />;
        }
    };

    const style = {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    return (
        <SidebarProvider style={style}>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            Bandeja de Entrada
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                {notifications.filter(n => !n.isRead).length} Pendientes
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground">Mensajes del sistema y actualizaciones de la hermandad.</p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 w-full bg-muted/20 animate-pulse rounded-2xl border border-border/40" />
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                            <IconBell className="size-16" />
                            <p className="font-medium">No tienes notificaciones en este momento.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn(
                                        "group relative p-6 rounded-2xl border transition-all duration-300",
                                        n.isRead
                                            ? "bg-muted/10 border-border/20 grayscale-[0.5] opacity-80"
                                            : "bg-card border-primary/20 shadow-lg shadow-primary/5 ring-1 ring-primary/10"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "p-3 rounded-xl border flex-shrink-0",
                                            n.isRead ? "bg-muted/30 border-border/10" : "bg-primary/10 border-primary/20"
                                        )}>
                                            {getTypeIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-4">
                                                <h3 className={cn("text-lg font-bold truncate", n.isRead ? "text-muted-foreground" : "text-foreground")}>
                                                    {n.title}
                                                </h3>
                                                <span className="text-[10px] font-mono text-muted-foreground shrink-0 uppercase">
                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground/80 leading-relaxed whitespace-pre-wrap">
                                                {n.content}
                                            </p>
                                        </div>
                                        {!n.isRead && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="rounded-full hover:bg-primary/20 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => markAsRead(n.id)}
                                            >
                                                <IconCheck className="size-5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
