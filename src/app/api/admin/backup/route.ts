import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shared/auth/auth-options';
import path from 'path';
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runBackupScript(jobId: string) {
  const script = path.resolve(process.cwd(), 'scripts', 'backup-full-dump.js');
  
  const child = spawn(process.execPath, [script, jobId], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env }
  });
  
  child.unref();
}

export async function POST(request: Request) {
  const allowDev = process.env.NODE_ENV !== 'production';
  
  // Authorization check
  const session = await getServerSession(authOptions);
  const isAuthorized = session?.user?.roleLevel && session.user.roleLevel !== 'member';
  
  if (!isAuthorized && !allowDev) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Create entry in DB
  const { data, error } = await supabase
    .from('backup_logs')
    .insert([{ status: 'running', progress: 0 }])
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to create backup job' }, { status: 500 });
  }

  const jobId = data.id;
  await runBackupScript(jobId);

  return NextResponse.json({ jobId, status: 'started' });
}

// GET handler is now partially redundant but we'll keep it for legacy if needed or redirect to status
export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId');
  if (jobId) {
    return NextResponse.redirect(new URL(`/api/admin/backup/status?jobId=${jobId}`, request.url));
  }
  return NextResponse.json({ error: 'jobId required' }, { status: 400 });
}
