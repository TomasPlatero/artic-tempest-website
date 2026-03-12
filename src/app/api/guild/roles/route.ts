import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  void req;
  return NextResponse.json(
    { error: 'Endpoint legado. Usa /api/guild/roles/discord.' },
    { status: 410 },
  );
}

export async function DELETE(req: Request) {
  void req;
  return NextResponse.json(
    { error: 'Endpoint legado. Usa /api/guild/roles/discord.' },
    { status: 410 },
  );
}
