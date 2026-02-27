"use client"

import React from "react"
import { useSession } from "next-auth/react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconBell, IconCheck, IconInfoCircle, IconAlertCircle, IconClock } from "@tabler/icons-react"
import { toast } from "sonner"

import { supabase } from "@/infrastructure/supabase/client"

export default function NotificationsPage() {
    const { data: session } = useSession()
    const [notifications, setNotifications] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications")
            const data = await res.json()
            if (Array.isArray(data)) {
                setNotifications(data)
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err)
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => {
        fetchNotifications()

        // Real-time subscription
        const channel = supabase
            .channel('system_notifications_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'system_notifications',
                },
                () => {
                    fetchNotifications()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch("/api/notifications/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: id })
            })
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
                window.dispatchEvent(new CustomEvent('notifications-updated'))
                toast.success("Leído", {
                    description: "Notificación marcada como leída"
                })
            }
        } catch (err) {
            toast.error("Error", {
                description: "No se pudo marcar como leída"
            })
        }
    }

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => !n.isRead)
        if (unread.length === 0) return

        try {
            for (const n of unread) {
                await fetch("/api/notifications/read", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ notificationId: n.id })
                })
            }
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            window.dispatchEvent(new CustomEvent('notifications-updated'))
            toast.success("Éxito", {
                description: "Todas las notificaciones marcadas como leídas"
            })
        } catch (err) {
            toast.error("Error", {
                description: "Error al marcar todas como leídas"
            })
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'warning': return <IconAlertCircle className="size-5 text-amber-500" />
            case 'error': return <IconAlertCircle className="size-5 text-rose-500" />
            default: return <IconInfoCircle className="size-5 text-blue-500" />
        }
    }

    const style = {
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    return (
        <SidebarProvider style={style}>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 max-w-5xl mx-auto w-full">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <IconBell className="size-6 text-blue-500" />
                                Bandeja de Entrada
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Comunicados oficiales y actualizaciones del sistema.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-500/5 text-blue-400 border-blue-500/20 hover:bg-blue-500/10"
                            onClick={markAllAsRead}
                            disabled={!notifications.some(n => !n.isRead)}
                        >
                            <IconCheck className="size-4 mr-2" />
                            Marcar todo como leído
                        </Button>
                    </div>

                    <div className="flex flex-col gap-3 mt-4">
                        {loading ? (
                            <div className="py-20 text-center text-muted-foreground animate-pulse">
                                Cargando notificaciones...
                            </div>
                        ) : notifications.length === 0 ? (
                            <Card className="bg-card/50 border-dashed border-border/40">
                                <CardContent className="py-20 flex flex-col items-center justify-center text-center">
                                    <div className="size-12 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                                        <IconBell className="size-6 text-muted-foreground/40" />
                                    </div>
                                    <h3 className="text-lg font-bold">No tienes notificaciones</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mt-1">
                                        Aquí aparecerán los avisos de actualizaciones y mensajes del sistema.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            notifications.map((n) => (
                                <Card
                                    key={n.id}
                                    className={`relative overflow-hidden transition-all duration-300 border-border/40 ${!n.isRead ? 'bg-blue-500/5 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)]' : 'bg-card/30 opacity-80'}`}
                                >
                                    {!n.isRead && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                                    )}
                                    <CardHeader className="flex flex-row items-start gap-4 pb-2">
                                        <div className={`p-2 rounded-lg bg-background/50 border border-border/20 shadow-sm mt-1`}>
                                            {getTypeIcon(n.type)}
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1">
                                            <div className="flex items-center justify-between gap-4">
                                                <CardTitle className={`text-lg transition-colors ${!n.isRead ? 'text-white' : 'text-foreground/70'}`}>
                                                    {n.title}
                                                </CardTitle>
                                                {!n.isRead && (
                                                    <Badge className="bg-blue-500 text-white hover:bg-blue-600 text-[10px] font-black uppercase tracking-tighter h-5">Nuevo</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                <IconClock className="size-3" />
                                                {new Date(n.created_at).toLocaleDateString("es-ES", { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className={`text-sm leading-relaxed ${!n.isRead ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                                            {n.content}
                                        </p>
                                        {!n.isRead && (
                                            <div className="flex justify-end mt-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-[11px] font-black uppercase text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40"
                                                    onClick={() => markAsRead(n.id)}
                                                >
                                                    <IconCheck className="size-3.5 mr-1.5" />
                                                    Marcar como leído
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
