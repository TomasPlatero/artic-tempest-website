/**
 * SEO JSON-LD Structured Data Components
 *
 * These components inject schema.org structured data into pages
 * so that Google can understand the site content and display rich results.
 *
 * Renders inline <script type="application/ld+json"> in the initial HTML.
 * CSP allows 'unsafe-inline' so no nonce is needed for JSON-LD.
 */

import { serializeJsonLd } from "./json-ld-serializer";

interface OrganizationJsonLdProps {
	name: string;
	url: string;
	logo?: string;
	description?: string;
}

function _OrganizationJsonLd({
	name,
	url,
	logo,
	description,
}: OrganizationJsonLdProps) {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name,
		url,
		...(logo && { logo }),
		...(description && { description }),
		sameAs: [] as string[],
	};

	return (
		<script
			type="application/ld+json"
			data-cfasync="false"
			dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
		/>
	);
}

interface WebSiteJsonLdProps {
	name: string;
	url: string;
	description?: string;
}

function _WebSiteJsonLd({ name, url, description }: WebSiteJsonLdProps) {
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name,
		url,
		...(description && { description }),
		inLanguage: "es",
	};

	return (
		<script
			type="application/ld+json"
			data-cfasync="false"
			dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
		/>
	);
}

export { BreadcrumbJsonLd } from "./json-ld-breadcrumb";
