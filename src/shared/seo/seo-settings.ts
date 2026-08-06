import { unstable_cache } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import type { SeoSettings } from "@/shared/seo/seo-types";

type SeoSettingsRow = {
	id: number;
	site_url: string;
	site_name: string;
	site_description: string;
	site_og_image: string;
	verification_google: string;
	verification_bing: string;
	verification_yandex: string;
	verification_baidu: string;
	verification_pinterest: string;
	verification_yahoo: string;
	analytics_google_analytics_id: string;
	analytics_google_tag_manager_id: string;
	monetization_google_adsense_client_id: string;
	monetization_google_adsense_slot_home_inline1: string;
	monetization_google_adsense_slot_news_list_inline1: string;
	monetization_google_adsense_slot_news_article_inline1: string;
	monetization_google_adsense_slot_recruitment_inline1: string;
	monetization_ads_txt_content: string;
	social_twitter_site: string;
	social_twitter_creator: string;
	social_facebook_app_id: string;
	cookie_consent_enabled: boolean;
	cookie_consent_cookie_name: string;
	cookie_consent_consent_modal_title: string;
	cookie_consent_consent_modal_description: string;
	cookie_consent_accept_all_label: string;
	cookie_consent_accept_necessary_label: string;
	cookie_consent_show_preferences_label: string;
	cookie_consent_preferences_title: string;
	cookie_consent_save_preferences_label: string;
	cookie_consent_close_label: string;
	cookie_consent_necessary_title: string;
	cookie_consent_necessary_description: string;
	cookie_consent_analytics_title: string;
	cookie_consent_analytics_description: string;
	cookie_consent_analytics_label: string;
	cookie_consent_analytics_enabled: boolean;
	cookie_consent_marketing_label: string;
	cookie_consent_marketing_description: string;
	cookie_consent_marketing_enabled: boolean;
	cookie_consent_security_enabled: boolean;
	robots_index: boolean;
	robots_follow: boolean;
	robots_max_image_preview: "none" | "standard" | "large";
	robots_max_snippet: number;
	robots_max_video_preview: number;
	schema_organization: boolean;
	schema_website: boolean;
	schema_breadcrumb: boolean;
	schema_article: boolean;
	schema_news_article: boolean;
};

type SeoVerificationCustomTagRow = {
	id: number;
	sort_order: number;
	name: string;
	content: string;
};

const seoVerificationTagSchema = z.object({
	id: z.string().trim().default(""),
	name: z.string().trim().min(1).max(120),
	content: z.string().trim().min(1).max(512),
});

const seoSettingsSchema = z.object({
	site: z.object({
		name: z.string().trim().min(1).default("Artic Tempest"),
		url: z.string().trim().url().default("https://artictempest.es"),
		description: z
			.string()
			.trim()
			.min(1)
			.default(
				"Hermandad de WoW en Dun Modr centrada en el progreso PvE Mítico.",
			),
		ogImage: z
			.string()
			.trim()
			.min(1)
			.default("/assets/images/artic-tempest-og.webp"),
	}),
	verification: z.object({
		google: z.string().trim().default(""),
		bing: z.string().trim().default(""),
		yandex: z.string().trim().default(""),
		baidu: z.string().trim().default(""),
		pinterest: z.string().trim().default(""),
		yahoo: z.string().trim().default(""),
		custom: z.array(seoVerificationTagSchema).default([]),
	}),
	analytics: z.object({
		googleAnalyticsId: z.string().trim().default(""),
		googleTagManagerId: z.string().trim().default(""),
	}),
	monetization: z.object({
		googleAdsenseClientId: z.string().trim().default(""),
		googleAdsenseSlots: z.object({
			homeInline1: z.string().trim().default(""),
			newsListInline1: z.string().trim().default(""),
			newsArticleInline1: z.string().trim().default(""),
			recruitmentInline1: z.string().trim().default(""),
		}),
		adsTxtContent: z.string().trim().default(""),
	}),
	social: z.object({
		twitterSite: z.string().trim().default(""),
		twitterCreator: z.string().trim().default(""),
		facebookAppId: z.string().trim().default(""),
	}),
	cookieConsent: z.object({
		enabled: z.boolean().default(true),
		cookieName: z.string().trim().default("artictempest_cookie_consent"),
		consentModalTitle: z.string().trim().default("Control de su Privacidad"),
		consentModalDescription: z
			.string()
			.trim()
			.default(
				'Utilizamos cookies propias y de terceros para fines analíticos y para mostrarle publicidad personalizada en base a un perfil elaborado a partir de sus hábitos de navegación. Al pulsar "Aceptar Todas", consiente el uso de todas las cookies. Al pulsar "Solo Esenciales", rechaza todas las que no sean necesarias para el funcionamiento. También puede configurar sus preferencias. Más información en nuestra Política de Cookies.',
			),
		acceptAllLabel: z.string().trim().default("Aceptar Todas"),
		acceptNecessaryLabel: z.string().trim().default("Solo Esenciales"),
		showPreferencesLabel: z.string().trim().default("Configurar"),
		preferencesTitle: z
			.string()
			.trim()
			.default("Centro de Preferencias de Cookies"),
		savePreferencesLabel: z.string().trim().default("Guardar preferencias"),
		closeLabel: z.string().trim().default("Cerrar modal"),
		necessaryTitle: z
			.string()
			.trim()
			.default("Cookies Estrictamente Necesarias"),
		necessaryDescription: z
			.string()
			.trim()
			.default(
				"Estas cookies son imprescindibles para que la aplicación web funcione correctamente (inicio de sesión, seguridad y navegación). No pueden desactivarse.",
			),
		analyticsTitle: z
			.string()
			.trim()
			.default("Cookies de Rendimiento y Análisis"),
		analyticsDescription: z
			.string()
			.trim()
			.default(
				"Estas cookies nos permiten contabilizar las visitas y fuentes de tráfico de forma anónima, para poder evaluar el rendimiento y mejorar la plataforma.",
			),
		analyticsLabel: z.string().trim().default("Google Analytics"),
		analyticsEnabled: z.boolean().default(true),
		marketingLabel: z.string().trim().default("Google Ads / AdSense"),
		marketingDescription: z
			.string()
			.trim()
			.default(
				"Estas cookies ayudan a mostrar anuncios y medir conversiones en plataformas como Google AdSense; el consentimiento publicitario se gestiona con el mensaje de Google en AdSense.",
			),
		marketingEnabled: z.boolean().default(false),
		securityEnabled: z.boolean().default(true),
	}),
	robots: z.object({
		index: z.boolean().default(true),
		follow: z.boolean().default(true),
		maxImagePreview: z.enum(["none", "standard", "large"]).default("large"),
		maxSnippet: z.number().int().default(-1),
		maxVideoPreview: z.number().int().default(-1),
	}),
	schema: z.object({
		organization: z.boolean().default(true),
		website: z.boolean().default(true),
		breadcrumb: z.boolean().default(true),
		article: z.boolean().default(true),
		newsArticle: z.boolean().default(true),
	}),
});

const DEFAULT_SEO_SETTINGS: SeoSettings = {
	site: {
		name: "Artic Tempest",
		url: "https://artictempest.es",
		description:
			"Artic Tempest: hermandad de WoW en Dun Modr (EU) enfocada en progreso PvE Mítico. Reclutamiento de raids, roster competitivo y comunidad organizada.",
		ogImage: "/assets/images/artic-tempest-og.webp",
	},
	verification: {
		google: "",
		bing: "",
		yandex: "",
		baidu: "",
		pinterest: "",
		yahoo: "",
		custom: [],
	},
	analytics: {
		googleAnalyticsId: "",
		googleTagManagerId: "",
	},
	monetization: {
		googleAdsenseClientId: "",
		googleAdsenseSlots: {
			homeInline1: "",
			newsListInline1: "",
			newsArticleInline1: "",
			recruitmentInline1: "",
		},
		adsTxtContent: "",
	},
	social: {
		twitterSite: "@artictempestWoW",
		twitterCreator: "",
		facebookAppId: "",
	},
	cookieConsent: {
		enabled: true,
		cookieName: "artictempest_cookie_consent",
		consentModalTitle: "Control de su Privacidad",
		consentModalDescription:
			'Utilizamos cookies propias y de terceros para fines analíticos y para mostrarle publicidad personalizada en base a un perfil elaborado a partir de sus hábitos de navegación. Al pulsar "Aceptar Todas", consiente el uso de todas las cookies. Al pulsar "Solo Esenciales", rechaza todas las que no sean necesarias para el funcionamiento. También puede configurar sus preferencias. Más información en nuestra Política de Cookies.',
		acceptAllLabel: "Aceptar Todas",
		acceptNecessaryLabel: "Solo Esenciales",
		showPreferencesLabel: "Configurar",
		preferencesTitle: "Centro de Preferencias de Cookies",
		savePreferencesLabel: "Guardar preferencias",
		closeLabel: "Cerrar modal",
		necessaryTitle: "Cookies Estrictamente Necesarias",
		necessaryDescription:
			"Estas cookies son imprescindibles para que la aplicación web funcione correctamente (inicio de sesión, seguridad y navegación). No pueden desactivarse.",
		analyticsTitle: "Cookies de Rendimiento y Análisis",
		analyticsDescription:
			"Estas cookies nos permiten contabilizar las visitas y fuentes de tráfico de forma anónima, para poder evaluar el rendimiento y mejorar la plataforma.",
		analyticsLabel: "Google Analytics",
		analyticsEnabled: true,
		marketingLabel: "Google Ads / AdSense",
		marketingDescription:
			"Estas cookies ayudan a mostrar anuncios y medir conversiones en plataformas como Google AdSense; el consentimiento publicitario se gestiona con el mensaje de Google en AdSense.",
		marketingEnabled: false,
		securityEnabled: true,
	},
	robots: {
		index: true,
		follow: true,
		maxImagePreview: "large",
		maxSnippet: -1,
		maxVideoPreview: -1,
	},
	schema: {
		organization: true,
		website: true,
		breadcrumb: true,
		article: true,
		newsArticle: true,
	},
};

export type { SeoSettings } from "@/shared/seo/seo-types";

export const SEO_SETTINGS_CACHE_TAG = "seo-settings";

export function parseSeoSettings(raw: unknown): SeoSettings {
	const input =
		raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

	return seoSettingsSchema.parse({
		...DEFAULT_SEO_SETTINGS,
		...input,
		site: {
			...DEFAULT_SEO_SETTINGS.site,
			...(input.site as Record<string, unknown> | undefined),
		},
		verification: {
			...DEFAULT_SEO_SETTINGS.verification,
			...(input.verification as Record<string, unknown> | undefined),
		},
		analytics: {
			...DEFAULT_SEO_SETTINGS.analytics,
			...(input.analytics as Record<string, unknown> | undefined),
		},
		social: {
			...DEFAULT_SEO_SETTINGS.social,
			...(input.social as Record<string, unknown> | undefined),
		},
		cookieConsent: {
			...DEFAULT_SEO_SETTINGS.cookieConsent,
			...(input.cookieConsent as Record<string, unknown> | undefined),
		},
		robots: {
			...DEFAULT_SEO_SETTINGS.robots,
			...(input.robots as Record<string, unknown> | undefined),
		},
		schema: {
			...DEFAULT_SEO_SETTINGS.schema,
			...(input.schema as Record<string, unknown> | undefined),
		},
	});
}

async function fetchSeoSettings(): Promise<SeoSettings> {
	try {
		const [settingsResult, customTagsResult] = await Promise.all([
			supabaseAdmin
				.from("seo_settings")
				.select(
					[
						"id",
						"site_url",
						"site_name",
						"site_description",
						"site_og_image",
						"verification_google",
						"verification_bing",
						"verification_yandex",
						"verification_baidu",
						"verification_pinterest",
						"verification_yahoo",
						"analytics_google_analytics_id",
						"analytics_google_tag_manager_id",
						"monetization_google_adsense_client_id",
						"monetization_google_adsense_slot_home_inline1",
						"monetization_google_adsense_slot_news_list_inline1",
						"monetization_google_adsense_slot_news_article_inline1",
						"monetization_google_adsense_slot_recruitment_inline1",
						"monetization_ads_txt_content",
						"social_twitter_site",
						"social_twitter_creator",
						"social_facebook_app_id",
						"cookie_consent_enabled",
						"cookie_consent_cookie_name",
						"cookie_consent_consent_modal_title",
						"cookie_consent_consent_modal_description",
						"cookie_consent_accept_all_label",
						"cookie_consent_accept_necessary_label",
						"cookie_consent_show_preferences_label",
						"cookie_consent_preferences_title",
						"cookie_consent_save_preferences_label",
						"cookie_consent_close_label",
						"cookie_consent_necessary_title",
						"cookie_consent_necessary_description",
						"cookie_consent_analytics_title",
						"cookie_consent_analytics_description",
						"cookie_consent_analytics_label",
						"cookie_consent_analytics_enabled",
						"cookie_consent_marketing_label",
						"cookie_consent_marketing_description",
						"cookie_consent_marketing_enabled",
						"cookie_consent_security_enabled",
						"robots_index",
						"robots_follow",
						"robots_max_image_preview",
						"robots_max_snippet",
						"robots_max_video_preview",
						"schema_organization",
						"schema_website",
						"schema_breadcrumb",
						"schema_article",
						"schema_news_article",
					].join(", "),
				)
				.eq("id", 1)
				.maybeSingle<SeoSettingsRow>(),
			supabaseAdmin
				.from("seo_verification_custom_tags")
				.select("id, sort_order, name, content")
				.eq("seo_settings_id", 1)
				.order("sort_order", { ascending: true })
				.order("id", { ascending: true })
				.returns<SeoVerificationCustomTagRow[]>(),
		]);

		const { data: settingsRow, error } = settingsResult;
		const { data: customTags, error: customTagsError } = customTagsResult;

		if (error) {
			if (isMissingSeoSettingsTableError(error)) return DEFAULT_SEO_SETTINGS;
			return DEFAULT_SEO_SETTINGS;
		}

		if (customTagsError) {
			if (isMissingSeoSettingsTableError(customTagsError))
				return DEFAULT_SEO_SETTINGS;
		}

		if (!settingsRow) return DEFAULT_SEO_SETTINGS;

		return parseSeoSettings({
			site: {
				name: settingsRow.site_name,
				url: settingsRow.site_url,
				description: settingsRow.site_description,
				ogImage: settingsRow.site_og_image,
			},
			verification: {
				google: settingsRow.verification_google,
				bing: settingsRow.verification_bing,
				yandex: settingsRow.verification_yandex,
				baidu: settingsRow.verification_baidu,
				pinterest: settingsRow.verification_pinterest,
				yahoo: settingsRow.verification_yahoo,
				custom:
					customTags?.map((tag) => ({
						id: String(tag.id),
						name: tag.name,
						content: tag.content,
					})) ?? [],
			},
			analytics: {
				googleAnalyticsId: settingsRow.analytics_google_analytics_id,
				googleTagManagerId: settingsRow.analytics_google_tag_manager_id,
			},
			monetization: {
				googleAdsenseClientId:
					settingsRow.monetization_google_adsense_client_id,
				googleAdsenseSlots: {
					homeInline1:
						settingsRow.monetization_google_adsense_slot_home_inline1,
					newsListInline1:
						settingsRow.monetization_google_adsense_slot_news_list_inline1,
					newsArticleInline1:
						settingsRow.monetization_google_adsense_slot_news_article_inline1,
					recruitmentInline1:
						settingsRow.monetization_google_adsense_slot_recruitment_inline1,
				},
				adsTxtContent: settingsRow.monetization_ads_txt_content,
			},
			social: {
				twitterSite: settingsRow.social_twitter_site,
				twitterCreator: settingsRow.social_twitter_creator,
				facebookAppId: settingsRow.social_facebook_app_id,
			},
			cookieConsent: {
				enabled: settingsRow.cookie_consent_enabled ?? undefined,
				cookieName: settingsRow.cookie_consent_cookie_name,
				consentModalTitle: settingsRow.cookie_consent_consent_modal_title,
				consentModalDescription:
					settingsRow.cookie_consent_consent_modal_description,
				acceptAllLabel: settingsRow.cookie_consent_accept_all_label,
				acceptNecessaryLabel: settingsRow.cookie_consent_accept_necessary_label,
				showPreferencesLabel: settingsRow.cookie_consent_show_preferences_label,
				preferencesTitle: settingsRow.cookie_consent_preferences_title,
				savePreferencesLabel: settingsRow.cookie_consent_save_preferences_label,
				closeLabel: settingsRow.cookie_consent_close_label,
				necessaryTitle: settingsRow.cookie_consent_necessary_title,
				necessaryDescription: settingsRow.cookie_consent_necessary_description,
				analyticsTitle: settingsRow.cookie_consent_analytics_title,
				analyticsDescription: settingsRow.cookie_consent_analytics_description,
				analyticsLabel: settingsRow.cookie_consent_analytics_label,
				analyticsEnabled:
					settingsRow.cookie_consent_analytics_enabled ?? undefined,
				marketingLabel: settingsRow.cookie_consent_marketing_label,
				marketingDescription: settingsRow.cookie_consent_marketing_description,
				marketingEnabled:
					settingsRow.cookie_consent_marketing_enabled ?? undefined,
				securityEnabled:
					settingsRow.cookie_consent_security_enabled ?? undefined,
			},
			robots: {
				index: settingsRow.robots_index ?? undefined,
				follow: settingsRow.robots_follow ?? undefined,
				maxImagePreview: settingsRow.robots_max_image_preview ?? undefined,
				maxSnippet: settingsRow.robots_max_snippet ?? undefined,
				maxVideoPreview: settingsRow.robots_max_video_preview ?? undefined,
			},
			schema: {
				organization: settingsRow.schema_organization ?? undefined,
				website: settingsRow.schema_website ?? undefined,
				breadcrumb: settingsRow.schema_breadcrumb ?? undefined,
				article: settingsRow.schema_article ?? undefined,
				newsArticle: settingsRow.schema_news_article ?? undefined,
			},
		});
	} catch {
		return DEFAULT_SEO_SETTINGS;
	}
}

export const getSeoSettings = unstable_cache(
	fetchSeoSettings,
	["seo-settings-singleton"],
	{
		tags: [SEO_SETTINGS_CACHE_TAG],
		revalidate: 60,
	},
);

export function buildVerificationMetadata(settings: SeoSettings) {
	const other: Record<string, string> = {};

	if (settings.verification.bing)
		other["msvalidate.01"] = settings.verification.bing;
	if (settings.verification.baidu)
		other["baidu-site-verification"] = settings.verification.baidu;
	if (settings.verification.pinterest)
		other["p:domain_verify"] = settings.verification.pinterest;
	if (settings.verification.yahoo) other["y_key"] = settings.verification.yahoo;

	for (const entry of settings.verification.custom) {
		if (entry.name && entry.content) other[entry.name] = entry.content;
	}

	return Object.keys(other).length ? { other } : {};
}

export function buildRobotsMetadata(
	settings: SeoSettings,
	isPublicPage: boolean,
) {
	const index = isPublicPage && settings.robots.index;
	const follow = isPublicPage && settings.robots.follow;

	return {
		index,
		follow,
		googleBot: {
			index,
			follow,
			"max-video-preview": settings.robots.maxVideoPreview,
			"max-image-preview": settings.robots.maxImagePreview,
			"max-snippet": settings.robots.maxSnippet,
		},
	};
}

function _isPublicSeoRoute(pathname: string) {
	return !pathname.startsWith("/zona-raider") && !pathname.startsWith("/api");
}

export function isMissingSeoSettingsTableError(error: unknown) {
	if (!error || typeof error !== "object") return false;
	const message = (error as { message?: unknown }).message;
	return (
		typeof message === "string" &&
		(message.includes(
			"Could not find the table 'public.seo_settings' in the schema cache",
		) ||
			message.includes(
				"Could not find the table 'public.seo_verification_custom_tags' in the schema cache",
			) ||
			message.includes("Could not find the function public.save_seo_settings"))
	);
}
