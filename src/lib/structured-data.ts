// JSON-LD Structured Data for SEO
// This helps search engines understand your content better

export interface WebsiteSchema {
    name: string;
    description: string;
    url: string;
}

export interface SoftwareApplicationSchema {
    name: string;
    description: string;
    url: string;
    applicationCategory: string;
    operatingSystem: string;
    offers?: {
        price: string;
        priceCurrency: string;
    };
}

export interface OrganizationSchema {
    name: string;
    url: string;
    logo?: string;
    sameAs?: string[];
}

// Generate Website structured data
export function generateWebsiteSchema(data: WebsiteSchema): object {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: data.name,
        description: data.description,
        url: data.url,
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${data.url}/search?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    };
}

// Generate SoftwareApplication structured data
export function generateSoftwareApplicationSchema(data: SoftwareApplicationSchema): object {
    return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: data.name,
        description: data.description,
        url: data.url,
        applicationCategory: data.applicationCategory,
        operatingSystem: data.operatingSystem,
        ...(data.offers && {
            offers: {
                "@type": "Offer",
                price: data.offers.price,
                priceCurrency: data.offers.priceCurrency,
            },
        }),
    };
}

// Generate Organization structured data
export function generateOrganizationSchema(data: OrganizationSchema): object {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: data.name,
        url: data.url,
        ...(data.logo && { logo: data.logo }),
        ...(data.sameAs && { sameAs: data.sameAs }),
    };
}

// Generate BreadcrumbList structured data
export function generateBreadcrumbSchema(items: { name: string; url: string }[]): object {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

// Default schemas for WebScraper Pro
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://arrowkill.com';

export const defaultWebsiteSchema = generateWebsiteSchema({
    name: "WebScraper Pro",
    description: "A powerful web scraping tool with support for static and dynamic content, concurrent requests, and real-time progress tracking.",
    url: baseUrl,
});

export const defaultSoftwareSchema = generateSoftwareApplicationSchema({
    name: "WebScraper Pro",
    description: "Extract data from any website with support for static HTML and dynamic JavaScript-rendered content.",
    url: baseUrl,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    offers: {
        price: "0",
        priceCurrency: "USD",
    },
});

export const defaultOrganizationSchema = generateOrganizationSchema({
    name: "WebScraper Pro",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
        // Add your social media URLs here
        // "https://twitter.com/webscraperpro",
        // "https://github.com/webscraperpro",
    ],
});
