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
    // Check for common image extensions or image CDN patterns
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

    if (results.length === 0) {
        return (
            <div className="empty-results">
                <div className="empty-icon-wrapper">
                    <span className="empty-icon">🔍</span>
                </div>
                <h3>No Results Yet</h3>
                <p>Enter a URL above and start scraping to see data here</p>
            </div>
        );
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const previewResult = selectedResult || results[0];
    const baseUrl = previewResult.url;

    // Render content based on key type
    const renderContent = (key: string, value: string | string[]) => {
        const isImages = key.toLowerCase() === 'images' || key.toLowerCase() === 'ogimage';

        if (isImages && Array.isArray(value)) {
            return (
                <div className="image-grid">
                    {value.slice(0, 12).map((item, i) => {
                        const { url, alt } = parseImageEntry(String(item));
                        const fullUrl = getFullUrl(url, baseUrl);
                        return (
                            <div key={i} className="image-preview">
                                <img
                                    src={fullUrl}
                                    alt={alt || `Image ${i + 1}`}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                {alt && <span className="image-alt">{alt}</span>}
                            </div>
                        );
                    })}
                    {value.length > 12 && (
                        <div className="image-more">+{value.length - 12} more</div>
                    )}
                </div>
            );
        }

        // Single image (like ogImage)
        if (isImages && typeof value === 'string' && value) {
            const fullUrl = getFullUrl(value, baseUrl);
            return (
                <div className="image-grid">
                    <div className="image-preview large">
                        <img
                            src={fullUrl}
                            alt="OG Image"
                            onError={(e) => {
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="image-error">Failed to load</span>';
                            }}
                        />
                    </div>
                </div>
            );
        }

        // Links with arrow format
        if (key.toLowerCase() === 'links' && Array.isArray(value)) {
            return (
                <ul className="data-list links-list">
                    {value.slice(0, 8).map((item, i) => {
                        const parts = String(item).split(' -> ');
                        const text = parts[0];
                        const href = parts[1] || parts[0];
                        const fullHref = getFullUrl(href, baseUrl);
                        return (
                            <li key={i}>
                                <a href={fullHref} target="_blank" rel="noopener noreferrer">
                                    {text.slice(0, 60)}{text.length > 60 ? '...' : ''}
                                </a>
                            </li>
                        );
                    })}
                    {value.length > 8 && (
                        <li className="more-items">+{value.length - 8} more links</li>
                    )}
                </ul>
            );
        }

        // Regular arrays
        if (Array.isArray(value)) {
            return (
                <ul className="data-list">
                    {value.slice(0, 10).map((item, i) => (
                        <li key={i}>{String(item).slice(0, 200)}</li>
                    ))}
                    {value.length > 10 && (
                        <li className="more-items">+{value.length - 10} more items</li>
                    )}
                </ul>
            );
        }

        // Regular text
        return <p className="data-text">{String(value).slice(0, 500) || '—'}</p>;
    };

    return (
        <div className="results-container">
            <div className="results-header">
                <div className="results-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preview')}
                    >
                        📋 Preview
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
                        onClick={() => setActiveTab('table')}
                    >
                        📊 Table
                    </button>
                </div>
                <div className="results-meta">
                    <span className="results-count">{results.length} result{results.length !== 1 ? 's' : ''}</span>
                    <div className="export-buttons">
                        <button onClick={() => onExport('json')} className="export-btn json">
                            ⬇ JSON
                        </button>
                        <button onClick={() => onExport('csv')} className="export-btn csv">
                            ⬇ CSV
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'preview' ? (
                <div className="preview-container">
                    {results.length > 1 && (
                        <div className="url-selector">
                            <label>Select URL:</label>
                            <select
                                value={previewResult.url}
                                onChange={(e) => {
                                    const result = results.find(r => r.url === e.target.value);
                                    if (result) setSelectedResult(result);
                                }}
                                className="url-select"
                            >
                                {results.map((r, i) => (
                                    <option key={i} value={r.url}>
                                        {r.success ? '✓' : '✗'} {r.url.slice(0, 50)}...
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="preview-grid">
                        {/* Status Card */}
                        <div className="preview-card status-card">
                            <div className="card-header">
                                <span className={`status-indicator ${previewResult.success ? 'success' : 'error'}`}>
                                    {previewResult.success ? '✓ Success' : '✗ Failed'}
                                </span>
                                <span className="mode-tag">{previewResult.mode}</span>
                            </div>
                            <div className="card-url">
                                <a href={previewResult.url} target="_blank" rel="noopener noreferrer">
                                    {previewResult.url}
                                </a>
                            </div>
                            <div className="card-time">Scraped: {new Date(previewResult.scrapedAt).toLocaleString()}</div>
                        </div>

                        {/* Data Cards */}
                        {Object.entries(previewResult.data).map(([key, value]) => (
                            <div key={key} className={`preview-card data-card ${key.toLowerCase() === 'images' ? 'images-card' : ''}`}>
                                <div className="card-label">
                                    {key}
                                    <button
                                        className="copy-btn"
                                        onClick={() => copyToClipboard(Array.isArray(value) ? value.join('\n') : String(value))}
                                        title="Copy"
                                    >
                                        📋
                                    </button>
                                </div>
                                <div className="card-content">
                                    {renderContent(key, value)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>URL</th>
                                <th>Mode</th>
                                <th>Fields</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((result, index) => (
                                <tr
                                    key={index}
                                    className={`${result.success ? 'success' : 'error'} ${selectedResult === result ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSelectedResult(result);
                                        setActiveTab('preview');
                                    }}
                                >
                                    <td>
                                        <span className={`status-badge ${result.success ? 'success' : 'error'}`}>
                                            {result.success ? '✓' : '✗'}
                                        </span>
                                    </td>
                                    <td className="url-cell">
                                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                                            {result.url.length > 35 ? result.url.substring(0, 35) + '...' : result.url}
                                        </a>
                                    </td>
                                    <td>
                                        <span className="mode-badge">{result.mode}</span>
                                    </td>
                                    <td className="fields-cell">
                                        {Object.keys(result.data).length}
                                    </td>
                                    <td>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copyToClipboard(JSON.stringify(result, null, 2));
                                            }}
                                            className="action-btn"
                                            title="Copy JSON"
                                        >
                                            📋
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
