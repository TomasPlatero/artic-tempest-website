"use client"

import React from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { supabase } from "@/shared/supabase/client"

export function NotificationToastListener() {
    const { status } = useSession()
    const router = useRouter()
    const [lastNotifiedCount, setLastNotifiedCount] = React.useState<number | null>(null)
    const [guildInfo, setGuildInfo] = React.useState<{ name: string, icon_url: string | null } | null>(null)

    // Request notification permission and fetch guild info on mount
    React.useEffect(() => {
        fetch("/api/guild/info")
            .then(res => res.json())
            .then(data => setGuildInfo(data))
            .catch(() => { })
    }, [])

    const sendNativeNotification = React.useCallback((title: string, body: string) => {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, {
                body,
                icon: guildInfo?.icon_url || "/favicon.ico",
            })
        }
    }, [guildInfo])

    const checkNotifications = React.useCallback(async (isInitial = false) => {
        try {
            const res = await fetch("/api/notifications")
            if (!res.ok) return
            const data = await res.json()
            if (Array.isArray(data)) {
                const unread = data.filter((n: any) => !n.isRead).length
                const latest = data.find((n: any) => !n.isRead)

                // Check recruitment applications count (returns 0 if not officer/gm)
                let appCount = 0
                try {
                    const appRes = await fetch("/api/recruitment/count")
                    if (appRes.ok) {
                        const appData = await appRes.json()
                        appCount = appData.count || 0
                    }
                } catch (e) {
                    // Ignore error on fetch applications
                }

                // Update native App Icon Badge using the badging API
                const totalBadgeCount = unread + appCount
                if ('setAppBadge' in navigator) {
                    if (totalBadgeCount > 0) {
                        (navigator as any).setAppBadge(totalBadgeCount).catch(console.error)
                    } else {
                        (navigator as any).clearAppBadge().catch(console.error)
                    }
                }

                // On initial check (login), if there are unread notifications
                if (isInitial || lastNotifiedCount === null) {
                    if (unread > 0) {
                        toast("Notificaciones pendientes", {
                            id: "pending-notifications",
                            description: `Tienes ${unread} mensaje${unread > 1 ? 's' : ''} nuevo${unread > 1 ? 's' : ''} en tu bandeja.`,
                            action: {
                                label: "Ver bandeja",
                                onClick: () => router.push("/notificaciones")
                            }
                        })
                    }
                    setLastNotifiedCount(unread)
                }
                // On subsequent checks, if new notifications arrived
                else if (unread > lastNotifiedCount) {
                    const title = latest?.title || "Nueva notificación"
                    const message = "Acabas de recibir un mensaje oficial, revisa tus notificaciones."

                    toast(title, {
                        description: message,
                        action: {
                            label: "Ver ahora",
                            onClick: () => router.push("/notificaciones")
                        }
                    })

                    sendNativeNotification(
                        `${guildInfo?.name || "Artic Tempest"}: ${title}`,
                        message
                    )

                    setLastNotifiedCount(unread)
                } else {
                    setLastNotifiedCount(unread)
                }
            }
        } catch (err) {
            console.error("Failed to check notifications for toast:", err)
        }
    }, [lastNotifiedCount, guildInfo, sendNativeNotification])

    React.useEffect(() => {
        if (status !== "authenticated") return

        checkNotifications(true)

        // Real-time subscription for toasts
        const channel = supabase
            .channel('toast_notifications')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'system_notifications',
                },
                () => {
                    checkNotifications()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'recruitment_applications',
                },
                () => {
                    checkNotifications()
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log("Realtime Toast Notifications: Conectado (SUBSCRIBED)")
                } else if (status === 'CLOSED') {
                    // Normal React unmount, ignore false warning
                } else {
                    console.warn(`Realtime Toast Notifications: ${status}`)
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [status, checkNotifications])

    return null
}
