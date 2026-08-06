import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
const MAIN_CHARACTER_COOKIE = 'artic-tempest-main-character-id';

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      characterId?: string;
    } | null;

    const characterId = body?.characterId?.trim();

    if (!characterId) {
      return NextResponse.json(
        { error: 'Debes indicar un personaje válido' },
        { status: 400 },
      );
    }

    const { data: character, error: characterError } = await supabaseAdmin
      .from('bnet_characters')
      .select('id')
      .eq('id', characterId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (characterError) {
      return NextResponse.json(
        { error: characterError.message || 'No se pudo validar el personaje' },
        { status: 500 },
      );
    }

    if (!character) {
      return NextResponse.json(
        { error: 'El personaje no pertenece a tu cuenta' },
        { status: 404 },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ main_character_id: characterId })
      .eq('user_id', session.user.id);

    if (updateError) {
      return NextResponse.json(
        {
          error:
            updateError.message || 'No se pudo guardar el personaje principal',
        },
        { status: 500 },
      );
    }

    const response = NextResponse.json({
      success: true,
      mainCharacterId: characterId,
    });
    response.cookies.set(MAIN_CHARACTER_COOKIE, characterId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });

    revalidatePath('/zona-raider');
    revalidatePath('/zona-raider/cuenta');
    revalidatePath('/mis-personajes');

    return response;
  } catch (error: any) {
    console.error('[ACCOUNT MAIN CHARACTER ERROR]', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
