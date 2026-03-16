import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    const url = request.nextUrl.clone();
    const response = NextResponse.next();

    // Lista de flags conocidas para evitar procesar parámetros irrelevantes
    const knownFlags = [
        'showBetaFeatures',
        'enableRoster',
        'enableCalendar',
        'enableWishlist',
        'enablePlanner',
        'enableStatsLogs',
        'enableWeeklyVault',
        'enableEconomy'
    ];

    // Procesamos todos los parámetros de la URL
    url.searchParams.forEach((value, key) => {
        if (knownFlags.includes(key)) {
            if (value === 'true' || value === 'false') {
                response.cookies.set(key, value, { 
                    path: '/',
                    maxAge: 60 * 60 * 24 * 30 // 30 días
                });
            }
        }
    });

    return response;
}

export const config = {
    matcher: ['/', '/dashboard/:path*', '/beta/:path*'],
};
