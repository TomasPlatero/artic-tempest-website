// src/app/api/admin/system/cron/verify-members/route.ts
import { NextResponse } from "next/server"
import { processVerificationBatch } from "@/domains/membership/lib/sync-engine"

export const dynamic = 'force-dynamic'

/**
 * Endpoint para el Cron Job (Verificación Automática de Miembros)
 * Recomendado llamar cada 1h o según volumen.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')

    // Seguridad básica para evitar ejecuciones externas no autorizadas
    if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const batchSize = parseInt(searchParams.get('limit') || '10')
        const results = await processVerificationBatch(batchSize)

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            processedCount: results.length,
            results
        })
    } catch (error: any) {
        console.error("CRON Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
