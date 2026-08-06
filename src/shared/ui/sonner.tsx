"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const ThemedToaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            position="top-right"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:!bg-[#0a192f] group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-blue-50 group-[.toaster]:!border-blue-500/40 group-[.toaster]:shadow-[0_0_20px_rgba(59,130,246,0.15)] group-[.toaster]:rounded-xl font-sans !p-4 !border",
                    description: "group-[.toast]:!text-blue-300/60 !text-[11px] !leading-relaxed mt-1",
                    actionButton:
                        "group-[.toast]:!bg-blue-600 group-[.toast]:!text-white group-[.toast]:font-bold group-[.toast]:px-4",
                    cancelButton:
                        "group-[.toast]:!bg-blue-900/50 group-[.toast]:!text-blue-200 group-[.toast]:px-4",
                    title: "group-[.toast]:!text-blue-100 !font-bold !text-sm tracking-tight",
                },
            }}
            {...props}
        />
    )
}

export { ThemedToaster }
