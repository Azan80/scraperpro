import { NextRequest, NextResponse } from 'next/server';
import { getJob, getAllJobs, deleteJob, clearCompletedJobs } from '@/lib/queue';
import { exportToJson, exportToCsv } from '@/lib/export';

// GET - Get job status or all jobs
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const format = searchParams.get('format'); // json or csv

    // Get specific job
    if (jobId) {
        const job = getJob(jobId);

        if (!job) {
            return NextResponse.json(
                { success: false, error: 'Job not found' },
                { status: 404 }
            );
        }

        // Export results
        if (format && job.status === 'completed') {
            if (format === 'csv') {
                const csv = exportToCsv(job.results);
                return new NextResponse(csv, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="scrape-${jobId}.csv"`
                    }
                });
            } else {
                const json = exportToJson(job.results);
                return new NextResponse(json, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Disposition': `attachment; filename="scrape-${jobId}.json"`
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            job
        });
    }

    // Get all jobs
    const jobs = getAllJobs();
    return NextResponse.json({
        success: true,
        jobs
    });
}

// DELETE - Delete a job or clear completed jobs
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const clearCompleted = searchParams.get('clearCompleted');

    if (clearCompleted === 'true') {
        const cleared = clearCompletedJobs();
        return NextResponse.json({
            success: true,
            message: `Cleared ${cleared} completed jobs`
        });
    }

    if (jobId) {
        const deleted = deleteJob(jobId);
        if (deleted) {
            return NextResponse.json({
                success: true,
                message: 'Job deleted'
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Job not found' },
                { status: 404 }
            );
        }
    }

    return NextResponse.json(
        { success: false, error: 'Missing jobId or clearCompleted parameter' },
        { status: 400 }
    );
}
