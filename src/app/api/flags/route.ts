import { NextResponse } from 'next/server';
import { verifyAccess } from '@vercel/flags';
import * as flags from '@/flags';

export async function GET(request: Request) {
  const access = await verifyAccess(request.headers.get('Authorization'));
  if (!access) return new Response('Unauthorized', { status: 401 });

  return NextResponse.json({
    definitions: {
      showBetaFeatures: {
        options: [
          { value: false, label: 'Oculto' },
          { value: true, label: 'Visible' },
        ],
      },
    },
  });
}
