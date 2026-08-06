import { getCspNonce } from "@/shared/security/csp";
import { serializeJsonLd } from "./json-ld-serializer";

interface BreadcrumbItem {
    name: string
    url: string
}

interface BreadcrumbJsonLdProps {
    items: BreadcrumbItem[]
}

export async function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
    const nonce = await getCspNonce();
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    }

    return (
        <script
            id="breadcrumb-jsonld"
            type="application/ld+json"
            data-cfasync="false"
            nonce={nonce}
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
    )
}
