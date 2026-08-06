import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAdmin } from '@/shared/auth/permissions';

export async function POST(req: Request) {
  try {
    await ensureAdmin();
    const { items } = await req.json();

    if (!items || !Array.isArray(items)) {
      throw new Error('Invalid items array');
    }

    const updates = items.map((item: any) =>
      supabaseAdmin
        .from('navigation_items')
        .update({
          order_index: item.order_index,
          parent_id: item.parent_id,
        })
        .eq('id', item.id),
    );

    const results = await Promise.all(updates);

    const firstError = results.find((r) => r.error)?.error;
    if (firstError) throw firstError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
