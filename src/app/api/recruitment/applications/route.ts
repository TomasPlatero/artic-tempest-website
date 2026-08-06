import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { getAuthzSnapshot } from '@/shared/auth/authz';
import { getAppPermission, ensureAppPermission } from '@/shared/auth/permissions';
import { resolveRecruitmentPatchAccess } from '@/shared/lib/recruitment/application-access';
import {
  publishRecruitmentBotEvent,
} from '@/shared/lib/recruitment/bot-events';
import { resolveDiscordUserIdForApplication } from '@/shared/lib/recruitment/active-application';
import { getGuildCredentials } from '@/shared/auth/credentials';

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, internal_notes, character_spec, answers } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Falta ID de la solicitud' },
        { status: 400 },
      );
    }

    const { data: application, error: applicationError } = await supabaseAdmin
      .from('recruitment_applications')
      .select('id, user_id, discord_message_id, status, character_name, character_realm')
      .eq('id', id)
      .single();

    if (applicationError || !application) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada' },
        { status: 404 },
      );
    }

    const authz = await getAuthzSnapshot(session);
    const roleLevel = authz.roleSlug ?? session.user.roleLevel ?? '';
    const recruitmentPermission = await getAppPermission(roleLevel, 'recruitment');
    const canEditRecruitment =
      authz.scope === 'internal_admin' || recruitmentPermission.canEdit;
    const isOwner = application.user_id === session.user.id;
    const wantsStaffFields =
      status !== undefined ||
      internal_notes !== undefined ||
      character_spec !== undefined;

    const access = resolveRecruitmentPatchAccess({
      isAuthenticated: true,
      isOwner,
      canEditRecruitment,
      wantsStaffFields,
    });

    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    const previousStatus = application.status;
    if (status) updateData.status = status;
    if (internal_notes !== undefined)
      updateData.internal_notes = internal_notes;
    if (character_spec !== undefined) updateData.character_spec = character_spec;

    if (answers && typeof answers === 'object') {
      const answerEntries = Object.entries(answers);

      if (answerEntries.length > 0) {
        const { data: existingAnswers, error: answersError } = await supabaseAdmin
          .from('application_answers')
          .select('id')
          .eq('application_id', id);

        if (answersError) throw answersError;

        const allowedAnswerIds = new Set(
          (existingAnswers || []).map((answer) => String(answer.id)),
        );
        const invalidAnswerId = answerEntries.find(
          ([answerId]) => !allowedAnswerIds.has(String(answerId)),
        )?.[0];

        if (invalidAnswerId) {
          return NextResponse.json(
            { error: 'Una o más respuestas no pertenecen a esta solicitud' },
            { status: 403 },
          );
        }

        await Promise.all(
          answerEntries.map(([answerId, answerText]) =>
            supabaseAdmin
              .from('application_answers')
              .update({ answer_text: String(answerText) })
              .eq('id', answerId)
              .eq('application_id', id),
          ),
        );
      }
    }

    const answersChanged =
      answers !== undefined &&
      typeof answers === 'object' &&
      !Array.isArray(answers) &&
      Object.keys(answers).length > 0;

    const { data, error } = await supabaseAdmin
      .from('recruitment_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const statusChanged = status !== undefined && status !== previousStatus;

    if (
      (statusChanged ||
        character_spec !== undefined ||
        answersChanged) &&
      data?.discord_message_id
    ) {
      const syncRes = await fetch(
        new URL('/api/discord/update-apply', req.url).toString(),
        {
          method: 'POST',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            Cookie: req.headers.get('cookie') ?? '',
          },
          body: JSON.stringify({ application_id: id }),
        },
      );

      if (!syncRes.ok) {
        const syncError = await syncRes.text().catch(() => '');
        console.warn('Discord embed sync failed after application update:', syncError);
      }
    }

    if (statusChanged && data) {
      const applicantDiscordUserId =
        await resolveDiscordUserIdForApplication(id);

      if (applicantDiscordUserId) {
        void publishRecruitmentBotEvent({
          type: 'recruitment.application.status_changed',
          applicationId: id,
          applicantDiscordUserId,
          previousStatus,
          status: data.status,
          characterName: data.character_name ?? application.character_name ?? '',
          characterRealm: data.character_realm ?? application.character_realm ?? '',
        });
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Recruitment API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  await ensureAppPermission('recruitment', 'edit');

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Falta ID de la solicitud' },
        { status: 400 },
      );
    }

    // Obtener el discord_message_id antes de borrar nada
    const { data: application } = await supabaseAdmin
      .from('recruitment_applications')
      .select('discord_message_id')
      .eq('id', id)
      .single();

    // Intentar borrar el mensaje de Discord si existe
    if (application?.discord_message_id) {
      try {
        const creds = await getGuildCredentials();
        const channelId = creds.discord_recruitment_channel_id;
        const botToken = creds.discord_bot_token;

        if (channelId && botToken) {
          const deleteRes = await fetch(
            `https://discord.com/api/v10/channels/${channelId}/messages/${application.discord_message_id}`,
            {
              method: 'DELETE',
              headers: { Authorization: `Bot ${botToken}` },
            },
          );

          if (!deleteRes.ok) {
            console.warn(
              `[DELETE] No se pudo borrar el mensaje de Discord ${application.discord_message_id}: ${deleteRes.status}`,
            );
          }
        }
      } catch (discordError) {
        console.warn(
          '[DELETE] Error al intentar borrar el mensaje de Discord:',
          discordError,
        );
      }
    }

    // Eliminar registros relacionados antes de la aplicación
    await Promise.all([
      supabaseAdmin
        .from('application_messages')
        .delete()
        .eq('application_id', id),
      supabaseAdmin
        .from('application_answers')
        .delete()
        .eq('application_id', id),
      supabaseAdmin
        .from('recruitment_application_events')
        .delete()
        .eq('application_id', id),
    ]);

    const { error } = await supabaseAdmin
      .from('recruitment_applications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Recruitment API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
