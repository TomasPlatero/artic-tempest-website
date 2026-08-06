import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { ensureAppPermission } from "@/shared/auth/permissions";
import { handleRouteError, parseJsonBody } from "@/shared/api/errors";
import { RenameFileSchema } from "@/domains/media/schemas";

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await ensureAppPermission("media-library", "edit");

		const { id } = await params;
		const body = await parseJsonBody(req, RenameFileSchema);

		// Fetch existing metadata row
		const { data: existing, error: fetchError } = await supabaseAdmin
			.from("media_metadata")
			.select("*")
			.eq("id", id)
			.maybeSingle();

		if (fetchError || !existing) {
			return NextResponse.json(
				{ error: "Archivo no encontrado" },
				{ status: 404 },
			);
		}

		// Determine new path — preserve extension if none provided
		let newPath = body.newName;
		// Reject path traversal
		if (
			newPath.includes("..") ||
			newPath.includes("/") ||
			newPath.includes("\\")
		) {
			return NextResponse.json(
				{ error: "Nombre de archivo no válido" },
				{ status: 400 },
			);
		}
		const lastDot = newPath.lastIndexOf(".");
		if (lastDot === -1 || lastDot === 0) {
			// No extension or dotfile — preserve from current storage_path
			const oldExt = existing.storage_path.includes(".")
				? existing.storage_path.slice(existing.storage_path.lastIndexOf("."))
				: "";
			if (oldExt) {
				newPath = newPath + oldExt;
			}
		}

		// Move file in storage
		const { error: moveError } = await supabaseAdmin.storage
			.from(existing.bucket)
			.move(existing.storage_path, newPath);

		if (moveError) {
			console.error("[MEDIA_RENAME] Move error:", moveError);
			return NextResponse.json(
				{ error: `Error al renombrar: ${moveError.message}` },
				{ status: 500 },
			);
		}

		// Update metadata row with new path
		const { data: updated, error: updateError } = await supabaseAdmin
			.from("media_metadata")
			.update({ storage_path: newPath })
			.eq("id", id)
			.select()
			.single();

		if (updateError) {
			console.error("[MEDIA_RENAME] Update error:", updateError);
			return NextResponse.json(
				{ error: `Error al actualizar ruta: ${updateError.message}` },
				{ status: 500 },
			);
		}

		return NextResponse.json({ file: updated });
	} catch (error) {
		return handleRouteError(error);
	}
}
