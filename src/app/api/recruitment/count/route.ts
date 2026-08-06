import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from '@/shared/auth/permissions';
import { attachInterviewReplySignals } from '@/shared/lib/recruitment/application-chat-signals';
import { ACTIVE_RECRUITMENT_STATUSES } from '@/domains/recruitment/lib/application-status';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureAppPermission('settings-recruitment', 'view');

    const { count: recruitmentCount, error: countError } = await supabaseAdmin
      .from('recruitment_applications')
      .select('id', { count: 'exact', head: true })
      .in('status', [...ACTIVE_RECRUITMENT_STATUSES]);

    if (countError) throw countError;

    const { data: applications, error: applicationsError } = await supabaseAdmin
      .from('recruitment_applications')
      .select('id, user_id, status')
      .eq('status', 'interview');

    if (applicationsError) throw applicationsError;

    const applicationIds = (applications || []).map((application) => application.id);
    const { data: messages, error: messagesError } = applicationIds.length
      ? await supabaseAdmin
          .from('application_messages')
          .select('application_id, author_id, created_at')
          .in('application_id', applicationIds)
          .order('created_at', { ascending: false })
      : { data: [], error: null };

    if (messagesError) throw messagesError;

    const applicationsWithSignals = attachInterviewReplySignals(
      applications || [],
      messages || [],
    );

    const applicantMessageCount = applicationsWithSignals.filter(
      (application) => application.hasNewApplicantMessage,
    ).length;

    return NextResponse.json({
      count: recruitmentCount || 0,
      applicantMessageCount,
    });
  } catch (error: any) {
    const message = error?.message || 'Unknown error';

    // Usuarios sin sesión o sin permisos no necesitan ver el detalle;
    // devolvemos 0 silenciosamente para evitar ruido innecesario.
    if (message.startsWith('Unauthorized')) {
      return NextResponse.json({ count: 0, applicantMessageCount: 0 });
    }

    console.error('Fetch recruitment count error:', error);
    return NextResponse.json({ count: 0, applicantMessageCount: 0, error: message }, { status: 500 });
  }
}
