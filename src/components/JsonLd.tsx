import Script from 'next/script';
import {
    defaultWebsiteSchema,
    defaultSoftwareSchema,
    defaultOrganizationSchema
} from '@/lib/structured-data';

interface JsonLdProps {
    data?: object | object[];
}

// Component to inject JSON-LD structured data
export default function JsonLd({ data }: JsonLdProps) {
    // Use default schemas if no data provided
    const schemas = data
        ? (Array.isArray(data) ? data : [data])
        : [defaultWebsiteSchema, defaultSoftwareSchema, defaultOrganizationSchema];

    return (
        <>
            {schemas.map((schema, index) => (
                <Script
                    key={index}
                    id={`json-ld-${index}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                    strategy="afterInteractive"
                />
            ))}
        </>
    );
}
