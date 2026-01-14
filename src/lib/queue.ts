import PQueue from 'p-queue';
import { scrape } from './scraper';
import type { ScraperConfig, ScrapeResult, QueueConfig, ScrapeJob } from './types';

// In-memory job storage (in production, use a database)
const jobs = new Map<string, ScrapeJob>();

// Generate unique job ID
function generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Delay utility
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Create and run a scraping job
export async function createScrapeJob(
    urls: string[],
    selectors: Record<string, string>,
    mode: 'static' | 'dynamic' | 'auto',
    queueConfig: QueueConfig = { concurrency: 3, delay: 1000, timeout: 30000 }
): Promise<string> {
    const jobId = generateJobId();

    const job: ScrapeJob = {
        id: jobId,
        status: 'pending',
        totalUrls: urls.length,
        completedUrls: 0,
        results: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    jobs.set(jobId, job);

    // Process in background
    processJob(jobId, urls, selectors, mode, queueConfig);

    return jobId;
}

// Process job with queue
async function processJob(
    jobId: string,
    urls: string[],
    selectors: Record<string, string>,
    mode: 'static' | 'dynamic' | 'auto',
    queueConfig: QueueConfig
): Promise<void> {
    const job = jobs.get(jobId);
    if (!job) return;

    job.status = 'running';
    job.updatedAt = new Date().toISOString();

    const queue = new PQueue({ concurrency: queueConfig.concurrency });

    try {
        const tasks = urls.map((url, index) =>
            queue.add(async () => {
                // Add delay between requests (except for first)
                if (index > 0 && queueConfig.delay > 0) {
                    await delay(queueConfig.delay);
                }

                const config: ScraperConfig = {
                    url,
                    selectors,
                    mode,
                    timeout: queueConfig.timeout
                };

                const result = await scrape(config);

                // Update job progress
                const currentJob = jobs.get(jobId);
                if (currentJob) {
                    currentJob.results.push(result);
                    currentJob.completedUrls = currentJob.results.length;
                    currentJob.updatedAt = new Date().toISOString();
                }

                return result;
            })
        );

        await Promise.all(tasks);

        // Mark job as completed
        const finalJob = jobs.get(jobId);
        if (finalJob) {
            finalJob.status = 'completed';
            finalJob.updatedAt = new Date().toISOString();
        }
    } catch (error) {
        const failedJob = jobs.get(jobId);
        if (failedJob) {
            failedJob.status = 'failed';
            failedJob.updatedAt = new Date().toISOString();
        }
    }
}

// Get job status
export function getJob(jobId: string): ScrapeJob | undefined {
    return jobs.get(jobId);
}

// Get all jobs
export function getAllJobs(): ScrapeJob[] {
    return Array.from(jobs.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

// Delete a job
export function deleteJob(jobId: string): boolean {
    return jobs.delete(jobId);
}

// Clear completed jobs
export function clearCompletedJobs(): number {
    let cleared = 0;
    for (const [id, job] of jobs) {
        if (job.status === 'completed' || job.status === 'failed') {
            jobs.delete(id);
            cleared++;
        }
    }
    return cleared;
}
