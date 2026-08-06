import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { enforceDesktopOrIntegrationAuth } from '@/shared/api/desktop-auth';

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
    const { data, error } = await supabaseAdmin
      .from('game_constants')
      .select('category, key, value, metadata');

    if (error) throw error;

    // Transform into a more usable structure
    const constants: Record<string, Record<string, any>> = {};

    data.forEach((item) => {
      if (!constants[item.category]) {
        constants[item.category] = {};
      }
      constants[item.category][item.key] = {
        value: item.value,
        metadata: item.metadata,
      };
    });

    return NextResponse.json(constants);
  } catch (e: any) {
    console.error('API Error fetching constants:', e);
    return NextResponse.json(
      { error: 'No se pudieron cargar las constantes' },
      { status: 500 },
    );
  }
}
