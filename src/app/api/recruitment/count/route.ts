import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/auth/auth-options';
import { ensureAppPermission } from '@/shared/auth/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureAppPermission('settings-recruitment', 'view');

    const { count, error } = await supabaseAdmin
      .from('recruitment_applications')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'reviewing', 'interview']);

    if (error) throw error;

    return NextResponse.json({ count: count || 0 });
  } catch (error: any) {
    console.error('Fetch recruitment count error:', error);
    return NextResponse.json(
      { count: 0, error: error.message },
      { status: 403 },
    );
  }
}
