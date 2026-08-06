import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { enforceDesktopOrIntegrationAuth } from '@/shared/api/desktop-auth';
import { getRosterProfessions } from '@/domains/professions/lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    const authResult = await enforceDesktopOrIntegrationAuth(request);
    if (!('kind' in authResult)) {
      return authResult;
    }
  }

  try {
    const { members, professionOptions } = await getRosterProfessions({
      fresh: true,
    });

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        members,
        professionOptions,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      },
    );
  } catch (error) {
    console.error(
      '[DesktopProfessions] Unable to load roster professions',
      error,
    );
    return NextResponse.json(
      {
        error: 'No se pudieron obtener las profesiones del roster',
        code: 'PROFESSIONS_FETCH_FAILED',
      },
      { status: 500 },
    );
  }
}
