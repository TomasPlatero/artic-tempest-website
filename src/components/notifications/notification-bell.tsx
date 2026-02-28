"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { IconBell } from "@tabler/icons-react"
import Link from "next/link"
import { supabase } from "@/infrastructure/supabase/client"
import { cn } from "@/infrastructure/tailwind/tailwind-utils"

export function NotificationBell() {
    const { status } = useSession()
    const [unreadCount, setUnreadCount] = useState(0)

    const fetchUnreadCount = useCallback(async () => {
        if (status !== "authenticated") return
        try {
            const res = await fetch("/api/notifications")
            if (res.ok) {
                const data = await res.json()
                if (Array.isArray(data)) {
                    const count = data.filter((n: any) => !n.isRead).length
                    setUnreadCount(count)
                }
            }
        } catch (error) {
            console.error("Error fetching notification count:", error)
        }
    }, [status])

    useEffect(() => {
        if (status !== "authenticated") {
            setUnreadCount(0)
            return
        }

        fetchUnreadCount()

        // Real-time subscription to update the counter
        const channel = supabase
            .channel('bell_notifications')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to any change (insert/delete) to be safe
                    schema: 'public',
                    table: 'system_notifications',
                },
                () => {
                    fetchUnreadCount()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_notifications_read',
                },
                () => {
                    fetchUnreadCount()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [status, fetchUnreadCount])

    if (status !== "authenticated") return null

    return (
        <Link
            href="/notificaciones"
            className="relative p-2 rounded-full hover:bg-white/5 text-white/70 hover:text-white transition-all group"
            title="Ver notificaciones del sistema"
        >
            <IconBell className="size-5 group-hover:scale-110 transition-transform" />
            {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-black text-white ring-2 ring-black animate-in zoom-in duration-300">
                    {unreadCount > 9 ? '+9' : unreadCount}
                </span>
            )}
        </Link>
    )
}
