import { NextResponse } from 'next/server';
import { getEnrichedStreamers } from '@/domains/streamers/lib/server-actions';

export const revalidate = 60;

export async function GET() {
  try {
    const streamers = await getEnrichedStreamers();
    return NextResponse.json(streamers);
  } catch (error) {
    console.error('[STREAMERS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
