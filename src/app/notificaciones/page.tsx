"use client"

import React, { useEffect, useState } from "react"
import { LandingNavigation } from "@/components/landing/navigation"
import { LandingFooter } from "@/components/landing/footer"
import { IconBell, IconInfoCircle, IconAlertCircle, IconTimeline, IconCheck, IconTrash } from "@tabler/icons-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Image from "next/image"
import DOMPurify from "isomorphic-dompurify"

interface Notification {
    id: string
    title: string
    content: string
    type: 'info' | 'update' | 'warning' | 'important'
    created_at: string
    isRead: boolean
}

export default function PublicNotificationsPage() {
    const { data: session, status } = useSession()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'read' | 'info' | 'update' | 'warning' | 'important'>('all')
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data)
            }
        } catch (error) {
            console.error("Error fetching notifications:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (status === "unauthenticated") {
            redirect("/")
        }
        if (status === "authenticated") {
            fetchNotifications()
        }
    }, [status])

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch("/api/notifications/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: id })
            })

            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
            }
        } catch (error) {
            console.error("Error marking as read:", error)
        }
    }

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
        if (unreadIds.length === 0) return

        try {
            const res = await fetch("/api/notifications/read-all", { method: "POST" })
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            }
        } catch (error) {
            console.error("Error marking all as read:", error)
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'update': return <IconTimeline className="size-5 text-blue-400" />
            case 'warning': return <IconAlertCircle className="size-5 text-amber-400" />
            case 'important': return <IconBell className="size-5 text-rose-400" />
            default: return <IconInfoCircle className="size-5 text-emerald-400" />
        }
    }

    const filteredNotifications = notifications.filter(n => {
        if (activeFilter === 'all') return true
        if (activeFilter === 'unread') return !n.isRead
        if (activeFilter === 'read') return n.isRead
        return n.type === activeFilter
    })

    if (status === "loading") return null

    return (
        <main className="min-h-screen bg-black flex flex-col relative overflow-hidden">
            {/* Background Image & Decor */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none overflow-hidden h-full w-full">
                <Image
                    src="/assets/images/housing-contact.webp"
                    alt="Background"
                    fill
                    className="object-cover blur-[2px] opacity-30 scale-105"
                    sizes="100vw"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
            </div>

            <LandingNavigation />

            <div className="relative z-10 flex-1 py-32 px-6 max-w-7xl mx-auto w-full">
                <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-2xl border border-blue-500/20">
                            <IconBell className="size-8 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tight">Bandeja de Entrada</h1>
                            <p className="text-zinc-500 mt-1">Mensajes directos del equipo de Artic Tempest.</p>
                        </div>
                    </div>
                    {notifications.some(n => !n.isRead) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 h-9 px-4 rounded-xl border border-white/5 mb-1"
                        >
                            Marcar todo como leído
                        </Button>
                    )}
                </header>

                {/* Filtros / Categorías */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'unread', label: 'Sin leer', count: notifications.filter(n => !n.isRead).length },
                        { id: 'read', label: 'Leídos', count: notifications.filter(n => n.isRead).length },
                        { id: 'info', label: 'Informativo', count: notifications.filter(n => n.type === 'info' && !n.isRead).length },
                        { id: 'update', label: 'Actualización', count: notifications.filter(n => n.type === 'update' && !n.isRead).length },
                        { id: 'warning', label: 'Aviso', count: notifications.filter(n => n.type === 'warning' && !n.isRead).length },
                        { id: 'important', label: 'Importante', count: notifications.filter(n => n.type === 'important' && !n.isRead).length },
                    ].map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id as any)}
                            className={cn(
                                "whitespace-nowrap px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 flex items-center gap-2",
                                activeFilter === filter.id
                                    ? "bg-blue-500 text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                    : "bg-white/5 text-zinc-500 border-white/10 hover:border-white/20 hover:text-zinc-300"
                            )}
                        >
                            {filter.label}
                            {((filter.id === 'all' && notifications.filter(n => !n.isRead).length > 0) || (filter.count !== undefined && filter.count > 0)) && (
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-md text-[9px] min-w-4 flex items-center justify-center font-bold",
                                    activeFilter === filter.id ? "bg-white/20 text-white" : "bg-white/10 text-zinc-400"
                                )}>
                                    {filter.id === 'all' ? notifications.filter(n => !n.isRead).length : filter.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 w-full bg-white/5 animate-pulse rounded-3xl border border-white/5" />
                            ))}
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-20 text-center backdrop-blur-md animate-in fade-in zoom-in duration-500">
                            <IconBell className="size-16 text-zinc-700 mx-auto mb-6 opacity-20" />
                            <p className="text-zinc-500 font-medium italic">
                                {activeFilter === 'unread' || activeFilter === 'all'
                                    ? "¡Estás al día! No tienes mensajes sin leer."
                                    : activeFilter === 'read'
                                        ? "No tienes mensajes leídos todavía."
                                        : "No se han encontrado mensajes sin leer en esta categoría."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredNotifications.map((n) => (
                                <article
                                    key={n.id}
                                    className={cn(
                                        "group relative p-6 rounded-3xl border transition-all duration-500 backdrop-blur-md overflow-hidden",
                                        n.isRead
                                            ? "bg-white/[0.02] border-white/5 opacity-60"
                                            : "bg-white/[0.05] border-blue-500/20 shadow-2xl shadow-blue-500/5 ring-1 ring-blue-500/10"
                                    )}
                                >
                                    {!n.isRead && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] -z-10" />
                                    )}

                                    <div className="flex items-start gap-6">
                                        <div className={cn(
                                            "p-3.5 rounded-2xl border flex-shrink-0 transition-colors duration-500",
                                            n.isRead ? "bg-white/5 border-white/5" : "bg-blue-500/10 border-blue-500/20"
                                        )}>
                                            {getTypeIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <h3 className={cn("text-xl font-bold transition-colors duration-500", n.isRead ? "text-zinc-500" : "text-white")}>
                                                    {n.title}
                                                </h3>
                                                <time className="text-[10px] font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                                                </time>
                                            </div>
                                            <div className="relative">
                                                <div
                                                    className={cn(
                                                        "text-base leading-relaxed transition-colors duration-500 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-2 prose-li:my-0.5 prose-img:rounded-xl",
                                                        n.isRead ? "text-zinc-600" : "text-zinc-400",
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
                                                        className="h-8 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-0 mt-2"
                                                    >
                                                        {expandedIds.has(n.id) ? "Ver menos" : "Seguir leyendo"}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        {!n.isRead && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-full bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 md:opacity-0 group-hover:opacity-100 transition-all text-[10px] font-black uppercase tracking-widest px-4"
                                                onClick={() => markAsRead(n.id)}
                                            >
                                                <IconCheck className="size-3.5 mr-2" />
                                                Leído
                                            </Button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <LandingFooter />
        </main>
    )
}
