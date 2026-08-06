// src/app/api/admin/system/cron/verify-members/route.ts
import { NextResponse } from "next/server";
import { processVerificationBatch } from "@/domains/membership/lib/sync-engine.server";
import { requireCronAuth } from "@/shared/security/cron-auth";

export const dynamic = "force-dynamic";

/**
 * Endpoint para el Cron Job (Verificación Automática de Miembros)
 * Recomendado llamar cada 1h o según volumen.
 */
export async function GET(req: Request) {
	const authError = requireCronAuth(req, { allowQuerySecret: true });
	if (authError) {
		return authError;
	}

	try {
		const { searchParams } = new URL(req.url);
		const batchSize = parseInt(searchParams.get("limit") || "10");
		const results = await processVerificationBatch(batchSize);

		return NextResponse.json({
			success: true,
			timestamp: new Date().toISOString(),
			processedCount: results.length,
			results,
		});
	} catch (error: any) {
		console.error("CRON Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
