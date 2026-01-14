// Scraper Types

export interface ScraperConfig {
  url: string;
  selectors: Record<string, string>;
  mode: 'static' | 'dynamic' | 'auto';
  timeout?: number;
  waitForSelector?: string;
  proxy?: string;
}

export interface ScrapeResult {
  url: string;
  success: boolean;
  data: Record<string, string | string[]>;
  error?: string;
  scrapedAt: string;
  mode: 'static' | 'dynamic';
}

export interface BulkScrapeRequest {
  urls: string[];
  selectors: Record<string, string>;
  mode: 'static' | 'dynamic' | 'auto';
  concurrency?: number;
  delay?: number;
  timeout?: number;
  proxy?: string;
}

export interface ScrapeJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalUrls: number;
  completedUrls: number;
  results: ScrapeResult[];
  createdAt: string;
  updatedAt: string;
}

export interface QueueConfig {
  concurrency: number;
  delay: number;
  timeout: number;
}
