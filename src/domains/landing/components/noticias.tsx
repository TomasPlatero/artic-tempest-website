"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { IconArrowRight, IconCalendar, IconUserEdit, IconLoader2, IconNews } from "@tabler/icons-react"
import { AdBanner } from "./ad-banner"
import React from "react"
import { CharacterAvatar } from "@/shared/components/character-avatar"

interface NewsItem {
    id: string
    title: string
    slug: string
    summary: string
    content: string
    image_url: string | null
    category: string
    author: string
    is_featured: boolean
    created_at: string
}

export function LandingNoticias() {
    const [news, setNews] = React.useState<NewsItem[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        fetch("/api/guild/news")
            .then(res => res.json())
            .then(data => {
                setNews(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center opacity-20">
                <IconLoader2 className="size-12 animate-spin mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">Cargando Noticias...</p>
            </div>
        )
    }

    if (news.length === 0) return null

    const featuredNews = news.find(n => n.is_featured)
    const otherNews = news.filter(n => !n.is_featured).slice(0, 4)

    return (
        <section id="noticias" className="py-24 px-6 max-w-7xl mx-auto scroll-mt-20">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 md:mb-12 gap-6">
                <div className="text-center sm:text-left">
                    <h2 className="text-[10px] md:text-sm font-black text-blue-300 uppercase tracking-[0.3em] mb-2">Actualidad</h2>
                    <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                        Últimas <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Noticias</span>
                    </h3>
                </div>
                <Link href="/noticias" className="group flex items-center justify-center sm:justify-start gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest border border-white/5 sm:border-none p-3 sm:p-0 rounded-xl bg-white/[0.02] sm:bg-transparent">
                    Ver todas las noticias
                    <IconArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content: 8/12 - News Grid */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Featured News Card */}
                    {featuredNews && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="group relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden border border-white/10"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" aria-hidden="true" />
                            <div className="absolute inset-0 z-0">
                                <div className="absolute inset-0 bg-blue-900/20 mix-blend-overlay group-hover:opacity-0 transition-opacity" aria-hidden="true" />
                                <div className="w-full h-full bg-zinc-900 animate-pulse" /> {/* Placeholder while image loads */}
                                {/* In a real app, use next/image with actual sources */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                                    style={{ backgroundImage: `url(${featuredNews.image_url || '/assets/images/midnight-battle.webp'})` }}
                                />
                            </div>

                            <div className="absolute inset-0 z-20 p-6 md:p-12 flex flex-col justify-end">
                                <div className="flex gap-2 mb-4">
                                    <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-xl">
                                        {featuredNews.category}
                                    </span>
                                </div>
                                <h4 className="text-xl md:text-4xl font-black text-white mb-3 md:mb-4 leading-tight group-hover:text-blue-400 transition-colors italic uppercase tracking-tighter">
                                    {featuredNews.title}
                                </h4>
                                <p className="text-zinc-100 text-xs md:text-lg max-w-2xl line-clamp-2 md:line-clamp-none mb-6 font-medium text-balance opacity-100">
                                    {featuredNews.summary}
                                </p>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-white/10 pt-6">
                                    <div className="flex items-center gap-6 text-zinc-300 text-[10px] font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <CharacterAvatar name={featuredNews.author} size={24} className="border-border/50 shadow-inner" />
                                            {featuredNews.author}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IconCalendar className="size-4 text-blue-500" />
                                            {new Date(featuredNews.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="hidden sm:flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] group-hover:gap-4 transition-all">
                                        Leer noticia
                                        <IconArrowRight className="size-4" />
                                    </div>
                                </div>
                            </div>
                            <Link href={`/noticias/${featuredNews.slug || featuredNews.id}`} className="absolute inset-0 z-30" aria-label={`Leer más sobre ${featuredNews.title}`} />
                        </motion.div>
                    )}

                    {/* Secondary News Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {otherNews.map((n, idx) => (
                            <motion.div
                                key={n.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative flex flex-col bg-zinc-950 border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all"
                            >
                                <div className="relative aspect-video overflow-hidden">
                                    <div className="absolute inset-0 bg-blue-900/10 z-10 group-hover:opacity-0 transition-opacity" aria-hidden="true" />
                                    <div
                                        className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                                        style={{ backgroundImage: `url(${n.image_url || '/assets/images/midnight-battle.webp'})` }}
                                    />
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-blue-300 text-[9px] font-black uppercase tracking-[0.2em]">{n.category}</span>
                                        <span className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest">{new Date(n.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h5 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                                        {n.title}
                                    </h5>
                                    <div className="mt-auto pt-6 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CharacterAvatar name={n.author} size={24} className="border-border/50 shadow-inner" />
                                            <span className="text-[10px] font-bold text-zinc-300">{n.author}</span>
                                        </div>
                                        <IconArrowRight className="size-4 text-zinc-700 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                                <Link href={`/noticias/${n.slug || n.id}`} className="absolute inset-0 z-20" aria-label={`Leer más sobre ${n.title}`} />
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Column (Non-landmark to avoid nesting) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Recruitment Widget */}
                    <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-3xl p-8 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">Reclutamiento</h4>
                            <p className="text-2xl font-black text-white uppercase tracking-tight mb-4">
                                Únete al Roster de Midnight
                            </p>
                            <p className="text-sm text-blue-50 mb-8 leading-relaxed">
                                Buscamos jugadores excepcionales para completar nuestro equipo mítico.
                            </p>
                            <Link
                                href="/reclutamiento"
                                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-800 text-white font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:scale-105"
                            >
                                Aplicar Ahora
                                <IconArrowRight className="size-3" />
                            </Link>
                        </div>
                        {/* Static Decoration */}
                        <div className="absolute top-0 right-0 -mr-12 -mt-12 size-48 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-all pointer-events-none" aria-hidden="true" />
                    </div>

                    {/* Ads Banner */}
                    <div className="space-y-4">
                        <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                            Publicidad <span className="h-px bg-zinc-800 flex-1" />
                        </p>
                        <AdBanner
                            type="restedxp"
                            href="https://shop.restedxp.com/ref/artictempest/"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
