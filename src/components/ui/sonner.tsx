"use client"

import { useTheme } from "next-themes"
import { Toaster } from "sileo"

export function ThemedToaster() {
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark"

    return (
        <Toaster
            position="top-right"
            options={{
                fill: isDark ? "#171717" : "#FFFFFF",
                roundness: 16,
                styles: isDark
                    ? {
                        title: "text-white!",
                        description: "text-white/75!",
                        badge: "bg-white/10!",
                        button: "bg-white/10! hover:bg-white/15!",
                    }
                    : {
                        title: "text-neutral-900!",
                        description: "text-neutral-600!",
                        badge: "bg-neutral-900/10!",
                        button: "bg-neutral-900/10! hover:bg-neutral-900/15!",
                    },
            }}
        />
    )
}
