/**
 * SEO JSON-LD — ItemList Structured Data
 *
 * Injects ItemList schema for list pages (news, resources, etc.)
 * so Google can understand the collection of items.
 */

import Script from "next/script";
import { getCspNonce } from "@/shared/security/csp";
import { serializeJsonLd } from "./json-ld-serializer";

interface ItemListEntry {
	url: string;
	name: string;
	description?: string;
	image?: string;
	datePublished?: string;
	author?: string;
}

interface ItemListJsonLdProps {
	itemListElement: ItemListEntry[];
	itemListType?: "ItemList" | "Blog";
	numberOfItems?: number;
}

/**
 * ItemList JSON-LD for paginated list pages.
 *
 * Each entry can carry article metadata — Google uses this to
 * understand the content of each item in the list.
 *
 * @example
 *   <ItemListJsonLd
 *     itemListElement={newsItems.map(item => ({
 *       url: \`\${baseUrl}/noticias/\${item.slug}\`,
 *       name: item.title,
 *       description: item.summary,
 *       image: item.image_url ?? undefined,
 *       datePublished: item.created_at,
 *       author: item.author,
 *     }))}
 *     numberOfItems={totalCount}
 *   />
 */
export async function ItemListJsonLd({
	itemListElement,
	itemListType = "ItemList",
	numberOfItems,
}: ItemListJsonLdProps) {
	const nonce = await getCspNonce();

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": itemListType,
		numberOfItems: numberOfItems ?? itemListElement.length,
		itemListElement: itemListElement.map((entry, index) => ({
			"@type": "ListItem",
			position: index + 1,
			url: entry.url,
			item: {
				"@type": "NewsArticle",
				...(entry.name && { headline: entry.name }),
				...(entry.description && { description: entry.description }),
				...(entry.image && { image: entry.image }),
				...(entry.datePublished && { datePublished: entry.datePublished }),
				...(entry.author && {
					author: {
						"@type": "Person",
						name: entry.author,
					},
				}),
			},
		})),
	};

	return (
		<Script
			id="itemlist-jsonld"
			type="application/ld+json"
			data-cfasync="false"
			nonce={nonce}
			strategy="afterInteractive"
		>
			{serializeJsonLd(jsonLd)}
		</Script>
	);
}
