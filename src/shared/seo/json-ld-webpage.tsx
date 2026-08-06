/**
 * SEO JSON-LD — WebPage + BreadcrumbList Structured Data
 *
 * Injects WebPage schema (with about, description) plus BreadcrumbList
 * for pages in the navigation hierarchy.
 */

import { getCspNonce } from "@/shared/security/csp";
import { serializeJsonLd } from "./json-ld-serializer";

interface WebPageBreadcrumbItem {
	name: string;
	url: string;
}

interface WebPageJsonLdProps {
	webPage: {
		id: string;
		name: string;
		description: string;
	};
	breadcrumb: WebPageBreadcrumbItem[];
}

/**
 * WebPage + BreadcrumbList JSON-LD.
 *
 * Renders a WebPage schema entity linked to the root Organization/WebSite
 * via isPartOf, plus a BreadcrumbList for navigation context.
 *
 * @example
 *   <WebPageJsonLd
 *     webPage={{ id: "/privacidad", name: "Política de Privacidad", description: "..." }}
 *     breadcrumb={[
 *       { name: "Inicio", url: baseUrl },
 *       { name: "Privacidad", url: `${baseUrl}/privacidad` },
 *     ]}
 *   />
 */
export async function WebPageJsonLd({
	webPage,
	breadcrumb,
}: WebPageJsonLdProps) {
	const nonce = await getCspNonce();

	const jsonLd = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebPage",
				"@id": webPage.id,
				name: webPage.name,
				description: webPage.description,
				isPartOf: {
					"@type": "WebSite",
					"@id": breadcrumb[0]?.url ?? webPage.id,
				},
			},
			{
				"@type": "BreadcrumbList",
				itemListElement: breadcrumb.map((item, index) => ({
					"@type": "ListItem",
					position: index + 1,
					name: item.name,
					item: item.url,
				})),
			},
		],
	};

	return (
		<script
			id={`webpage-${webPage.id.replace(/\//g, "-")}-jsonld`}
			type="application/ld+json"
			data-cfasync="false"
			nonce={nonce}
			dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
		/>
	);
}
