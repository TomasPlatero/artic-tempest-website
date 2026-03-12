import { NextResponse } from 'next/server';
import { createAdminClient } from '@/shared/supabase/server';
import { ensureAppPermission } from '@/shared/auth/permissions';

export async function POST(req: Request) {
  await ensureAppPermission('settings-news', 'edit');

  const { name, slug, description } = await req.json();
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('news_categories')
    .insert([{ name, slug, description }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  await ensureAppPermission('settings-news', 'edit');

  const { id, name, slug, description } = await req.json();
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('news_categories')
    .update({ name, slug, description })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  await ensureAppPermission('settings-news', 'edit');

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('news_categories')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
