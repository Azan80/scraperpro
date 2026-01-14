'use client';

import { useState, useCallback } from 'react';
import ScraperForm from '@/components/ScraperForm';
import ProgressBar from '@/components/ProgressBar';
import ResultsTable from '@/components/ResultsTable';
import type { ScrapeJob, ScrapeResult } from '@/lib/types';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<ScrapeJob | null>(null);
  const [results, setResults] = useState<ScrapeResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/scrape/status?jobId=${jobId}`);
      const data = await response.json();

      if (data.success && data.job) {
        setCurrentJob(data.job);
        setResults(data.job.results);

        if (data.job.status === 'running' || data.job.status === 'pending') {
          setTimeout(() => pollJobStatus(jobId), 1000);
        } else {
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('Error polling job status:', err);
      setIsLoading(false);
    }
  }, []);

  const handleSubmit = async (data: {
    urls: string[];
    selectors: Record<string, string>;
    mode: 'static' | 'dynamic' | 'auto';
    concurrency: number;
    delay: number;
    fullExtract: boolean;
  }) => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    setCurrentJob(null);

    try {
      if (data.urls.length === 1) {
        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: data.urls[0],
            selectors: data.fullExtract ? {} : data.selectors,
            mode: data.mode,
            fullExtract: data.fullExtract
          })
        });

        const result = await response.json();

        if (result.success) {
          setResults([result.result]);
        } else {
          setError(result.error || 'Failed to scrape URL');
        }
        setIsLoading(false);
      } else {
        const response = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            urls: data.urls,
            selectors: data.fullExtract ? {} : data.selectors,
            mode: data.mode,
            concurrency: data.concurrency,
            delay: data.delay,
            fullExtract: data.fullExtract
          })
        });

        const result = await response.json();

        if (result.success && result.jobId) {
          pollJobStatus(result.jobId);
        } else {
          setError(result.error || 'Failed to start scraping job');
          setIsLoading(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (currentJob?.id) {
      window.open(`/api/scrape/status?jobId=${currentJob.id}&format=${format}`, '_blank');
    } else {
      const content = format === 'json'
        ? JSON.stringify(results, null, 2)
        : results.map(r => Object.values(r.data).join(',')).join('\n');

      const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scrape-results.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <main className="main-container">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🕷️</span>
          <h1>WebScraper Pro</h1>
        </div>
        <p className="tagline">Extract data from any website</p>
      </header>

      <div className="dashboard">
        <section className="form-section-wrapper">
          <div className="section-header">
            <h2>Configuration</h2>
          </div>
          <ScraperForm onSubmit={handleSubmit} isLoading={isLoading} />
        </section>

        <section className="results-section">
          <ResultsTable results={results} onExport={handleExport} />
        </section>

        {error && (
          <div className="error-banner">
            <span>⚠</span> {error}
          </div>
        )}

        {(isLoading || currentJob) && (
          <section className="progress-section">
            <div className="section-header">
              <h2>Progress</h2>
            </div>
            <ProgressBar
              current={currentJob?.completedUrls || 0}
              total={currentJob?.totalUrls || 1}
              status={currentJob?.status || 'pending'}
            />
          </section>
        )}
      </div>

      <footer className="footer">
        <p>Built with Next.js • Puppeteer • Cheerio</p>
      </footer>
    </main>
  );
}
