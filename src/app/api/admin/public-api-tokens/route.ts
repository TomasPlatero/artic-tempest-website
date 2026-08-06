import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ensureAppPermission } from '@/shared/auth/permissions';
import { hashBearerToken, refreshBearerTokens } from '@/shared/api/public-auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { apiErrorResponse, noStoreHeaders } from '@/shared/api/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TokenBody = {
  label?: string;
};

type TokenDeleteBody = {
  id?: string;
  tokenId?: string;
};

type TokenPatchBody = {
  id: string;
  label?: string | null;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function sanitizeLabel(value?: string | null) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 120) : null;
}

export async function GET() {
  try {
    await ensureAppPermission('settings', 'manage');

    const { data, error } = await supabaseAdmin
      .from('public_api_tokens')
      .select(
        'id, label, created_at, last_used_at, revoked_at, created_by, revoked_by',
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PUBLIC API] Error listing tokens', error);
      return NextResponse.json(
        { error: 'No se pudieron listar los tokens', code: 'LIST_TOKENS_FAILED' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { tokens: data ?? [] },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null);

    if (rawBody !== null && typeof rawBody !== 'object') {
      return NextResponse.json(
        { error: 'JSON body inválido', code: 'INVALID_JSON_BODY' },
        { status: 400 },
      );
    }

    const session = await ensureAppPermission('settings', 'manage');
    const body = ((rawBody as TokenBody | null) ?? {}) as TokenBody;
    const label = sanitizeLabel(body.label);

    const token = randomBytes(32).toString('hex');
    const hashed = hashBearerToken(token);

    const { data, error } = await supabaseAdmin
      .from('public_api_tokens')
      .insert({
        token_hash: hashed,
        label,
        created_by: session.user?.id ?? null,
      })
      .select('id, label, created_at')
      .single();

    if (error || !data) {
      console.error('[PUBLIC API] Error creating token', error);
      return NextResponse.json(
        { error: 'No se pudo generar el token', code: 'CREATE_TOKEN_FAILED' },
        { status: 500 },
      );
    }

    await refreshBearerTokens();

    return NextResponse.json(
      {
        tokenId: data.id,
        token,
        label: data.label,
        createdAt: data.created_at,
        note: 'Guarda este valor en tu secreto o en la app. Solo se muestra una vez y queda registrado en la base de datos.',
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null);

    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json(
        { error: 'JSON body inválido', code: 'INVALID_JSON_BODY' },
        { status: 400 },
      );
    }

    const session = await ensureAppPermission('settings', 'manage');

    const body = rawBody as TokenDeleteBody;

    const tokenId = (body.id ?? body.tokenId ?? '').trim();
    if (!tokenId) {
      return NextResponse.json(
        { error: 'Falta el identificador del token', code: 'MISSING_TOKEN_ID' },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(tokenId)) {
      return NextResponse.json(
        {
          error: 'El identificador del token no es válido',
          code: 'INVALID_TOKEN_ID',
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('public_api_tokens')
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by: session.user?.id ?? null,
      })
      .eq('id', tokenId)
      .is('revoked_at', null)
      .select('id')
      .single();

    if (error || !data) {
      console.error('[PUBLIC API] Error revoking token', error);
      return NextResponse.json(
        {
          error: 'El token no existe o ya estaba revocado',
          code: 'TOKEN_NOT_FOUND_OR_REVOKED',
        },
        { status: 404 },
      );
    }

    await refreshBearerTokens();

    return NextResponse.json(
      { id: data.id, status: 'revoked' },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null);

    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json(
        { error: 'JSON body inválido', code: 'INVALID_JSON_BODY' },
        { status: 400 },
      );
    }

    await ensureAppPermission('settings', 'manage');

    const body = rawBody as TokenPatchBody;
    const tokenId = (body.id ?? '').trim();

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Falta el identificador del token', code: 'MISSING_TOKEN_ID' },
        { status: 400 },
      );
    }

    if (!UUID_REGEX.test(tokenId)) {
      return NextResponse.json(
        { error: 'El identificador del token no es válido', code: 'INVALID_TOKEN_ID' },
        { status: 400 },
      );
    }

    const label = sanitizeLabel(body.label);

    const { data, error } = await supabaseAdmin
      .from('public_api_tokens')
      .update({ label })
      .eq('id', tokenId)
      .is('revoked_at', null)
      .select('id, label, created_at, last_used_at, revoked_at')
      .single();

    if (error || !data) {
      console.error('[PUBLIC API] Error updating token label', error);
      return NextResponse.json(
        { error: 'El token no existe o ya estaba revocado', code: 'TOKEN_NOT_FOUND' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { token: data },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
