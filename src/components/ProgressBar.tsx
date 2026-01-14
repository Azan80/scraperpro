'use client';

interface ProgressBarProps {
    current: number;
    total: number;
    status: string;
}

export default function ProgressBar({ current, total, status }: ProgressBarProps) {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    const statusColors: Record<string, string> = {
        pending: 'text-zinc-500',
        running: 'text-neon-green',
        completed: 'text-neon-green',
        failed: 'text-red-500'
    };

    const statusBgColors: Record<string, string> = {
        pending: 'bg-zinc-700',
        running: 'bg-neon-green',
        completed: 'bg-neon-green',
        failed: 'bg-red-500'
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-2 uppercase tracking-widest font-bold ${statusColors[status] || 'text-zinc-500'}`}>
                        <span className={`w-1.5 h-1.5 ${statusBgColors[status] || 'bg-zinc-600'} ${status === 'running' ? 'animate-pulse' : ''}`} />
                        {status}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-zinc-300 font-bold">{current}</span>
                    <span className="text-zinc-600">/</span>
                    <span className="text-zinc-500">{total} URLs</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-1 bg-zinc-800 w-full overflow-hidden">
                <div
                    className={`absolute left-0 top-0 h-full transition-all duration-300 ease-out ${statusBgColors[status] || 'bg-zinc-600'}`}
                    style={{ width: `${percentage}%` }}
                >
                    {/* Glow effect for running state */}
                    {status === 'running' && (
                        <div className="absolute inset-0 shadow-[0_0_10px_rgba(57,255,20,0.5)]" />
                    )}
                </div>
            </div>

            {/* Percentage */}
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
                <span className="text-zinc-600">Completion</span>
                <span className="text-neon-green font-mono font-bold">{percentage}%</span>
            </div>
        </div>
    );
}
