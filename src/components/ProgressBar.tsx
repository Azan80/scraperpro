'use client';

interface ProgressBarProps {
    current: number;
    total: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
}

export default function ProgressBar({ current, total, status }: ProgressBarProps) {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    const statusConfig = {
        pending: { color: '#64748b', icon: '⏳', text: 'Pending' },
        running: { color: '#3b82f6', icon: '⚡', text: 'Scraping' },
        completed: { color: '#10b981', icon: '✅', text: 'Completed' },
        failed: { color: '#ef4444', icon: '❌', text: 'Failed' }
    };

    const config = statusConfig[status];

    return (
        <div className="progress-container">
            <div className="progress-header">
                <span className="progress-status">
                    {config.icon} {config.text}
                </span>
                <span className="progress-count">
                    {current} / {total} URLs
                </span>
            </div>
            <div className="progress-bar-track">
                <div
                    className="progress-bar-fill"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: config.color
                    }}
                />
            </div>
            <div className="progress-percentage">{percentage}%</div>
        </div>
    );
}
