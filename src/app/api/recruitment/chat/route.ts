import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { getAuthzSnapshot } from '@/shared/auth/authz';
import {
  publishRecruitmentBotEvent,
} from '@/shared/lib/recruitment/bot-events';
import { resolveDiscordUserIdForApplication } from '@/shared/lib/recruitment/active-application';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const applicationId = searchParams.get('applicationId');

  if (!applicationId) {
    return NextResponse.json(
      { error: 'Falta id de solicitud' },
      { status: 400 },
    );
  }

  try {
    const { data: application, error: appError } = await supabaseAdmin
      .from('recruitment_applications')
      .select('user_id')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 },
      );
    }

    const authz = await getAuthzSnapshot(session);
    const roleLevel = (authz.roleSlug ?? session.user?.roleLevel ?? '').toLowerCase?.() ?? '';
    const isOfficial = ['gm', 'officer'].includes(roleLevel);
    const isApplicant = session.user.id === application.user_id;

    if (!isOfficial && !isApplicant) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const PAGE_SIZE = 50;
    const cursor = new URL(req.url).searchParams.get('cursor');

    let query = supabaseAdmin
      .from('application_messages')
      .select(
        '*, author:profiles(discord_username, discord_avatar, role_level)',
      )
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: messages, error: msgError } = await query;

    if (msgError) throw msgError;

    // Devolver en orden cronológico ascendente (los más antiguos primero)
    return NextResponse.json((messages || []).reverse());
  } catch (error: any) {
    console.error('GET Chat Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { applicationId, content, attachments } = await req.json();
  if (!applicationId || !content) {
    return NextResponse.json(
      { error: 'Faltan datos requeridos' },
      { status: 400 },
    );
  }

  const MAX_MESSAGE_LENGTH = 2000;
  if (typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json(
      { error: 'El mensaje no puede estar vacío' },
      { status: 400 },
    );
  }
  const normalizedContent = content.trim();

  if (normalizedContent.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `El mensaje excede ${MAX_MESSAGE_LENGTH} caracteres` },
      { status: 400 },
    );
  }

  try {
    // 1. Get application details
    const { data: application, error: appError } = await supabaseAdmin
      .from('recruitment_applications')
      .select('user_id')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 },
      );
    }

    // 2. Check permissions
    const authz = await getAuthzSnapshot(session);
    const senderRoleLevel = (authz.roleSlug ?? session.user?.roleLevel ?? '').toLowerCase?.() ?? '';
    const isOfficial = ['gm', 'officer'].includes(senderRoleLevel);
    const isApplicant = session.user.id === application.user_id;

    if (!isOfficial && !isApplicant) {
      return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    // 3. Save to database
    const insertPayload: any = {
      application_id: applicationId,
      author_id: session.user.id,
      content: normalizedContent,
      source: 'web',
    };

    if (Array.isArray(attachments) && attachments.length > 0) {
      insertPayload.attachments = attachments;
    }

    const { data: savedMsg, error: saveError } = await supabaseAdmin
      .from('application_messages')
      .insert(insertPayload)
      .select('*, author:profiles(discord_username, discord_avatar, role_level)')
      .single();

    if (saveError) throw saveError;

    if (isOfficial) {
      const applicantDiscordUserId =
        await resolveDiscordUserIdForApplication(applicationId);

      if (applicantDiscordUserId) {
        void publishRecruitmentBotEvent({
          type: 'recruitment.chat.message',
          applicationId,
          messageId: savedMsg.id,
          authorId: session.user.id,
          content: normalizedContent,
          attachments: Array.isArray(attachments) ? attachments : undefined,
          applicantDiscordUserId,
          officerName: session.user.username ?? savedMsg.author?.discord_username ?? 'Staff',
          officerRoleLabel: session.user.roleLabel ?? '',
          createdAt: savedMsg.created_at,
        });
      }
    }

    return NextResponse.json({ success: true, message: savedMsg });
  } catch (err: any) {
    console.error('POST Chat Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
