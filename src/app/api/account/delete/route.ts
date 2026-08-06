import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deleteUserAndRelatedData } from '@/shared/lib/delete-user';

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const profileId = session.user.id;

    await deleteUserAndRelatedData(profileId);

    return NextResponse.json({
      success: true,
      message:
        'Tu cuenta y todos tus datos asociados han sido eliminados permanentemente.',
    });
  } catch (e: any) {
    console.error('[ACCOUNT DELETE ERROR]', e);
    return NextResponse.json(
      { error: e.message || 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
