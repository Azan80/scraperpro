'use client';

import { useState } from 'react';

interface ScraperFormProps {
    onSubmit: (data: {
        urls: string[];
        selectors: Record<string, string>;
        mode: 'static' | 'dynamic' | 'auto';
        concurrency: number;
        delay: number;
        fullExtract: boolean;
    }) => void;
    isLoading: boolean;
}

export default function ScraperForm({ onSubmit, isLoading }: ScraperFormProps) {
    const [urlInput, setUrlInput] = useState('');
    const [selectors, setSelectors] = useState([
        { key: 'title', value: 'h1' },
        { key: 'description', value: 'p' }
    ]);
    const [mode, setMode] = useState<'static' | 'dynamic' | 'auto'>('auto');
    const [concurrency, setConcurrency] = useState(3);
    const [delay, setDelay] = useState(1000);
    const [fullExtract, setFullExtract] = useState(true); // Default to full extraction

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const urls = urlInput
            .split('\n')
            .map(url => url.trim())
            .filter(url => url.length > 0);

        const selectorMap: Record<string, string> = {};
        selectors.forEach(({ key, value }) => {
            if (key && value) {
                selectorMap[key] = value;
            }
        });

        onSubmit({
            urls,
            selectors: selectorMap,
            mode,
            concurrency,
            delay,
            fullExtract
        });
    };

    const addSelector = () => {
        setSelectors([...selectors, { key: '', value: '' }]);
    };

    const removeSelector = (index: number) => {
        setSelectors(selectors.filter((_, i) => i !== index));
    };

    const updateSelector = (index: number, field: 'key' | 'value', value: string) => {
        const newSelectors = [...selectors];
        newSelectors[index][field] = value;
        setSelectors(newSelectors);
    };

    return (
        <form onSubmit={handleSubmit} className="scraper-form">
            <div className="form-section">
                <label className="form-label">
                    <span className="label-icon">🔗</span>
                    URLs to Scrape
                </label>
                <textarea
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Enter URLs (one per line)&#10;https://example.com&#10;https://another-site.com"
                    className="url-input"
                    rows={5}
                    required
                />
            </div>

            {/* Full Extract Toggle */}
            <div className="form-section">
                <label className="toggle-label">
                    <div className="toggle-wrapper">
                        <input
                            type="checkbox"
                            checked={fullExtract}
                            onChange={(e) => setFullExtract(e.target.checked)}
                            className="toggle-input"
                        />
                        <span className="toggle-slider"></span>
                    </div>
                    <span className="toggle-text">
                        <span className="label-icon">📦</span>
                        Full Page Extraction
                        <span className="toggle-hint">
                            {fullExtract ? '(Extracts all content: titles, paragraphs, links, images, etc.)' : '(Uses custom selectors below)'}
                        </span>
                    </span>
                </label>
            </div>

            {/* Custom Selectors - only show when fullExtract is off */}
            {!fullExtract && (
                <div className="form-section">
                    <label className="form-label">
                        <span className="label-icon">🎯</span>
                        CSS Selectors
                    </label>
                    <div className="selectors-container">
                        {selectors.map((selector, index) => (
                            <div key={index} className="selector-row">
                                <input
                                    type="text"
                                    value={selector.key}
                                    onChange={(e) => updateSelector(index, 'key', e.target.value)}
                                    placeholder="Field name"
                                    className="selector-input"
                                />
                                <input
                                    type="text"
                                    value={selector.value}
                                    onChange={(e) => updateSelector(index, 'value', e.target.value)}
                                    placeholder="CSS selector"
                                    className="selector-input"
                                />
                                {selectors.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeSelector(index)}
                                        className="remove-btn"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={addSelector} className="add-selector-btn">
                            + Add Selector
                        </button>
                    </div>
                </div>
            )}

            <div className="form-row">
                <div className="form-section">
                    <label className="form-label">
                        <span className="label-icon">⚡</span>
                        Scraping Mode
                    </label>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as 'static' | 'dynamic' | 'auto')}
                        className="mode-select"
                    >
                        <option value="auto">🤖 Auto Detect</option>
                        <option value="static">📄 Static (Fast)</option>
                        <option value="dynamic">🌐 Dynamic (JS)</option>
                    </select>
                </div>

                <div className="form-section">
                    <label className="form-label">
                        <span className="label-icon">🔄</span>
                        Concurrency
                    </label>
                    <input
                        type="number"
                        value={concurrency}
                        onChange={(e) => setConcurrency(parseInt(e.target.value) || 1)}
                        min={1}
                        max={10}
                        className="number-input"
                    />
                </div>

                <div className="form-section">
                    <label className="form-label">
                        <span className="label-icon">⏱️</span>
                        Delay (ms)
                    </label>
                    <input
                        type="number"
                        value={delay}
                        onChange={(e) => setDelay(parseInt(e.target.value) || 0)}
                        min={0}
                        max={10000}
                        step={100}
                        className="number-input"
                    />
                </div>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <span className="spinner"></span>
                        Scraping...
                    </>
                ) : (
                    <>
                        <span className="btn-icon">🚀</span>
                        Start Scraping
                    </>
                )}
            </button>
        </form>
    );
}
