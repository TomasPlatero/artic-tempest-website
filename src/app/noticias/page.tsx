import { createAdminClient } from "@/shared/supabase/server"
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://artictempest.es'
import { IconCalendar, IconUserEdit, IconArrowRight } from "@tabler/icons-react"
import Link from "next/link"
import React from "react"
import Image from "next/image"
import { LandingNavigation } from "@/domains/landing/components/navigation"
import { LandingFooter } from "@/domains/landing/components/footer"
import { CharacterAvatar } from "@/shared/components/character-avatar"

import { Metadata } from "next"

export const metadata: Metadata = {
    title: 'Noticias | Artic Tempest',
    description: 'Mantente al día con las últimas noticias, eventos y actualizaciones de la hermandad Artic Tempest en World of Warcraft.',
    openGraph: {
        title: 'Noticias | Artic Tempest',
        description: 'Actualidad y novedades de la hermandad Artic Tempest.',
        url: `${baseUrl}/noticias`,
        siteName: 'Artic Tempest',
        type: 'website',
    }
}

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

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    const { page } = await searchParams
    const currentPage = parseInt(page || '1')
    const itemsPerPage = 10
    const from = (currentPage - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    const supabase = await createAdminClient()

    // Fetch total count for pagination
    const { count } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')

    // Fetch news for the current page
    const { data: news } = await supabase
        .from('news')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(from, to)

    const newsItems = (news || []) as NewsItem[]
    const totalPages = Math.ceil((count || 0) / itemsPerPage)

    // Only show "Featured" on the first page
    const featuredNews = currentPage === 1 ? newsItems.find(item => item.is_featured) : null
    const otherNews = featuredNews ? newsItems.filter(item => item.id !== featuredNews.id) : newsItems

    return (
        <div className="min-h-screen bg-black selection:bg-blue-500/30 dark">
            <LandingNavigation />
            <main id="main-content" className="pt-32 pb-20 px-4 md:px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-center md:text-left">
                                Últimas <span className="text-blue-500 italic">Noticias</span>
                            </h1>
                            <p className="text-zinc-500 mt-4 font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs text-center md:text-left">
                                Actualidad y novedades de Artic Tempest
                            </p>
                        </div>
                    </div>

                    {newsItems.length === 0 ? (
                        <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-[40px]">
                            <p className="text-zinc-500 font-bold uppercase tracking-widest">No hay noticias publicadas todavía.</p>
                        </div>
                    ) : (
                        <div className="space-y-20">
                            {/* Featured News - Page 1 only */}
                            {featuredNews && (
                                <section>
                                    <Link href={`/noticias/${featuredNews.slug || featuredNews.id}`} className="group relative block aspect-[21/9] min-h-[400px] w-full overflow-hidden rounded-[40px] border border-white/10 shadow-2xl">
                                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                        <Image
                                            src={featuredNews.image_url || 'https://artictempest.es/assets/images/midnight-battle.webp'}
                                            alt={featuredNews.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                                        />

                                        <div className="absolute inset-0 z-20 p-6 md:p-12 flex flex-col justify-end max-w-4xl">
                                            <div className="flex gap-2 mb-4 md:mb-6">
                                                <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-xl">
                                                    Destacado
                                                </span>
                                                <span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest hidden xs:inline">
                                                    {featuredNews.category}
                                                </span>
                                            </div>
                                            <h2 className="text-xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-3 md:mb-4 group-hover:text-blue-400 transition-colors leading-tight">
                                                {featuredNews.title}
                                            </h2>
                                            <p className="text-zinc-300 text-xs md:text-base line-clamp-2 mb-6 md:mb-8 max-w-2xl opacity-80 md:opacity-100">
                                                {featuredNews.summary}
                                            </p>
                                            <div className="flex items-center gap-4 md:gap-6 text-zinc-400 text-[10px] font-black uppercase tracking-widest overflow-hidden">
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <CharacterAvatar name={featuredNews.author} size={28} className="border-border/50 shadow-xl" />
                                                    <span className="truncate max-w-[100px]">{featuredNews.author}</span>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <IconCalendar className="size-4 text-blue-500" />
                                                    {new Date(featuredNews.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </section>
                            )}

                            {/* Other News Grid */}
                            {otherNews.length > 0 && (
                                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {otherNews.map((item) => (
                                        <Link
                                            key={item.id}
                                            href={`/noticias/${item.slug || item.id}`}
                                            className="group bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden hover:bg-white/[0.04] transition-all hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col"
                                        >
                                            <div className="relative aspect-[16/7] overflow-hidden">
                                                <Image
                                                    src={item.image_url || 'https://artictempest.es/assets/images/midnight-battle.webp'}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                                <div className="absolute top-4 left-4">
                                                    <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest border border-white/10">
                                                        {item.category}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-6 flex flex-col flex-1">
                                                <div className="flex items-center gap-4 text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-4">
                                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                                    <span className="size-1 bg-blue-500 rounded-full" />
                                                    <div className="flex items-center gap-2">
                                                        <CharacterAvatar name={item.author} size={20} />
                                                        <span className="truncate max-w-[80px]">{item.author}</span>
                                                    </div>
                                                </div>

                                                <h3 className="text-lg font-black text-white italic tracking-tighter uppercase mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors leading-tight">
                                                    {item.title}
                                                </h3>

                                                <p className="text-zinc-400 text-[11px] line-clamp-2 mb-6 opacity-70">
                                                    {item.summary}
                                                </p>

                                                <div className="mt-auto flex items-center gap-2 text-blue-500 text-[9px] font-black uppercase tracking-widest group-hover:gap-4 transition-all">
                                                    Leer más
                                                    <IconArrowRight className="size-4" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </section>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 pt-10">
                                    {currentPage > 1 && (
                                        <Link
                                            href={`/noticias?page=${currentPage - 1}`}
                                            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[9px] hover:bg-white/10 transition-all flex items-center gap-2"
                                        >
                                            <IconArrowRight className="size-4 rotate-180" />
                                            Anterior
                                        </Link>
                                    )}

                                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.02] border border-white/5">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Página</span>
                                        <span className="text-[10px] font-black text-white">{currentPage}</span>
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">de</span>
                                        <span className="text-[10px] font-black text-white">{totalPages}</span>
                                    </div>

                                    {currentPage < totalPages && (
                                        <Link
                                            href={`/noticias?page=${currentPage + 1}`}
                                            className="px-6 py-3 rounded-xl bg-blue-600 border border-blue-500/20 text-white font-black uppercase tracking-widest text-[9px] hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                                        >
                                            Siguiente
                                            <IconArrowRight className="size-4" />
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
            <LandingFooter />
        </div>
    )
}
