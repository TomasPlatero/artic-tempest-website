import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { enforceDesktopOrIntegrationAuth } from '@/shared/api/desktop-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type NotificationsPayload =
  | { action: 'list' }
  | { action: 'mark_read'; notificationId: string }
  | { action: 'mark_all_read'; notificationIds: string[] };

type InvokeErrorShape = {
  message?: string;
  status?: number;
  context?: unknown;
};

function parseInvokeContext(context: unknown): Record<string, unknown> | null {
  if (!context) return null;

  if (typeof context === 'string') {
    try {
      const parsed = JSON.parse(context) as unknown;
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
      return { raw: context };
    } catch {
      return { raw: context };
    }
  }

  if (typeof context === 'object') {
    return context as Record<string, unknown>;
  }

  // oxlint-disable-next-line no-base-to-string
  return { raw: String(context) };
}

function toHttpStatus(value: unknown): number | null {
  if (typeof value !== 'number') return null;
  if (!Number.isInteger(value)) return null;
  if (value < 400 || value > 599) return null;
  return value;
}

function isValidNotificationId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseNotificationsPayload(raw: unknown): {
  ok: true;
  payload: NotificationsPayload;
} | {
  ok: false;
  error: string;
  code: string;
} {
  if (!raw || typeof raw !== 'object') {
    return {
      ok: false,
      error: 'Body must be a JSON object',
      code: 'INVALID_BODY',
    };
  }

  const action = (raw as { action?: unknown }).action;
  if (action === 'list') {
    return { ok: true, payload: { action: 'list' } };
  }

  if (action === 'mark_read') {
    const notificationId = (raw as { notificationId?: unknown }).notificationId;
    if (!isValidNotificationId(notificationId)) {
      return {
        ok: false,
        error: 'Missing or invalid "notificationId"',
        code: 'INVALID_NOTIFICATION_ID',
      };
    }
    return {
      ok: true,
      payload: { action: 'mark_read', notificationId },
    };
  }

  if (action === 'mark_all_read') {
    const notificationIds = (raw as { notificationIds?: unknown })
      .notificationIds;
    if (
      !Array.isArray(notificationIds) ||
      notificationIds.length === 0 ||
      notificationIds.some((id) => !isValidNotificationId(id))
    ) {
      return {
        ok: false,
        error: 'Missing or invalid "notificationIds"',
        code: 'INVALID_NOTIFICATION_IDS',
      };
    }

    return {
      ok: true,
      payload: {
        action: 'mark_all_read',
        notificationIds: notificationIds.map((id) => id.trim()),
      },
    };
  }

  return {
    ok: false,
    error: 'Missing or invalid action',
    code: 'INVALID_ACTION',
  };
}

export async function POST(request: NextRequest) {
  const discordToken = request.headers.get('x-discord-access-token')?.trim();
  const desktopSessionToken = request.headers.get('x-desktop-session-token')?.trim();
  const authorization = request.headers.get('authorization')?.trim();
  if (!discordToken) {
    return NextResponse.json(
      {
        error: 'Missing x-discord-access-token header',
        code: 'MISSING_DISCORD_ACCESS_TOKEN',
      },
      { status: 401 },
    );
  }

  if (discordToken.length > 4096) {
    return NextResponse.json(
      {
        error: 'Invalid x-discord-access-token header',
        code: 'INVALID_DISCORD_ACCESS_TOKEN',
      },
      { status: 401 },
    );
  }

  const session = await auth();
  if (!session) {
    const authResult = await enforceDesktopOrIntegrationAuth(request);
    if (!('kind' in authResult)) {
      return authResult;
    }
  }

  let rawPayload: unknown;
  try {
    rawPayload = (await request.json()) as unknown;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'INVALID_JSON_BODY' },
      { status: 400 },
    );
  }

  const parsedPayload = parseNotificationsPayload(rawPayload);
  if (!parsedPayload.ok) {
    return NextResponse.json(
      { error: parsedPayload.error, code: parsedPayload.code },
      { status: 400 },
    );
  }

  const payload = parsedPayload.payload;

  const { data, error } = await supabaseAdmin.functions.invoke(
    'desktop-notifications',
    {
      body: payload,
      headers: {
        'x-discord-access-token': discordToken,
        ...(desktopSessionToken ? { 'x-desktop-session-token': desktopSessionToken } : {}),
        ...(authorization ? { Authorization: authorization } : {}),
      },
    },
  );

  if (error) {
    console.error('[DesktopNotifications] Supabase function error', error);

    const invokeError = error as InvokeErrorShape;
    const context = parseInvokeContext(invokeError.context);
    const upstreamStatus =
      toHttpStatus(context?.status ?? context?.statusCode) ?? null;
    const status = toHttpStatus(invokeError.status) ?? upstreamStatus ?? 502;

    const upstreamMessage =
      (typeof context?.error === 'string' && context.error) ||
      (typeof context?.message === 'string' && context.message) ||
      null;

    const isGenericEdgeError = invokeError.message?.includes(
      'Edge Function returned a non-2xx status code',
    );

    const errorMessage =
      (isGenericEdgeError && upstreamMessage) ||
      invokeError.message ||
      upstreamMessage ||
      'Desktop notifications upstream request failed';

    return NextResponse.json(
      {
        error: errorMessage,
        code: 'UPSTREAM_REQUEST_FAILED',
        upstreamStatus,
      },
      { status },
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        error: 'No response from desktop notifications function',
        code: 'UPSTREAM_EMPTY_RESPONSE',
      },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
