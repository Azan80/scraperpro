import { NextRequest, NextResponse } from 'next/server';
import { scrape, scrapeWithFullExtraction } from '@/lib/scraper';
import { createScrapeJob, getJob } from '@/lib/queue';
import type { ScraperConfig, BulkScrapeRequest } from '@/lib/types';

// POST - Start a scraping job
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Single URL scraping
        if (body.url && !body.urls) {
            const config: ScraperConfig = {
                url: body.url,
                selectors: body.selectors || { title: 'title', description: 'meta[name="description"]' },
                mode: body.mode || 'auto',
                timeout: body.timeout || 300000,
                waitForSelector: body.waitForSelector,
                proxy: body.proxy
            };

            // Use full extraction if requested or if no selectors provided
            const fullExtract = body.fullExtract || Object.keys(body.selectors || {}).length === 0;
            const result = await (fullExtract
                ? scrapeWithFullExtraction(config)
                : scrape(config));

            return NextResponse.json({
                success: true,
                result
            });
        }

        // Bulk URL scraping
        if (body.urls && Array.isArray(body.urls)) {
            const bulkRequest: BulkScrapeRequest = {
                urls: body.urls,
                selectors: body.selectors || { title: 'title' },
                mode: body.mode || 'auto',
                concurrency: body.concurrency || 3,
                delay: body.delay || 1000,
                timeout: body.timeout || 300000
            };

            const jobId = await createScrapeJob(
                bulkRequest.urls,
                bulkRequest.selectors,
                bulkRequest.mode,
                {
                    concurrency: bulkRequest.concurrency || 3,
                    delay: bulkRequest.delay || 1000,
                    timeout: body.timeout || 300000,
                }
            );

            return NextResponse.json({
                success: true,
                jobId,
                message: 'Scraping job started',
                checkStatusAt: `/api/scrape/status?jobId=${jobId}`
            });
        }

        return NextResponse.json(
            { success: false, error: 'Missing url or urls in request body' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Scrape API error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// GET - Get job status
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
        return NextResponse.json(
            { success: false, error: 'Missing jobId parameter' },
            { status: 400 }
        );
    }

    const job = getJob(jobId);

    if (!job) {
        return NextResponse.json(
            { success: false, error: 'Job not found' },
            { status: 404 }
        );
    }

    return NextResponse.json({
        success: true,
        job
    });
}
