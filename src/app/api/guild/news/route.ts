import { NextResponse } from 'next/server';
import { authOptions, supabaseAdmin } from '@/shared/auth/auth-options';
import { getServerSession } from 'next-auth';
import {
  getAppPermission,
  ensureAppPermission,
} from '@/shared/auth/permissions';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const permissions = session
      ? await getAppPermission(
          session.user.roleLevel ?? 'invitado',
          'settings-news',
        )
      : { canView: false, canEdit: false, canManage: false };
    const isStaff = permissions.canEdit;
    const { searchParams } = new URL(req.url);
    const includeDrafts = searchParams.get('includeDrafts') === 'true';

    let query = supabaseAdmin
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    // If not staff, only show published news
    if (!isStaff || !includeDrafts) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;

    if (error) {
      console.error('[NEWS_GET_ERROR]', error);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 500 },
      );
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[NEWS_GET_CRITICAL]', error);
    return NextResponse.json(
      { error: error.message || 'Internal Error' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await ensureAppPermission('settings-news', 'edit');

    const body = await req.json();
    const {
      title,
      slug,
      summary,
      content,
      category,
      author,
      is_featured,
      image_url,
      status,
    } = body;

    // If this news is featured, un-feature others
    if (is_featured) {
      const { error: updateError } = await supabaseAdmin
        .from('news')
        .update({ is_featured: false })
        .eq('is_featured', true);

      if (updateError) {
        console.warn('[NEWS_POST_UNFEATURE_WARNING]', updateError);
        // We continue because it's not a dealbreaker for creating the new item
      }
    }

    const { data, error } = await supabaseAdmin
      .from('news')
      .insert({
        title,
        slug,
        summary,
        content,
        category,
        author: author || session.user.username || 'Artic Tempest',
        is_featured: !!is_featured,
        image_url,
        status: status || 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    // Si la noticia se publica directamente, crear notificación de sistema
    if (status === 'published') {
      try {
        await supabaseAdmin.from('system_notifications').insert({
          title: `📰 Nueva Noticia: ${title}`,
          content: summary || 'Se ha publicado una nueva actualización en la web.',
          type: 'info',
          created_by: session.user.id,
        });
      } catch (notifyError) {
        console.error('[NEWS_POST_NOTIFICATION_ERROR]', notifyError);
        // No bloqueamos la respuesta principal si falla la notificación
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[NEWS_POST]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await ensureAppPermission('settings-news', 'edit');

    const body = await req.json();
    const { id, ...updates } = body;

    if (updates.is_featured) {
      await supabaseAdmin
        .from('news')
        .update({ is_featured: false })
        .eq('is_featured', true)
        .neq('id', id);
    }

    const { data, error } = await supabaseAdmin
      .from('news')
      .update({
        title: updates.title,
        slug: updates.slug,
        summary: updates.summary,
        content: updates.content,
        category: updates.category,
        author: updates.author,
        is_featured: updates.is_featured,
        image_url: updates.image_url,
        status: updates.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Si el estado ha cambiado a 'published', crear notificación de sistema
    if (updates.status === 'published') {
      try {
        await supabaseAdmin.from('system_notifications').insert({
          title: `📰 Actualización: ${updates.title || data.title}`,
          content: updates.summary || data.summary || 'Hay novedades en el sitio oficial.',
          type: 'info',
          created_by: (session as any).user.id,
        });
      } catch (notifyError) {
        console.error('[NEWS_PATCH_NOTIFICATION_ERROR]', notifyError);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[NEWS_PATCH]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureAppPermission('settings-news', 'edit');

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return new NextResponse('ID Required', { status: 400 });

    const { error } = await supabaseAdmin.from('news').delete().eq('id', id);

    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[NEWS_DELETE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
