import { NextResponse } from "next/server";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from "@/shared/auth/permissions";
import { handleRouteError, parseJsonBody } from "@/shared/api/errors";
import { ConfirmUploadSchema } from "@/domains/media/schemas";

export async function POST(req: Request) {
	try {
		await ensureAppPermission("media-library", "edit");

		const body = await parseJsonBody(req, ConfirmUploadSchema);

		const { data: file, error: insertError } = await supabaseAdmin
			.from("media_metadata")
			.insert({
				bucket: body.bucket,
				storage_path: body.storage_path,
				file_size: body.file_size,
				mime_type: body.mime_type,
				title: body.title ?? "",
				alt_text: body.alt_text ?? "",
				dimensions: body.dimensions ?? "",
			})
			.select()
			.single();

		if (insertError) {
			console.error("[MEDIA_CONFIRM] Insert error:", insertError);
			return NextResponse.json(
				{ error: `Error al registrar el archivo: ${insertError.message}` },
				{ status: 500 },
			);
		}

		return NextResponse.json({ file });
	} catch (error) {
		return handleRouteError(error);
	}
}
