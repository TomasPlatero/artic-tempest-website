import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/auth/auth-options';
import { ensureAppPermission } from '@/shared/auth/permissions';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await ensureAppPermission('settings-discord', 'edit');

  try {
    const { data: embed, error } = await supabaseAdmin
      .from('discord_embeds')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return NextResponse.json(embed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await ensureAppPermission('settings-discord', 'edit');

  try {
    const payload = await req.json();
    const { id, created_at, updated_at, ...cleanPayload } = payload;

    const { data: embed, error } = await supabaseAdmin
      .from('discord_embeds')
      .update({ ...cleanPayload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(embed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await ensureAppPermission('settings-discord', 'edit');

  try {
    const { error } = await supabaseAdmin
      .from('discord_embeds')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
