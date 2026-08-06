import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { enforceDesktopOrIntegrationAuth } from '@/shared/api/desktop-auth';

export const dynamic = 'force-dynamic';

const APP_UPDATE_BUCKET = process.env.APP_UPDATES_BUCKET || 'app_updates';
const APP_UPDATE_PREFIX = (process.env.APP_UPDATES_PREFIX || '').replace(
  /(^\/|\/$)/g,
  '',
);
const APP_UPDATE_EXTENSION = (
  process.env.APP_UPDATES_EXTENSION || '.exe'
).toLowerCase();
const APP_UPDATE_SOURCE = (
  process.env.APP_UPDATES_SOURCE || 'storage'
).toLowerCase();

type StorageObjectSummary = {
  path: string;
  updatedAt: string | null;
  createdAt: string | null;
};

async function resolveLatestFromStorage(): Promise<string | null> {
  try {
    const bucket = supabaseAdmin.storage.from(APP_UPDATE_BUCKET);
    const visited = new Set<string>();

    const walkPrefixes = async (
      prefixes: string[],
    ): Promise<StorageObjectSummary[]> => {
      if (prefixes.length === 0) return [];

      const results = await Promise.all(
        prefixes.map(async (currentPrefix) => {
          if (visited.has(currentPrefix)) {
            return { currentPrefix, data: [] as any[], error: null as any };
          }

          visited.add(currentPrefix);

          const { data, error } = await bucket.list(currentPrefix || undefined, {
            limit: 1000,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' },
          });

          return { currentPrefix, data: data || [], error };
        }),
      );

      const nextPrefixes: string[] = [];
      const files: StorageObjectSummary[] = [];

      for (const result of results) {
        if (result.error) {
          console.error('[DOWNLOAD] Supabase storage list error:', result.error);
          return [];
        }

        for (const entry of result.data) {
          if (!entry?.name) continue;

          const fullPath = result.currentPrefix
            ? `${result.currentPrefix}/${entry.name}`
            : entry.name;

          if (!entry.id) {
            nextPrefixes.push(fullPath);
            continue;
          }

          if (!fullPath.toLowerCase().endsWith(APP_UPDATE_EXTENSION)) continue;

          files.push({
            path: fullPath,
            createdAt: entry.created_at ?? null,
            updatedAt: entry.updated_at ?? null,
          });
        }
      }

      const childFiles = await walkPrefixes(nextPrefixes);
      return [...files, ...childFiles];
    };

    const files = await walkPrefixes([APP_UPDATE_PREFIX || '']);

    if (files.length === 0) {
      console.warn('[DOWNLOAD] No matching files found in storage bucket');
      return null;
    }

    files.sort((a, b) => {
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      return bTime - aTime;
    });

    const latest = files[0];
    const { data: publicUrlData } = bucket.getPublicUrl(latest.path, {
      download: latest.path.split('/').pop() || 'ArticTempest.exe',
    });

    if (!publicUrlData?.publicUrl) {
      console.error(
        '[DOWNLOAD] Failed to generate public URL for storage file',
      );
      return null;
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('[DOWNLOAD] Unexpected storage resolver error:', error);
    return null;
  }
}

async function resolveLatestFromGitHub(): Promise<NextResponse> {
  const githubToken =
    process.env.GITHUB_RELEASE_TOKEN || process.env.GITHUB_TOKEN || null;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'ArticTempest-Artictempest',
  };

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  const response = await fetch(
    'https://api.github.com/repos/TomasPlatero/artictempest-app/releases/latest',
    {
      headers,
      next: { revalidate: 300 },
    },
  );

  if (!response.ok) {
    const errorPayload = await response.text().catch(() => response.statusText);
    console.error(
      `[DOWNLOAD] GitHub API Error: ${response.status} ${response.statusText} - ${errorPayload}`,
    );
    return NextResponse.json(
      { error: 'Failed to fetch latest release metadata' },
      { status: response.status },
    );
  }

  const data = await response.json();
  const assets = data.assets || [];
  const exeAsset = assets.find((asset: any) =>
    asset.name.toLowerCase().endsWith('.exe'),
  );

  if (!exeAsset) {
    console.error('[DOWNLOAD] No .exe asset found in latest release.');
    return NextResponse.json(
      { error: 'No executable found for the latest release' },
      { status: 404 },
    );
  }

  console.log(
    `[DOWNLOAD] Redirecting to GitHub asset: ${exeAsset.browser_download_url}`,
  );
  return NextResponse.redirect(exeAsset.browser_download_url);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    const authResult = await enforceDesktopOrIntegrationAuth(request);
    if (!('kind' in authResult)) {
      return authResult;
    }
  }

  try {
    if (APP_UPDATE_SOURCE === 'storage') {
      const storageUrl = await resolveLatestFromStorage();
      if (storageUrl) {
        console.log('[DOWNLOAD] Redirecting to Supabase storage asset');
        return NextResponse.redirect(storageUrl, {
          headers: { 'Cache-Control': 'public, max-age=300' },
        });
      }
      console.error(
        '[DOWNLOAD] Storage lookup failed. No fallback configured.',
      );
      return NextResponse.json(
        {
          error: 'No se pudo resolver la versión disponible',
          code: 'LATEST_EXE_NOT_FOUND',
        },
        { status: 404 },
      );
    }

    if (APP_UPDATE_SOURCE === 'github') {
      return await resolveLatestFromGitHub();
    }

    if (APP_UPDATE_SOURCE === 'auto') {
      const storageUrl = await resolveLatestFromStorage();
      if (storageUrl) {
        console.log('[DOWNLOAD] Redirecting to Supabase storage asset (auto)');
        return NextResponse.redirect(storageUrl, {
          headers: { 'Cache-Control': 'public, max-age=300' },
        });
      }
      console.warn(
        '[DOWNLOAD] Storage lookup failed, falling back to GitHub (auto)',
      );
      return await resolveLatestFromGitHub();
    }

    console.error(
      `[DOWNLOAD] Invalid APP_UPDATES_SOURCE: ${APP_UPDATE_SOURCE}`,
    );
    return NextResponse.json(
      {
        error: 'Configuración de descarga inválida',
        code: 'INVALID_APP_UPDATES_SOURCE',
      },
      { status: 500 },
    );
  } catch (error: any) {
    console.error('[DOWNLOAD] Unexpected error:', error);
    return NextResponse.json(
      { error: 'No se pudo obtener la actualización' },
      { status: 500 },
    );
  }
}
