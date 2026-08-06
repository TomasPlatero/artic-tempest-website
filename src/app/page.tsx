import { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { HomePageClient } from "@/domains/landing/components/home-page-client";
import { getSeoSettings } from "@/shared/seo/seo-settings";
import { getGuildBranding } from "@/shared/guild/guild-branding";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { getRaidProgression } from "@/domains/landing/lib/progression";

type LandingNewsItem = {
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
};

type LandingRecruitmentSpot = {
	class_id: string;
	spec_name: string;
	urgency: string;
};

type LandingRecruitmentClass = {
	id: string;
	name: string;
	color: string;
	spots: LandingRecruitmentSpot[];
};

const NEWS_SELECT =
	"id, title, slug, summary, content, image_url, category, author, is_featured, created_at";

const recruitmentUrgencyOrder: Record<string, number> = {
	high: 0,
	medium: 1,
	low: 2,
};

function buildRecruitmentClasses(
	spots: LandingRecruitmentSpot[],
	constants: Array<{
		key: string;
		value: string;
		metadata?: { color?: string };
	}>,
): LandingRecruitmentClass[] {
	const classMap = new Map<
		string,
		{ name: string; color?: string; spots: LandingRecruitmentSpot[] }
	>();

	constants.forEach((constant) => {
		classMap.set(constant.key, {
			name: constant.value,
			color: constant.metadata?.color,
			spots: [],
		});
	});

	spots.forEach((spot) => {
		const classInfo = classMap.get(spot.class_id);
		if (classInfo) classInfo.spots.push(spot);
	});

	classMap.forEach((info) => {
		info.spots.sort(
			(a, b) =>
				(recruitmentUrgencyOrder[a.urgency] ?? 99) -
				(recruitmentUrgencyOrder[b.urgency] ?? 99),
		);
	});

	return Array.from(classMap.entries())
		.reduce((acc, [id, info]) => {
			if (info.spots.length === 0) return acc;
			acc.push({
				id,
				name: info.name,
				color: info.color || "#93c5fd",
				spots: info.spots,
			});
			return acc;
		}, [] as LandingRecruitmentClass[])
		.sort((a, b) => Number(a.id) - Number(b.id));
}

const getLandingNews = unstable_cache(
	async (): Promise<LandingNewsItem[]> => {
		const { data, error } = await supabaseAdmin
			.from("news")
			.select(NEWS_SELECT)
			.eq("status", "published")
			.order("created_at", { ascending: false })
			.limit(6);

		if (error) {
			console.error("[LANDING_NEWS_ERROR]", error);
			return [];
		}

		return (data || []) as LandingNewsItem[];
	},
	["landing-news-v1"],
	{ revalidate: 60 },
);

const getLandingRecruitment = unstable_cache(
	async (): Promise<LandingRecruitmentClass[]> => {
		const [{ data: spots }, { data: constants }] = await Promise.all([
			supabaseAdmin
				.from("recruitment_spots")
				.select("class_id, spec_name, urgency")
				.neq("urgency", "closed")
				.order("urgency", { ascending: false }),
			supabaseAdmin
				.from("game_constants")
				.select("key, value, metadata")
				.eq("category", "wow_class"),
		]);

		if (!spots || !constants) return [];

		return buildRecruitmentClasses(
			spots as LandingRecruitmentSpot[],
			constants as Array<{
				key: string;
				value: string;
				metadata?: { color?: string };
			}>,
		);
	},
	["landing-recruitment-v1"],
	{ revalidate: 60 },
);

export async function generateMetadata(): Promise<Metadata> {
	const [guild, seoSettings] = await Promise.all([
		getGuildBranding(),
		getSeoSettings(),
	]);

	const title = guild
		? `${guild.name} – Hermandad WoW | Progreso Mítico`
		: `${seoSettings.site.name} – Hermandad WoW | Progreso Mítico`;
	const desc = seoSettings.site.description;
	const siteUrl = seoSettings.site.url;

	return {
		title,
		description: desc,
		alternates: {
			canonical: "/",
		},
		openGraph: {
			title,
			description: desc,
			url: siteUrl,
			siteName: seoSettings.site.name,
			locale: "es_ES",
			type: "website",
			images: [
				{
					url: seoSettings.site.ogImage,
					width: 1200,
					height: 630,
					alt: title,
				},
			],
		},
	};
}

export const revalidate = 60; // ISR: regenerates at most every 60 seconds

export default async function Home() {
	const [
		seoSettings,
		guild,
		initialProgression,
		initialNews,
		initialRecruitment,
	] = await Promise.all([
		getSeoSettings(),
		getGuildBranding(),
		getRaidProgression(),
		getLandingNews(),
		getLandingRecruitment(),
	]);

	const publicLogoUrl = guild?.public_logo_url ?? null;

	return (
		<>
			<HomePageClient
				initialProgression={initialProgression}
				initialNews={initialNews}
				initialRecruitment={initialRecruitment}
				initialHasApplied={false}
				initialApplyStatus={null}
				publicLogoUrl={publicLogoUrl}
				adsenseClientId={
					seoSettings.monetization.googleAdsenseClientId || undefined
				}
				adsenseSlotHome={
					seoSettings.monetization.googleAdsenseSlots.homeInline1 || undefined
				}
			/>
		</>
	);
}
