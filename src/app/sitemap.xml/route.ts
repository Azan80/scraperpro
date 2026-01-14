import { NextResponse } from 'next/server';

export async function GET() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://arrowkill.com';
    const currentDate = new Date().toISOString().split('T')[0];

    // Define all your pages here
    const pages = [
        {
            url: '/',
            lastmod: currentDate,
            changefreq: 'weekly',
            priority: '1.0',
        },
        // Add more pages as your app grows
        // {
        //   url: '/about',
        //   lastmod: currentDate,
        //   changefreq: 'monthly',
        //   priority: '0.8',
        // },
        // {
        //   url: '/docs',
        //   lastmod: currentDate,
        //   changefreq: 'weekly',
        //   priority: '0.9',
        // },
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${pages
            .map(
                (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
            )
            .join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
}
