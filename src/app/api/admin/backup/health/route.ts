import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { ok: true, routes: ['/backup', '/backup/status', '/backup/download'] },
    { status: 200 },
  );
}
