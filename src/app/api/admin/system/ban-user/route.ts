import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from '@/shared/auth/permissions';

export async function POST(req: Request) {
  const session = await ensureAppPermission('settings-accounts', 'manage');

  try {
    const { userId, reason, expiresAt } = await req.json();
    if (!userId) throw new Error('userId es requerido');
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes banear tu propia cuenta desde el panel' },
        { status: 400 },
      );
    }

    if (typeof reason === 'string' && reason.length > 1000) {
      return NextResponse.json(
        { error: 'La razón del baneo no puede exceder 1000 caracteres' },
        { status: 400 },
      );
    }

    let banExpiresAt: string | null = null;
    if (expiresAt) {
      const parsed = new Date(expiresAt);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: 'Fecha de expiración no válida' },
          { status: 400 },
        );
      }
      banExpiresAt = parsed.toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        is_banned: true,
        ban_reason:
          reason?.trim() || 'Acceso bloqueado por los administradores.',
        ban_expires_at: banExpiresAt,
        banned_at: new Date().toISOString(),
        banned_by: session.user.id,
      })
      .eq('user_id', userId)
      .select('user_id, ban_reason, ban_expires_at')
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      result: data,
    });
  } catch (error: any) {
    console.error('[ban-user] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
