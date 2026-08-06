import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const applicationId = searchParams.get('applicationId');

  if (!applicationId) {
    return NextResponse.json({ error: 'Falta ID de solicitud' }, { status: 400 });
  }

  const { data: application, error } = await supabaseAdmin
    .from('recruitment_applications')
    .select('user_id, applicant_chat_hint_seen_at')
    .eq('id', applicationId)
    .single();

  if (error || !application) {
    return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
  }

  if (application.user_id !== session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  return NextResponse.json({
    seen: Boolean(application.applicant_chat_hint_seen_at),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const applicationId = body?.applicationId;

  if (!applicationId) {
    return NextResponse.json({ error: 'Falta ID de solicitud' }, { status: 400 });
  }

  const { data: application, error } = await supabaseAdmin
    .from('recruitment_applications')
    .select('user_id, applicant_chat_hint_seen_at')
    .eq('id', applicationId)
    .single();

  if (error || !application) {
    return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
  }

  if (application.user_id !== session.user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  if (!application.applicant_chat_hint_seen_at) {
    const { error: updateError } = await supabaseAdmin
      .from('recruitment_applications')
      .update({ applicant_chat_hint_seen_at: new Date().toISOString() })
      .eq('id', applicationId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
