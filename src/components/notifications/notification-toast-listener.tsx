"use client"

import React from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { supabase } from "@/infrastructure/supabase/client"

export function NotificationToastListener() {
    const { status } = useSession()
    const [lastNotifiedCount, setLastNotifiedCount] = React.useState<number | null>(null)

    const checkNotifications = React.useCallback(async (isInitial = false) => {
        try {
            const res = await fetch("/api/notifications")
            if (!res.ok) return
            const data = await res.json()
            if (Array.isArray(data)) {
                const unread = data.filter((n: any) => !n.isRead).length

                // On initial check (login), if there are unread notifications
                if (isInitial || lastNotifiedCount === null) {
                    if (unread > 0) {
                        toast("Notificaciones pendientes", {
                            id: "pending-notifications",
                            description: `Tienes ${unread} mensaje${unread > 1 ? 's' : ''} nuevo${unread > 1 ? 's' : ''} en tu bandeja.`
                        })
                    }
                    setLastNotifiedCount(unread)
                }
                // On subsequent checks, if new notifications arrived
                else if (unread > lastNotifiedCount) {
                    toast("Nueva notificación", {
                        description: "Acabas de recibir un mensaje oficial, revisa tus notificaciones."
                    })
                    setLastNotifiedCount(unread)
                } else {
                    setLastNotifiedCount(unread)
                }
            }
        } catch (err) {
            console.error("Failed to check notifications for toast:", err)
        }
    }, [lastNotifiedCount])

    React.useEffect(() => {
        if (status !== "authenticated") return

        checkNotifications(true)

        // Real-time subscription for toasts
        const channel = supabase
            .channel('toast_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'system_notifications',
                },
                () => {
                    checkNotifications()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [status, checkNotifications])

    return null
}
