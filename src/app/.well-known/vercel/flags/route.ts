import { getProviderData } from '@vercel/flags/next';
import { NextResponse } from 'next/server';
import * as flags from '@/flags';

export async function GET(request: Request) {
  const apiData = await getProviderData(flags);
  return NextResponse.json(apiData);
}
