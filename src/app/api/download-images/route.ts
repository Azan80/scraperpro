import { NextRequest, NextResponse } from 'next/server';
import AdmZip from 'adm-zip';

export async function POST(request: NextRequest) {
    try {
        const { images } = await request.json();

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No images provided' },
                { status: 400 }
            );
        }

        const zip = new AdmZip();
        const downloadPromises = images.map(async (img: { url: string; alt: string }, index: number) => {
            try {
                // Handle base64 images
                if (img.url.startsWith('data:image')) {
                    const matches = img.url.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        const extension = matches[1];
                        const data = Buffer.from(matches[2], 'base64');
                        const filename = `image-${index + 1}-${sanitizeFilename(img.alt)}.${extension}`;
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

                const filename = `image-${index + 1}-${sanitizeFilename(img.alt)}.${extension}`;
                zip.addFile(filename, buffer);
            } catch (error) {
                console.error(`Failed to download image: ${img.url}`, error);
            }
        });

        await Promise.all(downloadPromises);

        const zipBuffer = zip.toBuffer();

        // Convert buffer to Blob/Uint8Array for NextResponse
        const responseBody = new Uint8Array(zipBuffer);

        return new NextResponse(responseBody, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename=images.zip'
            }
        });

    } catch (error) {
        console.error('Download API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate zip' },
            { status: 500 }
        );
    }
}

function sanitizeFilename(name: string): string {
    if (!name) return 'untitled';
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 50);
}

function isValidUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}
