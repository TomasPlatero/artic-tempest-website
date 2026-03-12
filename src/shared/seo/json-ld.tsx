/**
 * SEO JSON-LD Structured Data Components
 * 
 * These components inject schema.org structured data into pages
 * so that Google can understand the site content and display rich results.
 */

interface OrganizationJsonLdProps {
    name: string
    url: string
    logo?: string
    description?: string
}

export function OrganizationJsonLd({ name, url, logo, description }: OrganizationJsonLdProps) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name,
        url,
        ...(logo && { logo }),
        ...(description && { description }),
        sameAs: [] as string[],
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    )
}

interface WebSiteJsonLdProps {
    name: string
    url: string
    description?: string
}

export function WebSiteJsonLd({ name, url, description }: WebSiteJsonLdProps) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name,
        url,
        ...(description && { description }),
        inLanguage: "es",
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    )
}

interface BreadcrumbItem {
    name: string
    url: string
}

interface BreadcrumbJsonLdProps {
    items: BreadcrumbItem[]
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
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
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    )
}
