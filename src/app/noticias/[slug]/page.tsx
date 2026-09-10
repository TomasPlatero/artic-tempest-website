import { createAdminClient } from "@/shared/supabase/server";
import { notFound, permanentRedirect } from "next/navigation";
import Script from "next/script";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import {
	IconCalendar,
	IconUserEdit,
	IconArrowLeft,
} from "@/shared/ui/tabler-icons";
import Link from "next/link";
import Image from "next/image";
import React from "react";
import { load } from "cheerio";
import { createHash } from "node:crypto";
import type { AnyNode } from "domhandler";
import { LandingNavigation } from "@/domains/landing/components/navigation";
import { LandingFooter } from "@/domains/landing/components/footer";
import { CharacterAvatar } from "@/shared/components/character-avatar";
import { ShareBar } from "@/domains/news/components/share-bar";
import { RouteScopedAdsenseSlot } from "@/shared/components/route-scoped-adsense-slot";
import { sanitizeRichHtml } from "@/shared/security/sanitize-html";
import { NewsPovTabsViewer } from "@/domains/news/components/news-pov-tabs-viewer";
import { isSafeYouTubeEmbedUrl } from "@/shared/lib/youtube";
import { getCspNonce } from "@/shared/security/csp";
import { getSeoSettings } from "@/shared/seo/seo-settings";
import { serializeJsonLd } from "@/shared/seo/json-ld-serializer";
import { Button } from "@/shared/ui/button";

import { Metadata } from "next";

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

type CheerioNode = AnyNode & { startIndex?: number | null };

const ALLOWED_ELEMENT_ATTRS = new Set([
	"href",
	"src",
	"alt",
	"title",
	"target",
	"rel",
	"width",
	"height",
	"role",
	"aria-label",
	"allow",
	"allowfullscreen",
	"frameborder",
	"loading",
	"referrerpolicy",
]);

function renderSanitizedHtml(html: string): React.ReactNode[] {
	const $ = load(html);

	const renderNode = (node: AnyNode, key: string): React.ReactNode[] => {
		if (node.type === "text") return [node.data];
		if (node.type !== "tag") return [];

		if (["html", "head", "body"].includes(node.name)) {
			return (node.children ?? [])
				.map((child: AnyNode, index: number) =>
					renderNode(child, `${key}-${(child as CheerioNode).startIndex ?? index}`),
				)
				.flat()
				.filter(
					(child) => child !== null && child !== undefined && child !== false,
				) as React.ReactNode[];
		}

		if (["script", "style"].includes(node.name)) return [];

		if (node.name === "iframe") {
			const src = node.attribs?.src;
			if (!src || !isSafeYouTubeEmbedUrl(src)) return [];

			const iframeProps: Record<string, unknown> = { key, src };
			for (const [attr, value] of Object.entries(node.attribs ?? {})) {
				if (attr === "class") iframeProps.className = value;
				else if (attr === "allowfullscreen")
					iframeProps.allowFullScreen = value === "" || value === "true";
				else if (attr === "frameborder") iframeProps.frameBorder = value;
				else if (
					[
						"title",
						"width",
						"height",
						"allow",
						"loading",
						"referrerpolicy",
					].includes(attr)
				)
					iframeProps[attr] = value;
			}

			if (!iframeProps.title) iframeProps.title = "YouTube video player";
			return [React.createElement("iframe", iframeProps)];
		}

		const props: Record<string, unknown> = { key };
		for (const [attr, value] of Object.entries(node.attribs ?? {})) {
			if (attr === "class") props.className = value;
			else if (ALLOWED_ELEMENT_ATTRS.has(attr)) {
				props[attr] = value;
			}
		}

		if (
			node.name === "a" &&
			typeof props.href === "string" &&
			/^https?:\/\//i.test(props.href)
		) {
			props.target = props.target ?? "_blank";
			props.rel = props.rel ?? "noopener noreferrer";
		}

		const children = (node.children ?? [])
			.map((child: AnyNode, index: number) =>
				renderNode(child, `${key}-${(child as CheerioNode).startIndex ?? index}`),
			)
			.flat()
			.filter(
				(child) => child !== null && child !== undefined && child !== false,
			) as React.ReactNode[];

		return [React.createElement(node.name, props, ...children)];
	};

	return $.root()
		.contents()
		.toArray()
		.reduce<React.ReactNode[]>((acc, node, index) => {
			const nodes = renderNode(
				node,
				`news-${(node as CheerioNode).startIndex ?? index}`,
			);
			for (const child of nodes) {
				if (child !== null && child !== undefined && child !== false)
					acc.push(child);
			}
			return acc;
		}, []);
}

const POV_TABS_MARKER = /<div[^>]*data-pov-tabs="true"[^>]*>[\s\S]*?<\/div>/gi;

function renderContentWithPovTabs(
	content: string,
	povTabs:
		| Array<{
				character_name: string;
				class_id: number;
				subtitle: string;
				youtube_url: string;
		  }>
		| undefined,
): React.ReactNode[] {
	if (!povTabs?.length) return renderSanitizedHtml(content);

	const segments = content.split(POV_TABS_MARKER);
	if (segments.length === 1) return renderSanitizedHtml(content);

	const contentHash = createHash("sha1")
		.update(content)
		.digest("base64url")
		.slice(0, 12);

	const result: React.ReactNode[] = [];
	segments.forEach((segment, i) => {
		if (i > 0) {
			result.push(
				<NewsPovTabsViewer key={`pov-inline-${contentHash}`} tabs={povTabs} />,
			);
		}
		if (segment.trim()) {
			result.push(...renderSanitizedHtml(segment));
		}
	});
	return result;
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
	status: "draft" | "published";
	created_at: string;
	pov_tabs?: Array<{
		character_name: string;
		class_id: number;
		subtitle: string;
		youtube_url: string;
	}>;
}

const NEWS_SELECT =
	"id, title, slug, summary, content, image_url, category, author, is_featured, status, created_at, pov_tabs";

async function getNewsItem(slug: string, canViewDraft: boolean) {
	const supabase = canViewDraft ? await createAdminClient() : supabaseAdmin;

	// Try to find by slug first
	let { data: news } = await supabase
		.from("news")
		.select(NEWS_SELECT)
		.eq("slug", slug)
		.maybeSingle();

	// If not found by slug, it might be an old ID
	if (!news) {
		const { data: newsById } = await supabase
			.from("news")
			.select(NEWS_SELECT)
			.eq("id", slug)
			.maybeSingle();
		news = newsById;
	}

	if (!news) return null;

	// Filter by status manually for safety if not previewing
	if (!canViewDraft && news.status !== "published") {
		return null;
	}

	return news as NewsItem;
}

export async function generateMetadata({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ preview?: string }>;
}): Promise<Metadata> {
	const [{ slug }, { preview }, seoSettings] = await Promise.all([
		params,
		searchParams,
		getSeoSettings(),
	]);
	const isPreview = preview === "true";

	// Check if we can view the draft (simplified check for metadata)
	const session = await getCachedServerSession();
	const authz = session ? await getAuthzSnapshot(session) : null;
	const canViewDraft =
		isPreview &&
		!!(
			session &&
			((authz?.roleSlug ?? session.user?.roleLevel) === "gm" ||
				(authz?.roleSlug ?? session.user?.roleLevel) === "officer")
		);

	const item = await getNewsItem(slug, canViewDraft);

	if (!item) {
		return {
			title: "Noticia no encontrada | Artic Tempest",
		};
	}

	const canonicalSlug = item.slug || item.id;
	const isLegacyIdUrl = slug !== canonicalSlug;
	const url = `${seoSettings.site.url}/noticias/${canonicalSlug}`;
	const images = item.image_url
		? [item.image_url]
		: [`${seoSettings.site.url}/assets/images/midnight-battle.webp`];

	const MAX_TITLE_LENGTH = 55;
	const rawTitle = item.title;
	const truncatedTitle =
		rawTitle.length > MAX_TITLE_LENGTH
			? `${rawTitle.slice(0, MAX_TITLE_LENGTH).trim()}…`
			: rawTitle;

	const description = item.summary?.trim()
		? item.summary
		: `${item.title} — Noticia de Artic Tempest, hermandad de World of Warcraft en Dun Modr.`;

	return {
		title: `${truncatedTitle} | Artic Tempest`,
		description,
		alternates: {
			canonical: `/noticias/${canonicalSlug}`,
		},
		robots: canViewDraft
			? { index: false, follow: false }
			: isLegacyIdUrl
				? { index: false, follow: true }
				: undefined,
		openGraph: {
			title: item.title,
			description: description,
			url,
			siteName: seoSettings.site.name,
			images,
			type: "article",
			publishedTime: item.created_at,
			authors: [item.author],
		},
		twitter: {
			card: "summary_large_image",
			title: item.title,
			description: description,
			images,
		},
	};
}

type NewsDetailSession = Awaited<ReturnType<typeof getCachedServerSession>>;
type NewsDetailAuthz = Awaited<ReturnType<typeof getAuthzSnapshot>>;

function resolveCanViewDraft(
	isPreview: boolean,
	session: NewsDetailSession,
	authz: NewsDetailAuthz | null,
) {
	if (!isPreview) return false;
	if (!session) return false;
	const roleLevel = authz?.roleSlug ?? session.user?.roleLevel;
	return roleLevel === "gm" || roleLevel === "officer";
}

export default async function NewsDetailPage({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ preview?: string }>;
}) {
	const [{ slug }, { preview }, nonce, session, seoSettings] = await Promise.all(
		[
			params,
			searchParams,
			getCspNonce(),
			getCachedServerSession(),
			getSeoSettings(),
		],
	);
	const isPreview = preview === "true";
	const authz = session ? await getAuthzSnapshot(session) : null;

	// Check if we can view the draft
	const canViewDraft = resolveCanViewDraft(isPreview, session, authz);

	const item = await getNewsItem(slug, canViewDraft);

	if (!item) {
		notFound();
	}

	if (!canViewDraft && item.slug && slug !== item.slug) {
		permanentRedirect(`/noticias/${item.slug}`);
	}

	const sanitizedContent = sanitizeRichHtml(item.content);

	return (
		<div className="min-h-dvh bg-zinc-950 selection:bg-blue-500/30 dark text-white animate-fade-in animate-duration-slow motion-reduce:animate-none">
			<LandingNavigation />

			{/* Structured Data (JSON-LD) */}
			<Script
				id="news-article-jsonld"
				type="application/ld+json"
				data-cfasync="false"
				nonce={nonce}
				strategy="afterInteractive"
			>
				{serializeJsonLd({
					"@context": "https://schema.org",
					"@type": "NewsArticle",
					headline: item.title,
					description: item.summary,
					image: [
						item.image_url ||
							`${seoSettings.site.url}/assets/images/midnight-battle.webp`,
					],
					datePublished: item.created_at,
					author: [
						{
							"@type": "Person",
							name: item.author,
						},
					],
					publisher: {
						"@type": "Organization",
						name: seoSettings.site.name,
						logo: {
							"@type": "ImageObject",
							url: `${seoSettings.site.url}/favicon.ico`,
						},
					},
				})}
			</Script>

			{item.status === "draft" && (
				<div className="fixed top-20 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
					<div className="bg-amber-500/90 backdrop-blur-md text-black px-6 py-2 rounded-full font-semibold uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-2 border border-white/20 animate-pulse">
						<IconUserEdit className="size-4" />
						Modo Previsualización (Borrador)
					</div>
				</div>
			)}

			<main
				id="main-content"
				className="animate-fade-in animate-duration-slow motion-reduce:animate-none"
			>
				<div className="pt-20">
					{/* Hero Section */}
					<div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
						<div className="absolute inset-0 z-10 bg-linear-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent" />
						<Image
							src={item.image_url || "/assets/images/midnight-battle.webp"}
							alt=""
							fill
							priority
							sizes="100vw"
							className="absolute inset-0 z-0 object-cover scale-105"
							aria-hidden="true"
						/>
						<div
							className="absolute inset-0 z-[5] bg-zinc-950/30 backdrop-blur-[6px] md:hidden"
							aria-hidden="true"
						/>

						<div className="absolute inset-0 z-20 flex flex-col justify-end max-w-7xl mx-auto px-6 pb-12">
							<div className="flex gap-2 mb-4">
								<span className="bg-blue-600 text-white text-[10px] font-semibold uppercase px-3 py-1 rounded-full tracking-widest shadow-xl">
									{item.category}
								</span>
								{item.status === "draft" && (
									<span className="bg-amber-500 text-black text-[10px] font-semibold uppercase px-3 py-1 rounded-full tracking-widest shadow-xl">
										Borrador
									</span>
								)}
							</div>

							<h1 className="text-4xl md:text-6xl font-semibold text-white italic tracking-tighter uppercase mb-6 drop-shadow-2xl">
								{item.title}
							</h1>

							<div className="flex items-center gap-6 text-zinc-400 text-[10px] font-semibold uppercase tracking-widest">
								<div className="flex items-center gap-2">
									<CharacterAvatar
										name={item.author}
										size={28}
										className="border-border/50 shadow-xl"
									/>
									{item.author}
								</div>
								<div className="flex items-center gap-2">
									<IconCalendar className="size-5 text-blue-500" />
									{formatNewsDate(item.created_at)}
								</div>
							</div>
						</div>
					</div>

					{/* Content Section */}
					<article className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-20">
						<div className="bg-white/[0.02] border border-white/5 rounded-[32px] md:rounded-[40px] p-6 md:p-10 backdrop-blur-sm shadow-2xl relative overflow-hidden">
							<div
								className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-blue-500/30 to-transparent"
								aria-hidden="true"
							/>

							<div className="max-w-4xl mx-auto">
								<ShareBar
									title={item.title}
									url={`${seoSettings.site.url}/noticias/${item.slug || item.id}`}
								>
									<Button
										asChild
										variant="publicGhost"
										size="publicSm"
										className="rounded-2xl"
									>
										<Link href="/noticias" className="group">
											<IconArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
											Volver a noticias
										</Link>
									</Button>
								</ShareBar>

								<div
									className="prose prose-invert prose-blue max-w-none mt-8
                        prose-headings:font-semibold prose-headings:italic prose-headings:uppercase prose-headings:tracking-tighter prose-headings:text-white
                        prose-h2:text-3xl prose-h3:text-2xl prose-h4:text-xl
                        prose-p:text-zinc-300 prose-p:text-lg prose-p:leading-8 prose-p:my-5
                        prose-li:text-zinc-300 prose-li:my-2
                        prose-blockquote:border-l-blue-500/40 prose-blockquote:bg-white/5 prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:rounded-r-2xl
                        prose-strong:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300
                        prose-img:rounded-3xl prose-img:border prose-img:border-white/10 prose-img:shadow-2xl
                        prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl prose-pre:px-5 prose-pre:py-4"
								>
									{renderContentWithPovTabs(sanitizedContent, item.pov_tabs)}
								</div>
							</div>
						</div>

						<RouteScopedAdsenseSlot
							pathname="/noticias/slug"
							zoneId="news-article-inline-1"
							adSlot={
								seoSettings.monetization.googleAdsenseSlots.newsArticleInline1 ||
								undefined
							}
							adClient={seoSettings.monetization.googleAdsenseClientId || undefined}
							className="mx-auto mt-10 max-w-4xl"
						/>

						{/* Footer Ad/CTA */}
						<div className="mt-20 p-12 bg-linear-to-br from-blue-600/20 to-violet-600/20 border border-blue-500/20 rounded-[40px] text-center relative overflow-hidden group">
							<div className="relative z-10">
								<h2 className="text-2xl font-semibold italic tracking-tighter uppercase mb-4">
									¿Buscas una hermandad competitiva?
								</h2>
								<p className="text-zinc-400 mb-8 max-w-xl mx-auto">
									Artic Tempest está reclutando jugadores excepcionales para nuestros
									rosters de World of Warcraft: Midnight.
								</p>
								<Button
									asChild
									variant="landingPrimary"
									size="publicLg"
									className="rounded-2xl shadow-xl shadow-blue-500/20"
								>
									<Link href="/reclutamiento">
										Ver vacantes
										<IconArrowLeft className="size-4 rotate-180" />
									</Link>
								</Button>
							</div>
						</div>
					</article>
				</div>
			</main>
			<LandingFooter />
		</div>
	);
}
