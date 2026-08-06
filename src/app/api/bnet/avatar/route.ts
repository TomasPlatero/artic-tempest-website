import { NextRequest, NextResponse } from 'next/server';
import {
  fetchCharacterMedia,
  getAccessToken,
} from '@/shared/integrations/bnet/bnet-client';

const ALLOWED_REGIONS = new Set(['eu', 'us', 'kr', 'tw']);

export const runtime = 'nodejs';

function isValidCharacterName(value: string) {
  const normalized = value.trim();
  if (normalized.length < 2 || normalized.length > 24) return false;
  return /^[\p{L}'-]+$/u.test(normalized);
}

function isValidRealmSlug(value: string) {
  const normalized = value.trim();
  if (normalized.length < 2 || normalized.length > 64) return false;
  return /^[a-z0-9-]+$/i.test(normalized);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name')?.trim() ?? '';
  const realm = searchParams.get('realm')?.trim() ?? '';
  const region = (searchParams.get('region')?.trim().toLowerCase() || 'eu') as
    | 'eu'
    | 'us'
    | 'kr'
    | 'tw';

  if (!name || !realm) {
    return NextResponse.json(
      { error: 'Missing name or realm', code: 'MISSING_QUERY_PARAMS' },
      { status: 400 },
    );
  }

  if (!isValidCharacterName(name)) {
    return NextResponse.json(
      { error: 'Invalid character name', code: 'INVALID_CHARACTER_NAME' },
      { status: 400 },
    );
  }

  if (!isValidRealmSlug(realm)) {
    return NextResponse.json(
      { error: 'Invalid realm', code: 'INVALID_REALM' },
      { status: 400 },
    );
  }

  if (!ALLOWED_REGIONS.has(region)) {
    return NextResponse.json(
      { error: 'Invalid region', code: 'INVALID_REGION' },
      { status: 400 },
    );
  }

  try {
    const token = await getAccessToken();
    const avatarUrl = await fetchCharacterMedia(
      realm.toLowerCase(),
      name.toLowerCase(),
      region,
      token,
    );

    if (!avatarUrl) {
      return NextResponse.json(
        { error: 'Avatar not found', code: 'AVATAR_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Cache for 24 hours
    return NextResponse.json(
      { url: avatarUrl },
      {
        headers: {
          'Cache-Control':
            'public, s-maxage=86400, stale-while-revalidate=43200',
        },
      },
    );
  } catch (error) {
    console.error('Error fetching blizzard avatar:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'AVATAR_FETCH_FAILED' },
      { status: 500 },
    );
  }
}
