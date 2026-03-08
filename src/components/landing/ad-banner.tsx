"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { IconExternalLink } from "@tabler/icons-react"

interface AdBannerProps {
    type: "restedxp" | "generic"
    href: string
    title?: string
    description?: string
    imageSrc?: string
}

export function AdBanner({ type, href, title, description, imageSrc }: AdBannerProps) {
    if (type === "restedxp") {
        return (
            <motion.div
                whileHover={{ scale: 1.02 }}
                className="group relative overflow-hidden rounded-2xl border border-orange-500/30 bg-black shadow-2xl aspect-[4/5] md:aspect-auto md:h-[300px]"
            >
                <Link href="https://shop.restedxp.com/ref/artictempest/" target="_blank" className="relative block h-full w-full">
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                        <Image
                            src="https://community.restedxp.com/wp-content/uploads/2026/02/rxp-promo-panel-midnight-2.jpg"
                            alt="RestedXP Midnight Promo"
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                    </div>

                    <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                        <div className="flex items-center justify-between mb-2">
                            <div className="bg-orange-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-xl">
                                Partner Oficial
                            </div>
                            <IconExternalLink className="size-5 text-white/40 group-hover:text-white transition-colors" />
                        </div>

                        <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight group-hover:text-orange-400 transition-colors">
                            El Maestro <span className="text-orange-500">del Leveo</span>
                        </h3>
                        <p className="text-zinc-300 text-xs font-medium mt-1 mb-4 line-clamp-2">
                            Sube de nivel como un profesional con las guías más rápidas del mundo.
                        </p>

                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 underline underline-offset-4">Obtén un 5% de Descuento</span>
                            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Comprar Ahora</span>
                        </div>
                    </div>

                    {/* Edge Glow */}
                    <div className="absolute inset-0 border border-white/10 rounded-2xl z-30 pointer-events-none" />
                </Link>
            </motion.div>
        )
    }

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 p-4"
        >
            <Link href={href} className="block">
                {imageSrc && (
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                        <Image src={imageSrc} alt={title || "Ad"} fill className="object-cover" />
                    </div>
                )}
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-white uppercase">{title}</h3>
                    <IconExternalLink className="size-4 text-white/20" />
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
            </Link>
        </motion.div>
    )
}
