import * as cheerio from 'cheerio';
import type { ScraperConfig, ScrapeResult } from './types';

// Static scraping using Cheerio
export async function scrapeStatic(config: ScraperConfig): Promise<ScrapeResult> {
    const { url, selectors, timeout = 300000 } = config;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const data = extractData(html, selectors);

        return {
            url,
            success: true,
            data,
            scrapedAt: new Date().toISOString(),
            mode: 'static'
        };
    } catch (error) {
        return {
            url,
            success: false,
            data: {},
            error: error instanceof Error ? error.message : 'Unknown error',
            scrapedAt: new Date().toISOString(),
            mode: 'static'
        };
    }
}

// Dynamic scraping using Puppeteer
export async function scrapeDynamic(config: ScraperConfig): Promise<ScrapeResult> {
    const { url, selectors, timeout = 300000, waitForSelector } = config;

    let browser = null;

    try {
        // Dynamically import puppeteer-core and @sparticuz/chromium to avoid issues with SSR
        const puppeteer = await import('puppeteer-core');
        const chromium = await import('@sparticuz/chromium');

        const isDev = process.env.NODE_ENV === 'development';
        const executablePath = await (isDev
            ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
            : chromium.default.executablePath(
                'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
            ));

        const launchOptions: any = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--single-process'
            ]
        };

        if (executablePath) {
            launchOptions.executablePath = executablePath;
        }

        browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();

        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Sec-Ch-Ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
        });

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        );

        // Advanced evasion techniques
        await page.evaluateOnNewDocument(() => {
            // Pass webdriver check
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });

            // Pass chrome check
            // @ts-ignore
            window.chrome = {
                runtime: {}
            };

            // Pass permissions check
            const originalQuery = window.navigator.permissions.query;
            // @ts-ignore
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission } as PermissionStatus) :
                    originalQuery(parameters)
            );

            // Pass plugins check
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });

            // Pass languages check
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
        });

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout
        });

        if (waitForSelector) {
            await page.waitForSelector(waitForSelector, { timeout });
        }

        const html = await page.content();
        const data = extractData(html, selectors);

        return {
            url,
            success: true,
            data,
            scrapedAt: new Date().toISOString(),
            mode: 'dynamic'
        };
    } catch (error) {
        return {
            url,
            success: false,
            data: {},
            error: error instanceof Error ? error.message : 'Unknown error',
            scrapedAt: new Date().toISOString(),
            mode: 'dynamic'
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Extract data using CSS selectors - Enhanced to capture more content
export function extractData(html: string, selectors: Record<string, string>): Record<string, string | string[]> {
    const $ = cheerio.load(html);
    const result: Record<string, string | string[]> = {};

    for (const [key, selector] of Object.entries(selectors)) {
        const elements = $(selector);

        if (elements.length === 0) {
            result[key] = '';
        } else if (elements.length === 1) {
            // Get comprehensive content from single element
            const el = elements.first();
            const text = el.text().trim();
            const href = el.attr('href');
            const src = el.attr('src');
            const content = el.attr('content'); // For meta tags
            const value = el.attr('value');
            const alt = el.attr('alt');
            const title = el.attr('title');

            // Prioritize actual text content, then attributes
            result[key] = text || content || href || src || value || alt || title || el.html()?.trim() || '';
        } else {
            // Get content from all matching elements
            result[key] = elements.map((_, el) => {
                const $el = $(el);
                const text = $el.text().trim();
                const href = $el.attr('href');
                const src = $el.attr('src');
                const content = $el.attr('content');
                return text || content || href || src || '';
            }).get().filter(Boolean);
        }
    }

    return result;
}

// Extract all page content comprehensively
export function extractFullPageContent(html: string): Record<string, string | string[]> {
    const $ = cheerio.load(html);

    // Remove script, style, and other non-content elements
    $('script, style, noscript, iframe, svg').remove();

    const result: Record<string, string | string[]> = {};

    // Title
    result.title = $('title').text().trim() || $('h1').first().text().trim() || '';

    // Meta description
    result.metaDescription = $('meta[name="description"]').attr('content') ||
        $('meta[property="og:description"]').attr('content') || '';

    // Meta keywords
    result.metaKeywords = $('meta[name="keywords"]').attr('content') || '';

    // Open Graph data
    result.ogTitle = $('meta[property="og:title"]').attr('content') || '';
    result.ogImage = $('meta[property="og:image"]').attr('content') || '';
    result.ogUrl = $('meta[property="og:url"]').attr('content') || '';

    // All headings
    result.headings = $('h1, h2, h3, h4, h5, h6').map((_, el) => $(el).text().trim()).get().filter(Boolean);

    // All paragraphs
    result.paragraphs = $('p').map((_, el) => $(el).text().trim()).get().filter(text => text.length > 20);

    // All links with text
    result.links = $('a[href]').map((_, el) => {
        const $el = $(el);
        const text = $el.text().trim();
        const href = $el.attr('href') || '';
        return text ? `${text} -> ${href}` : href;
    }).get().filter(Boolean).slice(0, 50); // Limit to 50 links

    // All images
    result.images = $('img[src]').map((_, el) => {
        const $el = $(el);
        const src = $el.attr('src') || '';
        const alt = $el.attr('alt') || '';
        return alt ? `${alt}: ${src}` : src;
    }).get().filter(Boolean).slice(0, 30); // Limit to 30 images

    // Main content (article, main, or body)
    const mainContent = $('article, main, [role="main"], .content, .main-content, #content, #main').first();
    if (mainContent.length) {
        result.mainContent = mainContent.text().replace(/\s+/g, ' ').trim().slice(0, 5000);
    } else {
        result.mainContent = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000);
    }

    // Lists
    result.listItems = $('ul li, ol li').map((_, el) => $(el).text().trim()).get().filter(Boolean).slice(0, 50);

    // Tables - extract as text
    result.tables = $('table').map((_, table) => {
        return $(table).text().replace(/\s+/g, ' ').trim();
    }).get().filter(Boolean).slice(0, 10);

    return result;
}

// Auto-detect if page needs dynamic scraping
export async function scrapeAuto(config: ScraperConfig): Promise<ScrapeResult> {
    // First try static scraping
    const staticResult = await scrapeStatic(config);

    // Check if we got meaningful data
    const hasData = Object.values(staticResult.data).some(val =>
        Array.isArray(val) ? val.length > 0 : val !== ''
    );

    if (staticResult.success && hasData) {
        return staticResult;
    }

    // Fall back to dynamic scraping
    console.log(`Static scraping yielded no data for ${config.url}, trying dynamic...`);
    return scrapeDynamic(config);
}

// Main scrape function
export async function scrape(config: ScraperConfig): Promise<ScrapeResult> {
    switch (config.mode) {
        case 'static':
            return scrapeStatic(config);
        case 'dynamic':
            return scrapeDynamic(config);
        case 'auto':
        default:
            return scrapeAuto(config);
    }
}

// Scrape with full page content extraction (more comprehensive)
export async function scrapeWithFullExtraction(config: ScraperConfig): Promise<ScrapeResult> {
    const { url, timeout = 300000 } = config;

    try {
        // Try static first for speed
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        const data = extractFullPageContent(html);

        // Check if we got meaningful content
        const hasContent = data.mainContent && (data.mainContent as string).length > 100;

        if (hasContent) {
            return {
                url,
                success: true,
                data,
                scrapedAt: new Date().toISOString(),
                mode: 'static'
            };
        }

        // Fall back to dynamic for JS-heavy pages
        console.log(`Static extraction yielded limited content for ${url}, trying dynamic...`);
        return scrapeDynamicWithFullExtraction(config);

    } catch (error) {
        // If static fails, try dynamic
        console.log(`Static scraping failed for ${url}, trying dynamic...`);
        return scrapeDynamicWithFullExtraction(config);
    }
}

// Dynamic scraping with full extraction
async function scrapeDynamicWithFullExtraction(config: ScraperConfig): Promise<ScrapeResult> {
    const { url, timeout = 300000 } = config;
    let browser = null;

    try {
        const puppeteer = await import('puppeteer-core');
        const chromium = await import('@sparticuz/chromium');

        const isDev = process.env.NODE_ENV === 'development';
        const executablePath = await (isDev
            ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
            : chromium.default.executablePath(
                'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
            ));

        const launchOptions: any = {
            headless: true,
            defaultViewport: null,
            executablePath: executablePath,
            args: isDev ? [] : chromium.default.args,
        };

        browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();

        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Sec-Ch-Ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
        });

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        );

        // Advanced evasion techniques
        await page.evaluateOnNewDocument(() => {
            // Pass webdriver check
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });

            // Pass chrome check
            // @ts-ignore
            window.chrome = {
                runtime: {}
            };

            // Pass permissions check
            const originalQuery = window.navigator.permissions.query;
            // @ts-ignore
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission } as PermissionStatus) :
                    originalQuery(parameters)
            );

            // Pass plugins check
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });

            // Pass languages check
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout });

        // Wait a bit for any remaining JS to execute
        await new Promise(resolve => setTimeout(resolve, 1000));

        const html = await page.content();
        const data = extractFullPageContent(html);

        return {
            url,
            success: true,
            data,
            scrapedAt: new Date().toISOString(),
            mode: 'dynamic'
        };
    } catch (error) {
        return {
            url,
            success: false,
            data: {},
            error: error instanceof Error ? error.message : 'Unknown error',
            scrapedAt: new Date().toISOString(),
            mode: 'dynamic'
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
