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
    // Aggressively hide the path from Turbopack static analysis
    const getScriptPath = () => {
      const b = Buffer.from('YmFja3VwLWZ1bGwtZHVtcC5qcw==', 'base64').toString();
      return path.join(process.cwd(), 'scripts', b);
    };
    const scriptPath = getScriptPath();
    
    console.log('Cron: Triggering backup script autonomously...');
    
    // Use eval to completely hide the spawn call and its arguments from Turbopack static analysis
    eval(`
      const { spawn } = require('child_process');
      const child = spawn('node', ['${scriptPath.replace(/\\/g, '\\\\')}'], {
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: '${process.env.NEXT_PUBLIC_SUPABASE_URL}',
          SUPABASE_SERVICE_ROLE_KEY: '${process.env.SUPABASE_SERVICE_ROLE_KEY}',
        }
      });
      child.unref();
    `);

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
