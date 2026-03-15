import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { ok: true, routes: ['/api/configuracion/backup', '/api/configuracion/backup/status', '/api/configuracion/backup/download'] },
    { status: 200 },
  );
}
