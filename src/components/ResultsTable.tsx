'use client';

import type { ScrapeResult } from '@/lib/types';
import { useState } from 'react';

interface ResultsTableProps {
    results: ScrapeResult[];
    onExport: (format: 'json' | 'csv') => void;
}

// Helper to check if string is an image URL
function isImageUrl(str: string): boolean {
    if (!str || typeof str !== 'string') return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
    const lowerStr = str.toLowerCase();
    return imageExtensions.some(ext => lowerStr.includes(ext)) ||
        lowerStr.includes('image') ||
        lowerStr.includes('/img/') ||
        lowerStr.includes('/images/');
}

// Helper to get full URL
function getFullUrl(url: string, baseUrl: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
        return url.startsWith('//') ? 'https:' + url : url;
    }
    try {
        const base = new URL(baseUrl);
        return new URL(url, base.origin).href;
    } catch {
        return url;
    }
}

// Extract image URL from "alt: url" format
function parseImageEntry(entry: string): { url: string; alt: string } {
    if (entry.includes(': http')) {
        const colonIndex = entry.indexOf(': http');
        return {
            alt: entry.slice(0, colonIndex).trim(),
            url: entry.slice(colonIndex + 2).trim()
        };
    }
    return { url: entry, alt: '' };
}

export default function ResultsTable({ results, onExport }: ResultsTableProps) {
    const [selectedResult, setSelectedResult] = useState<ScrapeResult | null>(null);
    const [activeTab, setActiveTab] = useState<'table' | 'preview'>('preview');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const [isDownloading, setIsDownloading] = useState(false);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-300 mb-2 uppercase tracking-wide">Awaiting Data</h3>
                <p className="text-sm text-zinc-600 max-w-xs font-mono">Initiate extraction sequence to visualize data streams.</p>
            </div>
        );
    }

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleDownloadAll = async () => {
        setIsDownloadingAll(true);
        try {
            const response = await fetch('/api/download-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results })
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `scrape-export-${new Date().getTime()}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download full export');
        } finally {
            setIsDownloadingAll(false);
        }
    };

    const handleDownloadImages = async (images: (string | { url: string; alt: string })[]) => {
        setIsDownloading(true);
        try {
            const imageObjects = images.map(img => {
                if (typeof img === 'string') return parseImageEntry(img);
                return img;
            });

            const response = await fetch('/api/download-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ images: imageObjects })
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `images-${new Date().getTime()}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download images');
        } finally {
            setIsDownloading(false);
        }
    };

    const previewResult = selectedResult || results[0];
    const baseUrl = previewResult.url;

    // Render content based on key type
    const renderContent = (key: string, value: string | string[]) => {
        const isImages = key.toLowerCase() === 'images' || key.toLowerCase() === 'ogimage';

        if (isImages && Array.isArray(value)) {
            return (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                            {value.length} IMAGES FOUND
                        </span>
                        {value.length > 0 && (
                            <button
                                onClick={() => handleDownloadImages(value)}
                                disabled={isDownloading}
                                className="text-xs flex items-center gap-2 text-neon-green hover:text-white transition-colors uppercase tracking-wide font-medium disabled:opacity-50"
                            >
                                {isDownloading ? (
                                    <span className="animate-pulse">Archiving...</span>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download ZIP
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {value.slice(0, 8).map((item, i) => {
                            const { url, alt } = parseImageEntry(String(item));
                            const fullUrl = getFullUrl(url, baseUrl);
                            return (
                                <div key={i} className="relative aspect-square bg-zinc-900 border border-zinc-800 group overflow-hidden">
                                    <img
                                        src={fullUrl}
                                        alt={alt || `Image ${i + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                    {alt && (
                                        <span className="absolute bottom-0 left-0 right-0 p-1 bg-black/80 text-[10px] text-zinc-400 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                            {alt}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                        {value.length > 8 && (
                            <div className="aspect-square bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-500 hover:text-neon-green hover:border-neon-green/30 transition-colors cursor-pointer">
                                <span className="text-lg font-bold">+{value.length - 8}</span>
                                <span className="text-[10px] uppercase">More</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Single image
        if (isImages && typeof value === 'string' && value) {
            const fullUrl = getFullUrl(value, baseUrl);
            return (
                <div className="relative aspect-video bg-zinc-900 border border-zinc-800 overflow-hidden group">
                    <img
                        src={fullUrl}
                        alt="OG Image"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        onError={(e) => {
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-xs text-zinc-600 font-mono">IMAGE LOAD FAILED</div>';
                        }}
                    />
                </div>
            );
        }

        // Links
        if (key.toLowerCase() === 'links' && Array.isArray(value)) {
            return (
                <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {value.slice(0, 8).map((item, i) => {
                        const parts = String(item).split(' -> ');
                        const text = parts[0];
                        const href = parts[1] || parts[0];
                        const fullHref = getFullUrl(href, baseUrl);
                        return (
                            <a
                                key={i}
                                href={fullHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block px-3 py-2 bg-zinc-900/50 border border-zinc-800/50 hover:border-neon-green/30 hover:bg-zinc-900 text-xs text-neon-green/80 hover:text-neon-green transition-all truncate font-mono"
                            >
                                <span className="opacity-50 mr-2">[{i + 1}]</span>
                                {text.slice(0, 50)}{text.length > 50 ? '...' : ''}
                            </a>
                        );
                    })}
                    {value.length > 8 && (
                        <span className="block px-3 py-2 text-[10px] text-zinc-600 uppercase tracking-widest text-center">
                            +{value.length - 8} more links
                        </span>
                    )}
                </div>
            );
        }

        // Regular arrays
        if (Array.isArray(value)) {
            return (
                <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {value.slice(0, 6).map((item, i) => (
                        <div key={i} className="px-3 py-2 bg-zinc-900/50 border-l-2 border-zinc-800 text-sm text-zinc-400 font-mono hover:border-neon-green hover:text-zinc-200 transition-colors">
                            {String(item).slice(0, 150)}
                        </div>
                    ))}
                    {value.length > 6 && (
                        <span className="block px-3 py-2 text-[10px] text-zinc-600 uppercase tracking-widest text-center">
                            +{value.length - 6} more items
                        </span>
                    )}
                </div>
            );
        }

        // Regular text
        return (
            <p className="text-sm text-zinc-400 leading-relaxed font-mono">
                {String(value).slice(0, 400) || '—'}
                {String(value).length > 400 && '...'}
            </p>
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tabs Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-1 bg-black border border-zinc-800 p-1">
                    <button
                        className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'preview'
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        onClick={() => setActiveTab('preview')}
                    >
                        Preview
                    </button>
                    <button
                        className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'table'
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        onClick={() => setActiveTab('table')}
                    >
                        Table
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                        {results.length} ENTRIES
                    </span>
                    <div className="h-4 w-px bg-zinc-800"></div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadAll}
                            disabled={isDownloadingAll}
                            className="premium-button flex items-center gap-2"
                        >
                            {isDownloadingAll ? (
                                <span className="animate-pulse">Zipping...</span>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download All ZIP
                                </>
                            )}
                        </button>
                        <div className="w-px bg-zinc-800 mx-1"></div>
                        <button
                            onClick={() => onExport('json')}
                            className="premium-button-outline px-3 py-1 flex items-center gap-2"
                        >
                            JSON
                        </button>
                        <button
                            onClick={() => onExport('csv')}
                            className="premium-button-outline px-3 py-1 flex items-center gap-2"
                        >
                            CSV
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'preview' ? (
                <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                    {/* URL Selector */}
                    {results.length > 1 && (
                        <div className="flex items-center gap-4 bg-zinc-900/50 p-3 border border-zinc-800">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Selected Source:</label>
                            <select
                                value={previewResult.url}
                                onChange={(e) => {
                                    const result = results.find(r => r.url === e.target.value);
                                    if (result) setSelectedResult(result);
                                }}
                                className="flex-1 bg-transparent text-sm text-neon-green font-mono focus:outline-none cursor-pointer"
                            >
                                {results.map((r, i) => (
                                    <option key={i} value={r.url} className="bg-black text-zinc-300">
                                        [{r.success ? '✓' : '✗'}] {r.url}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Status Card */}
                    <div className="p-5 bg-zinc-900/30 border-l-2 border-neon-green">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center gap-2 px-2 py-1 text-[10px] font-bold uppercase tracking-widest ${previewResult.success
                                    ? 'bg-neon-green-t-10 text-neon-green'
                                    : 'bg-red-900/20 text-red-500'
                                    }`}>
                                    {previewResult.success ? 'SUCCESS' : 'FAILED'}
                                </span>
                                <span className="text-[10px] text-zinc-600 font-mono uppercase">
                                    {previewResult.mode} MODE
                                </span>
                            </div>
                            <span className="text-[10px] text-zinc-600 font-mono">
                                T-{new Date(previewResult.scrapedAt).toLocaleTimeString()}
                            </span>
                        </div>
                        <a
                            href={previewResult.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-lg font-light text-white hover:text-neon-green transition-colors break-all leading-tight"
                        >
                            {previewResult.url}
                        </a>
                    </div>

                    {/* Data Cards */}
                    <div className="grid gap-px bg-zinc-900 border border-zinc-900">
                        {Object.entries(previewResult.data).map(([key, value]) => (
                            <div key={key} className="p-5 bg-black hover:bg-zinc-900/30 transition-colors group">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-neon-green transition-colors">
                                        {key}
                                    </span>
                                    <button
                                        onClick={() => copyToClipboard(Array.isArray(value) ? value.join('\n') : String(value), key)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-white transition-all"
                                        title="Copy Data"
                                    >
                                        {copiedKey === key ? (
                                            <svg className="w-4 h-4 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {renderContent(key, value)}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-x-auto border border-zinc-800 bg-black">
                    <table className="w-full text-xs font-mono">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                <th className="px-4 py-3 text-left font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                                <th className="px-4 py-3 text-left font-bold text-zinc-500 uppercase tracking-widest">URL</th>
                                <th className="px-4 py-3 text-left font-bold text-zinc-500 uppercase tracking-widest">Mode</th>
                                <th className="px-4 py-3 text-left font-bold text-zinc-500 uppercase tracking-widest">Fields</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {results.map((result, index) => (
                                <tr
                                    key={index}
                                    className={`hover:bg-zinc-900 cursor-pointer transition-colors ${selectedResult === result ? 'bg-zinc-900 border-l-2 border-neon-green' : 'border-l-2 border-transparent'
                                        }`}
                                    onClick={() => {
                                        setSelectedResult(result);
                                        setActiveTab('preview');
                                    }}
                                >
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold ${result.success
                                            ? 'bg-neon-green text-black'
                                            : 'bg-red-500 text-black'
                                            }`}>
                                            {result.success ? '✓' : '✗'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-zinc-300">
                                        {result.url.length > 50 ? result.url.substring(0, 50) + '...' : result.url}
                                    </td>
                                    <td className="px-4 py-3 uppercase text-zinc-500">
                                        {result.mode}
                                    </td>
                                    <td className="px-4 py-3 text-neon-green">
                                        {Object.keys(result.data).length}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copyToClipboard(JSON.stringify(result, null, 2), `row-${index}`);
                                            }}
                                            className="text-zinc-600 hover:text-white transition-colors"
                                        >
                                            JSON
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
