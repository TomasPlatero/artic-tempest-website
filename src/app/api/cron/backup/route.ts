// src/app/api/cron/backup/route.ts
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Secret validation (Vercel Cron security)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 2. Trigger the backup script in the background
    // Since we don't pass a jobId, the script will create its own entry in backup_logs
    const scriptPath = path.join(process.cwd(), 'scripts', 'backup-full-dump.js');
    
    console.log('Cron: Triggering backup script autonomously...');
    
    const child = spawn('node', [scriptPath], {
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        // Ensure Supabase variables are available (Next.js handles this, but good to be explicit for spawn)
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    });

    child.unref();

    return NextResponse.json({
      success: true,
      message: 'Backup process started autonomously',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Cron Backup Trigger Error:', err);
    return NextResponse.json(
      { error: 'Failed to trigger backup', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
