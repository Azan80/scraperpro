import { stringify } from 'csv-stringify/sync';
import type { ScrapeResult } from './types';

// Export results to JSON
export function exportToJson(results: ScrapeResult[]): string {
    return JSON.stringify(results, null, 2);
}

// Export results to CSV
export function exportToCsv(results: ScrapeResult[]): string {
    if (results.length === 0) {
        return '';
    }

    // Flatten the data for CSV
    const flattenedResults = results.map(result => {
        const flatData: Record<string, string> = {
            url: result.url,
            success: String(result.success),
            mode: result.mode,
            scrapedAt: result.scrapedAt,
            error: result.error || ''
        };

        // Flatten the scraped data
        for (const [key, value] of Object.entries(result.data)) {
            flatData[`data_${key}`] = Array.isArray(value) ? value.join(' | ') : value;
        }

        return flatData;
    });

    // Get all unique column names
    const allColumns = new Set<string>();
    flattenedResults.forEach(row => {
        Object.keys(row).forEach(key => allColumns.add(key));
    });

    const columns = Array.from(allColumns);

    return stringify(flattenedResults, {
        header: true,
        columns
    });
}
