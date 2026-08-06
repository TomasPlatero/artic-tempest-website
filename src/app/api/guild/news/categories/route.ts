import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/shared/supabase/server';
import { ensureAppPermission } from '@/shared/auth/permissions';
import { apiErrorResponse, parseJsonBody } from '@/shared/api/errors';

const newsCategoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().nullable(),
});

const newsCategoryUpdateSchema = newsCategoryCreateSchema.extend({
  id: z.union([z.string().trim().min(1), z.number()]),
});

export async function POST(req: Request) {
  try {
    const [_, payload, supabase] = await Promise.all([
      ensureAppPermission('settings-news', 'edit'),
      parseJsonBody(req, newsCategoryCreateSchema),
      createAdminClient(),
    ]);

    const { data, error } = await supabase
      .from('news_categories')
      .insert([{ name: payload.name, slug: payload.slug, description: payload.description ?? null }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'No se pudo crear la categoría' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const [_, payload, supabase] = await Promise.all([
      ensureAppPermission('settings-news', 'edit'),
      parseJsonBody(req, newsCategoryUpdateSchema),
      createAdminClient(),
    ]);

    const { data, error } = await supabase
      .from('news_categories')
      .update({ name: payload.name, slug: payload.slug, description: payload.description ?? null })
      .eq('id', payload.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'No se pudo actualizar la categoría' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureAppPermission('settings-news', 'edit');

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    const { error } = await supabase
      .from('news_categories')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'No se pudo eliminar la categoría' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
