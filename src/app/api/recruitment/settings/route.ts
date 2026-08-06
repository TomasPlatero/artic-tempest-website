import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from '@/shared/auth/permissions';

export async function POST(req: Request) {
  const _session = await ensureAppPermission('settings-recruitment', 'edit');

  try {
    const body = await req.json();
    const { type, data } = body;

    if (type === 'spot') {
      const { class_id, spec_name, urgency } = data;

      // Obtener el guild_id real desde settings
      const { data: guild } = await supabaseAdmin
        .from('settings')
        .select('guild_id')
        .eq('id', 1)
        .maybeSingle();

      const guildId = guild?.guild_id;

      if (!guildId) {
        return NextResponse.json(
          { error: 'No se encontró guild_id en settings' },
          { status: 500 },
        );
      }

      const { data: result, error } = await supabaseAdmin
        .from('recruitment_spots')
        .upsert(
          {
            class_id,
            spec_name,
            urgency,
            guild_id: guildId,
          },
          { onConflict: 'class_id, spec_name' },
        ) // Error: recruitment_spots might not have this unique constraint yet
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(result);
    }

    if (type === 'question_save') {
      const isTemp = data.id?.startsWith('temp-');
      const payload = { ...data };
      if (isTemp) delete payload.id;

      const { data: result, error } = isTemp
        ? await supabaseAdmin
            .from('recruitment_questions')
            .insert(payload)
            .select()
            .single()
        : await supabaseAdmin
            .from('recruitment_questions')
            .update(payload)
            .eq('id', data.id)
            .select()
            .single();

      if (error) throw error;
      return NextResponse.json(result);
    }

    if (type === 'question_delete') {
      const { error } = await supabaseAdmin
        .from('recruitment_questions')
        .delete()
        .eq('id', data.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Recruitment API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
