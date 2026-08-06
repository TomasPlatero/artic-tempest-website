import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from '@/shared/auth/permissions';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;

function getExtension(fileName: string, mimeType: string): string {
  const mimeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
  };

  const mappedExtension = mimeMap[mimeType];
  if (mappedExtension) return mappedExtension;

  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext && ext.length >= 2 && ext.length <= 5) return ext;

  return mimeMap[mimeType] || 'jpg';
}

export async function POST(req: Request) {
  try {
    await ensureAppPermission('settings-news', 'edit');

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Cuerpo JSON inválido o faltante' },
        { status: 400 },
      );
    }

    // Reject null, arrays, and primitive values — only plain objects allowed
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json(
        { error: 'Cuerpo JSON inválido o faltante' },
        { status: 400 },
      );
    }

    const { fileName, mimeType, fileSize } = rawBody as Record<string, unknown>;

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json(
        { error: 'Falta el nombre del archivo (fileName)' },
        { status: 400 },
      );
    }

    if (!mimeType || typeof mimeType !== 'string') {
      return NextResponse.json(
        { error: 'Falta el tipo de archivo (mimeType)' },
        { status: 400 },
      );
    }

    // fileSize must be a finite positive integer (catches NaN, Infinity, null, floats, zero, negatives)
    if (
      typeof fileSize !== 'number' ||
      !Number.isFinite(fileSize) ||
      !Number.isInteger(fileSize) ||
      fileSize <= 0
    ) {
      return NextResponse.json(
        { error: 'El archivo está vacío o tiene un tamaño inválido' },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido: ${mimeType}. Usá JPEG, PNG, WebP, GIF o AVIF.` },
        { status: 400 },
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `El archivo excede el límite de 50 MB (${(fileSize / 1024 / 1024).toFixed(1)} MB)` },
        { status: 400 },
      );
    }

    const extension = getExtension(fileName, mimeType);
    const filePath = `articles/${crypto.randomUUID()}.${extension}`;

    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from('news-images')
      .createSignedUploadUrl(filePath);

    if (signedError) {
      console.error('[NEWS_UPLOAD] Signed URL error:', signedError);
      return NextResponse.json(
        { error: 'Error al generar la autorización de subida' },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('news-images').getPublicUrl(filePath);

    return NextResponse.json({
      path: signedData.path,
      token: signedData.token,
      signedUrl: signedData.signedUrl,
      publicUrl,
    });
  } catch (error: unknown) {
    console.error('[NEWS_UPLOAD]', error);
    // Preserve ApiError status codes from ensureAppPermission / permissions layer
    if (
      error instanceof Error &&
      'status' in error &&
      typeof (error as { status: unknown }).status === 'number'
    ) {
      const status = (error as { status: number }).status;
      if (status >= 400 && status < 500) {
        return NextResponse.json({ error: error.message }, { status });
      }
    }
    const message =
      error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
