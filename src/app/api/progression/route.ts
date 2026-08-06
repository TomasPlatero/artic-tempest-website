export const revalidate = 300;
import { NextResponse } from 'next/server';
import { getRaidProgression } from '@/domains/landing/lib/progression';

export async function GET() {
  try {
    const progression = await getRaidProgression();
    return NextResponse.json({ progression });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo cargar el progreso' },
      { status: 500 },
    );
  }
}
