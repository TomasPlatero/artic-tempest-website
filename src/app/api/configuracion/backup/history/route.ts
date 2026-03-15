import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shared/auth/auth-options';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const allowDev = process.env.NODE_ENV !== 'production';
  const session = await getServerSession(authOptions);
  const isAuthorized = session?.user?.roleLevel && session.user.roleLevel !== 'member';
  
  if (!isAuthorized && !allowDev) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('backup_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }

  return NextResponse.json(data);
}
