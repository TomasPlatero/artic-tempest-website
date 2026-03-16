import { createAdminClient } from "@/shared/supabase/server"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/auth/auth-options"
import { IconCalendar, IconUserEdit, IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"
import React from "react"
import { LandingNavigation } from "@/domains/landing/components/navigation"
import { LandingFooter } from "@/domains/landing/components/footer"
import { CharacterAvatar } from "@/shared/components/character-avatar"
import { ShareBar } from "@/domains/news/components/share-bar"

import { Metadata } from "next"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://artictempest.es'

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
    status: 'draft' | 'published'
    created_at: string
}

async function getNewsItem(slug: string, canViewDraft: boolean) {
    const supabase = await createAdminClient()

    // Try to find by slug first
    let { data: news } = await supabase
        .from('news')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

    // If not found by slug, it might be an old ID
    if (!news) {
        const { data: newsById } = await supabase
            .from('news')
            .select('*')
            .eq('id', slug)
            .maybeSingle()
        news = newsById
    }

    if (!news) return null

    // Filter by status manually for safety if not previewing
    if (!canViewDraft && news.status !== 'published') {
        return null
    }

    return news as NewsItem
}

export async function generateMetadata({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ preview?: string }>
}): Promise<Metadata> {
    const { slug } = await params
    const { preview } = await searchParams
    const isPreview = preview === "true"

    // Check if we can view the draft (simplified check for metadata)
    const session = await getServerSession(authOptions)
    const canViewDraft = isPreview && !!(session && (session.user.roleLevel === 'gm' || session.user.roleLevel === 'officer'))

    const item = await getNewsItem(slug, canViewDraft)

    if (!item) {
        return {
            title: 'Noticia no encontrada | Artic Tempest',
        }
    }

    const url = `${baseUrl}/noticias/${item.slug || item.id}`
    const images = item.image_url ? [item.image_url] : [`${baseUrl}/assets/images/midnight-battle.webp`]

    return {
        title: `${item.title} | Artic Tempest`,
        description: item.summary,
        robots: (canViewDraft) ? { index: false, follow: false } : undefined,
        openGraph: {
            title: item.title,
            description: item.summary,
            url,
            siteName: 'Artic Tempest',
            images,
            type: 'article',
            publishedTime: item.created_at,
            authors: [item.author],
        },
        twitter: {
            card: 'summary_large_image',
            title: item.title,
            description: item.summary,
            images,
        },
    }
}

export default async function NewsDetailPage({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>,
    searchParams: Promise<{ preview?: string }>
}) {
    const { slug } = await params
    const { preview } = await searchParams
    const isPreview = preview === "true"

    // Check if we can view the draft
    const session = await getServerSession(authOptions)
    const canViewDraft = isPreview && !!(session && (session.user.roleLevel === 'gm' || session.user.roleLevel === 'officer'))

    const item = await getNewsItem(slug, canViewDraft)

    if (!item) {
        notFound()
    }

    return (
        <main className="min-h-screen bg-black selection:bg-blue-500/30 dark text-white">
            <LandingNavigation />

            {item.status === 'draft' && (
                <div className="fixed top-20 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
                    <div className="bg-amber-500/90 backdrop-blur-md text-black px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-2 border border-white/20 animate-bounce">
                        <IconUserEdit className="size-4" />
                        Modo Previsualización (Borrador)
                    </div>
                </div>
            )}

            <div className="pt-20">
                {/* Hero Section */}
                <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent" />
                    <div
                        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105"
                        style={{ backgroundImage: `url(${item.image_url || `${baseUrl}/assets/images/midnight-battle.webp`})` }}
                    />

                    <div className="absolute inset-0 z-20 flex flex-col justify-end max-w-7xl mx-auto px-6 pb-12">
                        <Link href="/noticias" className="group inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 text-xs font-bold uppercase tracking-widest">
                            <IconArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                            Volver a noticias
                        </Link>

                        <div className="flex gap-2 mb-4">
                            <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-xl">
                                {item.category}
                            </span>
                            {item.status === 'draft' && (
                                <span className="bg-amber-500 text-black text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest shadow-xl">
                                    Borrador
                                </span>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase mb-6 drop-shadow-2xl">
                            {item.title}
                        </h1>

                        <div className="flex items-center gap-6 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <CharacterAvatar name={item.author} size={28} className="border-border/50 shadow-xl" />
                                {item.author}
                            </div>
                            <div className="flex items-center gap-2">
                                <IconCalendar className="size-5 text-blue-500" />
                                {new Date(item.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <article className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-20">
                    <div className="bg-white/[0.02] border border-white/5 rounded-[32px] md:rounded-[40px] p-6 md:p-16 backdrop-blur-sm shadow-2xl">
                        <ShareBar
                            title={item.title}
                            url={`${baseUrl}/noticias/${item.slug || item.id}`}
                        />
                        <div
                            className="prose prose-invert prose-blue max-w-none 
                        prose-headings:font-black prose-headings:italic prose-headings:uppercase prose-headings:tracking-tighter
                        prose-p:text-zinc-300 prose-p:text-lg prose-p:leading-relaxed
                        prose-strong:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300
                        prose-img:rounded-3xl prose-img:border prose-img:border-white/10"
                            dangerouslySetInnerHTML={{ __html: item.content }}
                        />
                    </div>

                    {/* Footer Ad/CTA */}
                    <div className="mt-20 p-12 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-[40px] text-center relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-4">¿Buscas una hermandad competitiva?</h4>
                            <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
                                Artic Tempest está reclutando jugadores excepcionales para nuestros rosters de World of Warcraft: Midnight.
                            </p>
                            <Link
                                href="/reclutamiento"
                                className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 hover:scale-105"
                            >
                                Ver vacantes
                                <IconArrowLeft className="size-4 rotate-180" />
                            </Link>
                        </div>
                    </div>
                </article>
            </div>
            <LandingFooter />
        </main>
    )
}
