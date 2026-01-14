import { NextRequest, NextResponse } from 'next/server';
import AdmZip from 'adm-zip';

export async function POST(request: NextRequest) {
    try {
        const { results } = await request.json();

        if (!results || !Array.isArray(results) || results.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No results provided' },
                { status: 400 }
            );
        }

        const zip = new AdmZip();

        // Add the JSON data as a file
        zip.addFile('data.json', Buffer.from(JSON.stringify(results, null, 2)));

        // Collect all images from the results
        const imagesToDownload: { url: string; alt: string; filename: string }[] = [];
        const processedUrls = new Set<string>();

        results.forEach((result, rIndex) => {
            const data = result.data;
            if (!data) return;

            Object.entries(data).forEach(([key, value]) => {
                const isImages = key.toLowerCase().includes('image') || key.toLowerCase().includes('img');

                if (isImages) {
                    const items = Array.isArray(value) ? value : [value];

                    items.forEach((item: any, i: number) => {
                        if (typeof item !== 'string') return;

                        // Parse simple strings or complex entries
                        let url = item;
                        let alt = '';

                        // Handle "Alt: Url" format if present (from scraper logic)
                        if (item.includes(': http')) {
                            const parts = item.split(': http');
                            alt = parts[0];
                            url = 'http' + parts[1];
                        } else if (item.includes(': data:image')) {
                            const parts = item.split(': data:image');
                            alt = parts[0];
                            url = 'data:image' + parts[1];
                        }

                        if (!url || processedUrls.has(url)) return;
                        processedUrls.add(url);

                        imagesToDownload.push({
                            url,
                            alt,
                            filename: `images/row-${rIndex + 1}-${key}-${i + 1}`
                        });
                    });
                }
            });
        });

        // Download or process all images
        const downloadPromises = imagesToDownload.map(async (img) => {
            try {
                // Handle base64 images
                if (img.url.startsWith('data:image')) {
                    const matches = img.url.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        const extension = matches[1].replace('jpeg', 'jpg');
                        const data = Buffer.from(matches[2], 'base64');
                        const filename = `${img.filename}.${extension}`;
                        zip.addFile(filename, data);
                    }
                    return;
                }

                // Handle valid HTTP(S) URLs
                if (!isValidUrl(img.url)) return;

                const response = await fetch(img.url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });

                if (!response.ok) return;

                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Try to guess extension from content-type or url
                let extension = 'jpg';
                const contentType = response.headers.get('content-type');
                if (contentType) {
                    extension = contentType.split('/')[1] || 'jpg';
                } else {
                    const urlExt = img.url.split('.').pop();
                    if (urlExt && urlExt.length < 5) extension = urlExt;
                }

                // Clean extension
                extension = extension.replace('jpeg', 'jpg');

                const filename = `${img.filename}.${extension}`;
                zip.addFile(filename, buffer);

            } catch (error) {
                console.error(`Failed to download image: ${img.url}`, error);
            }
        });

        // Limit concurrency to avoid timeouts or overwhelming servers
        // Process in chunks of 10
        for (let i = 0; i < downloadPromises.length; i += 10) {
            const chunk = downloadPromises.slice(i, i + 10);
            await Promise.all(chunk);
        }

        const zipBuffer = zip.toBuffer();
        const responseBody = new Uint8Array(zipBuffer);

        return new NextResponse(responseBody, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename=scrape-export-${new Date().getTime()}.zip`
            }
        });

    } catch (error) {
        console.error('Download All API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate zip' },
            { status: 500 }
        );
    }
}

function isValidUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}
