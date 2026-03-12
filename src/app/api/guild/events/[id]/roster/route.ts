import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/auth/auth-options';
import { ensureAppPermission } from '@/shared/auth/permissions';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureAppPermission('calendar', 'edit');

    const eventId = (await params).id;
    const body = await req.json();
    const { selections } = body; // Array of { member_id, selection_status, event_role, signup_order }

    if (!Array.isArray(selections)) {
      return NextResponse.json(
        { error: 'Formato de selecciones inválido' },
        { status: 400 },
      );
    }

    // Batch update using upsert on event_id, member_id conflict
    const updates = selections.map((s) => ({
      event_id: eventId,
      member_id: s.member_id,
      selection_status: s.selection_status,
      event_role: s.event_role,
      signup_order: s.signup_order,
      selected_bosses: s.selected_bosses || [],
      status: s.is_absent ? 'absent' : s.is_late ? 'late' : 'present',
    }));

    const { error } = await supabaseAdmin
      .from('event_signups')
      .upsert(updates, { onConflict: 'event_id, member_id' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error batch updating roster:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
