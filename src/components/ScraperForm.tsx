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
        proxy?: string;
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
    const [fullExtract, setFullExtract] = useState(true);
    const [proxy, setProxy] = useState('');

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
            fullExtract,
            proxy: proxy || undefined
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
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Input */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <svg className="w-4 h-4 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Target URLs
                </label>
                <textarea
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Enter URLs (one per line)&#10;https://example.com&#10;https://another-site.com"
                    className="w-full premium-input rounded-none px-4 py-3 text-sm font-mono h-32 resize-none"
                    required
                />
            </div>

            {/* Proxy Input */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <svg className="w-4 h-4 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    Residential Proxy (Optional)
                </label>
                <input
                    type="text"
                    value={proxy}
                    onChange={(e) => setProxy(e.target.value)}
                    placeholder="http://user:pass@domain:port"
                    className="w-full premium-input rounded-none px-4 py-3 text-sm font-mono"
                />
            </div>

            {/* Full Extract Toggle */}
            <div
                className="group flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800 hover:border-neon-green/30 transition-all cursor-pointer"
                onClick={() => setFullExtract(!fullExtract)}
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 flex items-center justify-center transition-colors ${fullExtract ? 'bg-neon-green-t-10 text-neon-green' : 'bg-zinc-800 text-zinc-600'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6" />
                        </svg>
                    </div>
                    <div>
                        <p className={`text-sm font-semibold uppercase tracking-wide transition-colors ${fullExtract ? 'text-zinc-200' : 'text-zinc-500'}`}>Full Page Extraction</p>
                        <p className="text-xs text-zinc-500 font-mono mt-0.5">
                            {fullExtract ? 'AUTO-DETECT CONTENT' : 'MANUAL SELECTORS'}
                        </p>
                    </div>
                </div>
                <div className={`relative w-12 h-6 transition-colors ${fullExtract ? 'bg-neon-green' : 'bg-zinc-800'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-black transition-all ${fullExtract ? 'left-7' : 'left-1'}`} />
                </div>
            </div>

            {/* Custom Selectors */}
            {!fullExtract && (
                <div className="space-y-3 p-4 border-l-2 border-zinc-800 bg-zinc-900/20">
                    <label className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        CSS Selectors
                    </label>
                    <div className="space-y-2">
                        {selectors.map((selector, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={selector.key}
                                    onChange={(e) => updateSelector(index, 'key', e.target.value)}
                                    placeholder="Field name"
                                    className="flex-1 premium-input rounded-none px-3 py-2 text-xs"
                                />
                                <input
                                    type="text"
                                    value={selector.value}
                                    onChange={(e) => updateSelector(index, 'value', e.target.value)}
                                    placeholder="CSS selector"
                                    className="flex-1 premium-input rounded-none px-3 py-2 text-xs font-mono"
                                />
                                {selectors.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeSelector(index)}
                                        className="w-9 h-9 border border-zinc-800 text-zinc-500 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/50 transition-all flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addSelector}
                        className="text-xs text-zinc-500 hover:text-neon-green transition-colors flex items-center gap-1 uppercase tracking-wide font-medium mt-2"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Selector
                    </button>
                </div>
            )}

            {/* Options Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Mode</label>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as 'static' | 'dynamic' | 'auto')}
                        className="w-full premium-input rounded-none px-3 py-2.5 text-xs uppercase font-medium cursor-pointer appearance-none"
                    >
                        <option value="auto">🤖 Auto-Detect</option>
                        <option value="static">⚡ Static HTML</option>
                        <option value="dynamic">🌐 Dynamic JS</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Threads</label>
                    <input
                        type="number"
                        value={concurrency}
                        onChange={(e) => setConcurrency(parseInt(e.target.value) || 1)}
                        min={1}
                        max={10}
                        className="w-full premium-input rounded-none px-3 py-2.5 text-xs text-center font-mono"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Delay (ms)</label>
                    <input
                        type="number"
                        value={delay}
                        onChange={(e) => setDelay(parseInt(e.target.value) || 0)}
                        min={0}
                        max={10000}
                        step={100}
                        className="w-full premium-input rounded-none px-3 py-2.5 text-xs text-center font-mono"
                    />
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 premium-button flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                {isLoading ? (
                    <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="animate-pulse">INITIALIZING...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        EXECUTE EXTRACTION
                    </>
                )}
            </button>
        </form>
    );
}
