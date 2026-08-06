import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { isResolvedRecruitmentStatus } from '@/domains/recruitment/lib/application-status';

export async function POST(req: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const applicationId = typeof body?.application_id === 'string' ? body.application_id : null;

    if (!applicationId) {
      return NextResponse.json({ error: 'Falta ID de la solicitud' }, { status: 400 });
    }

    const { data: application, error: appError } = await supabaseAdmin
      .from('recruitment_applications')
      .select('id, user_id, status, discord_message_id')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    if (application.user_id !== session.user.id) {
      return NextResponse.json({ error: 'No puedes cancelar esta solicitud' }, { status: 403 });
    }

    if (isResolvedRecruitmentStatus(application.status)) {
      return NextResponse.json(
        { error: 'La solicitud ya se encuentra en un estado final' },
        { status: 400 },
      );
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('recruitment_applications')
      .update({ status: 'cancelado', updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .eq('user_id', session.user.id)
      .select('*')
      .single();

    if (updateError) throw updateError;

    if (updated?.discord_message_id) {
      const syncRes = await fetch(new URL('/api/discord/notify-apply', req.url), {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          cookie: req.headers.get('cookie') || '',
        },
        body: JSON.stringify({ application_id: applicationId, force: true }),
      });

      if (!syncRes.ok) {
        const syncError = await syncRes.text().catch(() => '');
        console.warn('Discord embed sync failed after applicant cancel:', syncError);
      }
    }

    return NextResponse.json({ success: true, application: updated });
  } catch (error: any) {
    console.error('Recruitment applicant cancel error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
