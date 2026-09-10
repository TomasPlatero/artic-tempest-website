"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
	IconArrowRight,
	IconCalendar,
	IconLoader2,
} from "@/shared/ui/tabler-icons";
const AdBanner = dynamic(
	() => import("./ad-banner").then((mod) => ({ default: mod.AdBanner })),
	{ ssr: false },
);
import React from "react";
import { CharacterAvatar } from "@/shared/components/character-avatar";
import { NewsCardBody } from "@/domains/news/components/news-card-body";
import { useApiQuery } from "@/shared/hooks/use-api-query";
import { RouteScopedAdsenseSlot } from "@/shared/components/route-scoped-adsense-slot";
import { Button } from "@/shared/ui/button";
import {
	PUBLIC_CARD_REVEAL_CLASSES,
	PUBLIC_SECTION_REVEAL_CLASSES,
	PUBLIC_STAGGER_DELAY_CLASSES,
} from "@/shared/components/public-motion";
import { cn } from "@/shared/tailwind/tailwind-utils";

interface NewsItem {
	id: string;
	title: string;
	slug: string;
	summary: string;
	content: string;
	image_url: string | null;
	category: string;
	author: string;
	is_featured: boolean;
	created_at: string;
}

const NEWS_DATE_FORMATTER = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
	timeZone: "UTC",
});

function formatNewsDate(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return NEWS_DATE_FORMATTER.format(date);
}

export function LandingNoticias({
	initialNews,
	adsenseClientId,
	adsenseSlot,
}: {
	initialNews?: NewsItem[];
	adsenseClientId?: string;
	adsenseSlot?: string;
}) {
	const { data: newsData, isLoading } = useApiQuery<NewsItem[]>(
		"/api/guild/news",
		{
			fallbackData: initialNews,
			refreshInterval: 5 * 60 * 1000,
		},
	);

	const news = Array.isArray(newsData) ? newsData : [];

	if (isLoading && !initialNews) {
		return (
			<div className="py-24 flex flex-col items-center justify-center opacity-20">
				<IconLoader2 className="size-12 animate-spin mb-4" />
				<p className="text-xs font-semibold uppercase tracking-widest">
					Cargando Noticias…
				</p>
			</div>
		);
	}

	if (news.length === 0) return null;

	const featuredNews = news.find((n) => n.is_featured);
	const otherNews = news.filter((n) => !n.is_featured).slice(0, 4);

	return (
		<section
			className={cn(
				"relative bg-[#050814] py-24 px-6 scroll-mt-20",
				PUBLIC_SECTION_REVEAL_CLASSES,
			)}
		>
			<div className="mx-auto max-w-7xl">
				<div className="flex flex-col justify-between gap-6 mb-8 md:mb-12 sm:flex-row sm:items-end">
					<div className="text-center sm:text-left">
						<h3 className="text-3xl font-semibold uppercase tracking-[0.18em] md:text-5xl">
							<span className="text-blue-100">Últimas Noticias</span>
						</h3>
					</div>
					<Button
						variant="landingTinted"
						size="landingLg"
						className="min-w-[16rem] justify-between px-6 text-[10px] tracking-[0.16em] sm:min-w-[17rem] shadow-none hover:shadow-none"
						asChild
					>
						<Link href="/noticias" className="group/cta">
							Ver todas las noticias
							<IconArrowRight className="size-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
						</Link>
					</Button>
				</div>

				<div className="mb-8 md:mb-12">
					<RouteScopedAdsenseSlot
						pathname="/"
						zoneId="home-inline-1"
						adSlot={adsenseSlot}
						adClient={adsenseClientId}
						className="mx-auto max-w-5xl"
					/>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
					{/* Main Content: 8/12 - News Grid */}
					<div className="lg:col-span-8 space-y-8">
						{/* Featured News Card */}
						{featuredNews && (
							<div
								className={cn(
									"group relative h-[400px] rounded-3xl overflow-hidden border border-white/10 md:h-[500px]",
									PUBLIC_CARD_REVEAL_CLASSES,
								)}
							>
								<div
									className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent z-10"
									aria-hidden="true"
								/>
								<div className="absolute inset-0 z-0">
									<div
										className="absolute inset-0 bg-blue-900/20 mix-blend-overlay group-hover:opacity-0 transition-opacity z-10"
										aria-hidden="true"
									/>
									<Image
										src={
											featuredNews.image_url ||
											"/assets/images/midnight-battle.webp"
										}
										alt={featuredNews.title}
										width={1600}
										height={900}
										className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-700"
										priority
										quality={60}
										sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
									/>
								</div>

								<div className="absolute inset-0 z-20 p-6 md:p-12 flex flex-col justify-end">
									<div className="flex gap-2 mb-4">
										<span className="bg-blue-600 text-white text-[10px] font-semibold uppercase px-3 py-1 rounded-full tracking-widest shadow-xl">
											{featuredNews.category}
										</span>
									</div>
									<h3 className="text-xl md:text-4xl font-semibold text-white mb-3 md:mb-4 leading-relaxed group-hover:text-blue-400 transition-colors italic uppercase tracking-tighter">
										{featuredNews.title}
									</h3>
									<p className="text-zinc-100 text-xs md:text-lg max-w-2xl line-clamp-2 md:line-clamp-none mb-6 font-medium text-balance opacity-100">
										{featuredNews.summary}
									</p>
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-white/10 pt-6">
										<div className="flex items-center gap-6 text-zinc-300 text-[10px] font-bold uppercase tracking-widest">
											<div className="flex items-center gap-2">
												<CharacterAvatar
													name={featuredNews.author}
													size={24}
													className="border-border/50 shadow-inner"
												/>
												{featuredNews.author}
											</div>
											<div className="flex items-center gap-2">
												<IconCalendar className="size-4 text-blue-500" />
												{formatNewsDate(featuredNews.created_at)}
											</div>
										</div>

										<div className="hidden sm:flex items-center gap-2 text-blue-400 text-[10px] font-semibold uppercase tracking-[0.2em] group-hover:gap-4  motion-reduce:transition-none">
											Leer noticia
											<IconArrowRight className="size-4" />
										</div>
									</div>
								</div>
								<Link
									href={`/noticias/${featuredNews.slug || featuredNews.id}`}
									className="absolute inset-0 z-30"
									aria-label={`Leer más sobre ${featuredNews.title}`}
								/>
							</div>
						)}

						<div className="pt-2">
							<AdBanner
								type="restedxp"
								href="https://shop.restedxp.com/ref/artictempest/"
							/>
						</div>

						{/* Secondary News Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							{otherNews.map((n, idx) => (
								<div
									key={n.id}
									className={cn(
										"group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-zinc-950  motion-reduce:transition-none hover:border-blue-500/30",
										PUBLIC_CARD_REVEAL_CLASSES,
										PUBLIC_STAGGER_DELAY_CLASSES[idx + 1] ??
											"animate-delay-500",
									)}
								>
									<div className="relative aspect-video overflow-hidden">
										<div
											className="absolute inset-0 bg-blue-900/10 z-10 group-hover:opacity-0 transition-opacity motion-reduce:transition-none"
											aria-hidden="true"
										/>
										<Image
											src={n.image_url || "/assets/images/midnight-battle.webp"}
											alt={n.title}
											width={1200}
											height={675}
											className="absolute inset-0 size-full object-cover group-hover:scale-110 motion-reduce:group-hover:scale-100 transition-transform duration-500 motion-reduce:transition-none"
											sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
										/>
									</div>
									<NewsCardBody
										category={n.category}
										formattedDate={formatNewsDate(n.created_at)}
										title={n.title}
										author={n.author}
									/>
									<Link
										href={`/noticias/${n.slug || n.id}`}
										className="absolute inset-0 z-20"
										aria-label={`Leer más sobre ${n.title}`}
									/>
								</div>
							))}
						</div>
					</div>

					{/* Sidebar Column (Non-landmark to avoid nesting) */}
					<div className="lg:col-span-4 space-y-8">
						{/* Recruitment Widget */}
						<div className="bg-linear-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 rounded-3xl p-8 relative overflow-hidden group">
							<div className="relative z-10">
								<h4 className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">
									Reclutamiento
								</h4>
								<p className="text-2xl font-semibold text-white uppercase tracking-tight mb-4">
									Únete al Roster de Midnight
								</p>
								<p className="text-sm text-blue-50 mb-8 leading-relaxed">
									Buscamos jugadores excepcionales para completar nuestro equipo
									mítico.
								</p>
								<Button variant="landingPrimary" size="landing" asChild>
									<Link
										href="/reclutamiento"
										className="group/cta"
										aria-label="Aplicar Ahora – Ir a reclutamiento"
									>
										Aplicar Ahora
										<IconArrowRight className="size-3 transition-transform duration-300 group-hover/cta:translate-x-1" />
									</Link>
								</Button>
							</div>
							{/* Static Decoration */}
							<div
								className="absolute top-0 right-0 -mr-12 -mt-12 size-48 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20  pointer-events-none"
								aria-hidden="true"
							/>
						</div>

						{/* Ads Banner */}
						<div className="space-y-4">
							<p className="text-[10px] font-semibold text-zinc-300 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
								Publicidad <span className="h-px bg-zinc-800 flex-1" />
							</p>
							<div className="space-y-4">
								<div className={PUBLIC_CARD_REVEAL_CLASSES}>
									<AdBanner
										type="protonvpn"
										href="https://pr.tn/ref/6FT15FKW"
									/>
								</div>
								<div
									className={cn(
										PUBLIC_CARD_REVEAL_CLASSES,
										"animate-delay-150",
									)}
								>
									<AdBanner
										type="instantgaming"
										href="https://www.instant-gaming.com/?igr=gamer-94712f"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
