import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, sb } from '@/infrastructure/auth/auth-options';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const roleLvl = session.user.roleLevel;
    if (roleLvl !== 'gm' && roleLvl !== 'officer') {
      return NextResponse.json(
        { error: 'Permisos insuficientes' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { rank } = body;

    if (rank === undefined || rank === null) {
      return NextResponse.json(
        { error: 'Falta indicar el rango' },
        { status: 400 },
      );
    }

    const { error } = await sb
      .from('guild_members')
      .update({ rank: parseInt(rank.toString()) })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[RANK UPDATE ERROR]', e);
    return NextResponse.json(
      { error: e.message || 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
