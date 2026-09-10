import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { IconCalendar, IconArrowRight } from "@/shared/ui/tabler-icons";
import Link from "next/link";
import Image from "next/image";
import { LandingNavigation } from "@/domains/landing/components/navigation";
import { LandingFooter } from "@/domains/landing/components/footer";
import { CharacterAvatar } from "@/shared/components/character-avatar";
import { getSeoSettings } from "@/shared/seo/seo-settings";
import { NewsCardBody } from "@/domains/news/components/news-card-body";
import { RouteScopedAdsenseSlot } from "@/shared/components/route-scoped-adsense-slot";
import { Button } from "@/shared/ui/button";
import {
	PUBLIC_CARD_REVEAL_CLASSES,
	PUBLIC_SECTION_REVEAL_CLASSES,
	PUBLIC_STAGGER_DELAY_CLASSES,
} from "@/shared/components/public-motion";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { ItemListJsonLd } from "@/shared/seo/json-ld-item-list";
import { WebPageJsonLd } from "@/shared/seo/json-ld-webpage";

import { Metadata } from "next";

export const dynamic = "force-dynamic";

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

export async function generateMetadata({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
	const seoSettings = await getSeoSettings();
	const { page } = await searchParams;
	const parsedPage = Number.parseInt(page || "1", 10);
	const currentPage =
		Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
	const pageSuffix = currentPage > 1 ? ` (Página ${currentPage})` : "";

	const newsDescription =
		"Últimas noticias y actualizaciones de Artic Tempest, hermandad de World of Warcraft en Dun Modr. Novedades, guías, kills de raid y eventos de la comunidad.";

	return {
		title: `Noticias | ${seoSettings.site.name}${pageSuffix}`,
		description: newsDescription,
		robots: currentPage > 1 ? { index: false, follow: true } : undefined,
		alternates: {
			canonical: "/noticias",
		},
		openGraph: {
			title: `Noticias | ${seoSettings.site.name}`,
			description: newsDescription,
			url: `${seoSettings.site.url}/noticias`,
			siteName: seoSettings.site.name,
			type: "website",
		},
	};
}

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

const NEWS_SELECT =
	"id, title, slug, summary, content, image_url, category, author, is_featured, created_at";

async function loadNewsPageData(page: string | undefined) {
	const parsedPage = Number.parseInt(page || "1", 10);
	const currentPage =
		Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
	const itemsPerPage = 10;
	const from = (currentPage - 1) * itemsPerPage;
	const to = from + itemsPerPage - 1;

	const [seoSettings, { count }, { data: news }] = await Promise.all([
		getSeoSettings(),
		supabaseAdmin
			.from("news")
			.select("id", { count: "exact", head: true })
			.eq("status", "published"),
		supabaseAdmin
			.from("news")
			.select(NEWS_SELECT)
			.eq("status", "published")
			.order("created_at", { ascending: false })
			.range(from, to),
	]);

	const newsItems = (news || []) as NewsItem[];
	const totalPages = Math.ceil((count || 0) / itemsPerPage);

	// Only show "Featured" on the first page
	const featuredNews =
		currentPage === 1 ? newsItems.find((item) => item.is_featured) : null;
	const otherNews = featuredNews
		? newsItems.filter((item) => item.id !== featuredNews.id)
		: newsItems;

	const baseUrl = seoSettings.site.url || "https://artictempest.es";

	return {
		seoSettings,
		newsItems,
		count,
		currentPage,
		totalPages,
		featuredNews,
		otherNews,
		baseUrl,
	};
}

export default async function NewsPage({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	const { page } = await searchParams;
	const {
		seoSettings,
		newsItems,
		count,
		currentPage,
		totalPages,
		featuredNews,
		otherNews,
		baseUrl,
	} = await loadNewsPageData(page);

	return (
		<>
			<WebPageJsonLd
				webPage={{
					id: `${baseUrl}/noticias`,
					name: "Noticias | Artic Tempest",
					description:
						"Últimas noticias y actualizaciones de Artic Tempest, hermandad de World of Warcraft en Dun Modr.",
				}}
				breadcrumb={[
					{ name: "Inicio", url: baseUrl },
					{ name: "Noticias", url: `${baseUrl}/noticias` },
				]}
			/>
			<ItemListJsonLd
				itemListElement={newsItems.slice(0, 10).map((item) => ({
					url: `${baseUrl}/noticias/${item.slug || item.id}`,
					name: item.title,
					description: item.summary,
					image: item.image_url ?? undefined,
					datePublished: item.created_at,
					author: item.author,
				}))}
				numberOfItems={count ?? newsItems.length}
			/>
			<div className="min-h-dvh bg-[#050814] selection:bg-blue-500/30 dark">
				<LandingNavigation />
				<main id="main-content" className="pt-40 pb-20 px-6">
					<div
						className={cn("mx-auto max-w-7xl", PUBLIC_SECTION_REVEAL_CLASSES)}
					>
						{/* Header */}
						<div className="flex flex-col justify-between gap-6 mb-8 md:mb-12 sm:flex-row sm:items-end">
							<div className="text-center sm:text-left">
								<p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-blue-300 md:text-sm">
									Actualidad
								</p>
								<h1 className="text-3xl font-semibold uppercase tracking-[0.18em] md:text-5xl">
									<span className="text-blue-100">Últimas Noticias</span>
								</h1>
							</div>
						</div>

						{newsItems.length === 0 ? (
							<div className="text-center py-24 border border-white/5 rounded-3xl">
								<p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">
									No hay noticias publicadas todavía.
								</p>
							</div>
						) : (
							<div className="space-y-20">
								<RouteScopedAdsenseSlot
									pathname="/noticias"
									zoneId="news-list-inline-1"
									adSlot={
										seoSettings.monetization.googleAdsenseSlots
											.newsListInline1 || undefined
									}
									adClient={
										seoSettings.monetization.googleAdsenseClientId || undefined
									}
									className="mx-auto max-w-5xl"
								/>

								{/* Featured News - Page 1 only */}
								{featuredNews && (
									<section
										className={cn(
											"group relative block aspect-[21/9] min-h-[400px] w-full overflow-hidden rounded-3xl border border-white/10",
											PUBLIC_CARD_REVEAL_CLASSES,
										)}
									>
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
												fill
												sizes="(max-width: 768px) 100vw, 100vw"
												priority
												className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-700"
											/>
										</div>

										<div className="absolute bottom-0 left-0 right-0 z-20 bg-zinc-950/90 p-6 md:p-8">
											<div className="flex gap-2 mb-4">
												<span className="bg-blue-600 text-white text-[10px] font-semibold uppercase px-3 py-1 rounded-full tracking-widest shadow-xl">
													Destacado
												</span>
												<span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-semibold uppercase px-3 py-1 rounded-full tracking-widest hidden xs:inline">
													{featuredNews.category}
												</span>
											</div>
											<h2 className="text-xl md:text-4xl font-semibold text-white italic tracking-tighter uppercase mb-3 group-hover:text-blue-400 transition-colors leading-relaxed line-clamp-2 md:line-clamp-3">
												{featuredNews.title}
											</h2>
											<p className="text-zinc-300 text-xs md:text-sm max-w-2xl line-clamp-2 mb-4 font-medium">
												{featuredNews.summary}
											</p>
											<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10 pt-4">
												<div className="flex items-center gap-6 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
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
									</section>
								)}

								{/* Other News Grid */}
								{otherNews.length > 0 && (
									<section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
										{otherNews.map((item, idx) => (
											<div
												key={item.id}
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
														src={
															item.image_url ||
															"/assets/images/midnight-battle.webp"
														}
														alt={item.title}
														fill
														sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
														className="absolute inset-0 size-full object-cover group-hover:scale-110 motion-reduce:group-hover:scale-100 transition-transform duration-500 motion-reduce:transition-none"
													/>
												</div>
												<NewsCardBody
													category={item.category}
													formattedDate={formatNewsDate(item.created_at)}
													title={item.title}
													author={item.author}
												/>
												<Link
													href={`/noticias/${item.slug || item.id}`}
													className="absolute inset-0 z-20"
													aria-label={`Leer más sobre ${item.title}`}
												/>
											</div>
										))}
									</section>
								)}

								{/* Pagination */}
								{totalPages > 1 && (
									<div className="flex items-center justify-center gap-2 pt-10">
										{currentPage > 1 && (
											<Button
												asChild
												variant="publicGhost"
												size="publicSm"
												className="rounded-2xl"
											>
												<Link href={`/noticias?page=${currentPage - 1}`}>
													<IconArrowRight className="size-4 rotate-180" />
													Anterior
												</Link>
											</Button>
										)}

										<div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.02] border border-white/5">
											<span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
												Página
											</span>
											<span className="text-[10px] font-semibold text-white">
												{currentPage}
											</span>
											<span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
												de
											</span>
											<span className="text-[10px] font-semibold text-white">
												{totalPages}
											</span>
										</div>

										{currentPage < totalPages && (
											<Button
												asChild
												variant="landingPrimary"
												size="publicSm"
												className="rounded-2xl shadow-lg shadow-blue-600/20"
											>
												<Link href={`/noticias?page=${currentPage + 1}`}>
													Siguiente
													<IconArrowRight className="size-4" />
												</Link>
											</Button>
										)}
									</div>
								)}
							</div>
						)}
					</div>
				</main>
				<LandingFooter />
			</div>
		</>
	);
}
