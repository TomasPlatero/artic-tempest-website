/**
 * JSON-LD injected in root layout <head> — guaranteed in initial HTML.
 * RSC streaming cannot defer head content, so crawlers always see these.
 */
import { getGuildBranding } from "@/shared/guild/guild-branding";
import { getSeoSettings } from "@/shared/seo/seo-settings";
import { serializeJsonLd } from "./json-ld-serializer";

export async function JsonLdHead() {
	const [guild, seoSettings] = await Promise.all([
		getGuildBranding(),
		getSeoSettings(),
	]);

	const guildName = guild?.name || "Artic Tempest";
	const siteUrl = seoSettings.site.url || "https://artictempest.es";
	const logo = guild?.icon_url || "https://artictempest.es/assets/images/logo.webp";
	const description = seoSettings.site.description;

	const organization = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: guildName,
		url: siteUrl,
		logo,
		...(description && { description }),
		sameAs: [] as string[],
	};

	const webSite = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: guildName,
		url: siteUrl,
		...(description && { description }),
		inLanguage: "es",
	};

	return (
		<>
			<script
				type="application/ld+json"
				data-cfasync="false"
				dangerouslySetInnerHTML={{ __html: serializeJsonLd(organization) }}
			/>
			<script
				type="application/ld+json"
				data-cfasync="false"
				dangerouslySetInnerHTML={{ __html: serializeJsonLd(webSite) }}
			/>
		</>
	);
}
