"use client"

import React from "react"
import {
    IconBrandX,
    IconBrandFacebook,
    IconBrandWhatsapp,
    IconBrandTelegram,
    IconLink,
    IconCheck
} from "@tabler/icons-react"
import { Button } from "../ui/button"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface ShareBarProps {
    title: string
    url: string
}

export function ShareBar({ title, url }: ShareBarProps) {
    const [copied, setCopied] = React.useState(false)

    const encodedTitle = encodeURIComponent(title)
    const encodedUrl = encodeURIComponent(url)

    const shareLinks = [
        {
            name: "X",
            icon: IconBrandX,
            href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
            color: "hover:bg-zinc-800",
        },
        {
            name: "Facebook",
            icon: IconBrandFacebook,
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            color: "hover:bg-blue-600",
        },
        {
            name: "WhatsApp",
            icon: IconBrandWhatsapp,
            href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
            color: "hover:bg-green-600",
        },
        {
            name: "Telegram",
            icon: IconBrandTelegram,
            href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
            color: "hover:bg-sky-500",
        },
    ]

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            toast.success("Enlace copiado al portapapeles")
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast.error("Error al copiar el enlace")
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-2 py-6 border-b border-white/5 mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mr-2">Compartir:</span>

            <div className="flex items-center gap-2">
                {shareLinks.map((platform) => (
                    <a
                        key={platform.name}
                        href={platform.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`size-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/5 text-zinc-400 transition-all duration-300 ${platform.color} hover:text-white hover:border-transparent hover:scale-110 active:scale-95 shadow-lg group`}
                        title={`Compartir en ${platform.name}`}
                    >
                        <platform.icon className="size-5 transition-transform group-hover:rotate-6" />
                    </a>
                ))}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyToClipboard}
                    className="size-10 rounded-xl bg-white/[0.03] border border-white/5 text-zinc-400 hover:bg-blue-600 hover:text-white hover:border-transparent transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg group"
                    title="Copiar enlace"
                >
                    <AnimatePresence mode="wait">
                        {copied ? (
                            <motion.div
                                key="check"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                            >
                                <IconCheck className="size-5" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="link"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                            >
                                <IconLink className="size-5 transition-transform group-hover:-rotate-12" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Button>
            </div>
        </div>
    )
}
