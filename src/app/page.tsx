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
    <main className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-neon-green/30 selection:text-neon-green">

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black opacity-80"></div>
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-150 contrast-150 mix-blend-overlay"></div>

      <div className="relative z-10 max-w-[1800px] mx-auto px-4 py-8 md:p-12">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-zinc-900 pb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-bold">System Online // v2.0.4</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white leading-none">
              ARROW<span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-emerald-600">KILL</span>
            </h1>
            <p className="mt-6 text-zinc-400 text-sm md:text-base max-w-lg leading-relaxed border-l-2 border-neon-green/50 pl-5 font-mono">
              Advanced High-Velocity Data Extraction Engine.
              <span className="block text-zinc-500 text-xs mt-2 uppercase tracking-tight">Autonomous Crawling • Dynamic Rendering • Distributed Concurrency</span>
            </p>
          </div>

          {/* Stats / Status Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 font-mono text-xs border-t md:border-t-0 border-zinc-900 pt-6 md:pt-0">
            <div className="space-y-1">
              <span className="block uppercase tracking-wider text-zinc-600 font-bold">Status</span>
              <span className="block text-xl text-neon-green">OPERATIONAL</span>
            </div>
            <div className="space-y-1">
              <span className="block uppercase tracking-wider text-zinc-600 font-bold">Latency</span>
              <span className="block text-xl text-white">12<span className="text-zinc-700 text-sm">ms</span></span>
            </div>
            <div className="space-y-1">
              <span className="block uppercase tracking-wider text-zinc-600 font-bold">Uptime</span>
              <span className="block text-xl text-white">99.9<span className="text-zinc-700 text-sm">%</span></span>
            </div>
            <div className="space-y-1">
              <span className="block uppercase tracking-wider text-zinc-600 font-bold">Protocol</span>
              <span className="block text-xl text-zinc-400">HTTPS/WSS</span>
            </div>
          </div>
        </header>

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Controls (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <section className="bg-black border border-zinc-800 p-1">
              <div className="bg-zinc-950 p-6 border border-zinc-900/50">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <svg className="w-4 h-4 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Configuration
                  </h2>
                </div>

                <ScraperForm onSubmit={handleSubmit} isLoading={isLoading} />
              </div>
            </section>

            {/* Quick Helper Card */}
            <div className="p-5 border border-zinc-800 bg-zinc-900/30">
              <h3 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3 font-bold">Optimization Protocol</h3>
              <ul className="space-y-3 text-[10px] text-zinc-400 font-mono uppercase">
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">::</span> Use 'Dynamic' for SPA/JS sites
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">::</span> Increase delay for strict firewalls
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">::</span> Max threads depends on CPU cores
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Output (9 cols) */}
          <div className="lg:col-span-9 flex flex-col h-full min-h-[800px]">

            {/* Results Section */}
            <div className="flex-1 bg-zinc-900/10 border border-zinc-800 p-1 backdrop-blur-sm flex flex-col">
              <div className="bg-black flex-1 border border-zinc-900 p-6 flex flex-col">

                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                      <svg className="w-4 h-4 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                      Data Output Console
                    </h2>
                  </div>
                  {isLoading && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-neon-green animate-ping rounded-full"></span>
                      <span className="text-xs text-neon-green font-mono">PROCESSING DATA STREAM...</span>
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="flex-1 relative min-h-0 flex flex-col">
                  {error && (
                    <div className="p-4 mb-4 bg-red-950/30 border border-red-900/50 flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest">Execution Error</h4>
                        <p className="text-xs text-red-300/70 mt-1 font-mono">{error}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 min-h-0">
                    <ResultsTable results={results} onExport={handleExport} />
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar (Visible when active) */}
            {(isLoading || currentJob) && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Processing Task</span>
                  <span className="text-[10px] font-mono text-neon-green bg-neon-green/10 px-2 py-0.5 rounded border border-neon-green/20">{currentJob?.status.toUpperCase() || 'IDLE'}</span>
                </div>
                <ProgressBar
                  current={currentJob?.completedUrls || 0}
                  total={currentJob?.totalUrls || 1}
                  status={currentJob?.status || 'pending'}
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
