import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { ensureAppPermission } from "@/shared/auth/permissions";
import { handleRouteError, parseJsonBody } from "@/shared/api/errors";
import { UpdateMetadataSchema } from "@/domains/media/schemas";
import { sanitizePath } from "@/domains/media/lib/storage";

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await ensureAppPermission("media-library", "edit");

		const { id } = await params;
		const body = await parseJsonBody(req, UpdateMetadataSchema);

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

		// Build update payload — only include provided fields
		const updates: Record<string, unknown> = {};
		if (body.title !== undefined) updates.title = body.title;
		if (body.alt_text !== undefined) updates.alt_text = body.alt_text;
		if (body.caption !== undefined) updates.caption = body.caption;
		if (body.description !== undefined) updates.description = body.description;

		const { data: updated, error: updateError } = await supabaseAdmin
			.from("media_metadata")
			.update(updates)
			.eq("id", id)
			.select()
			.single();

		if (updateError) {
			console.error("[MEDIA_METADATA_PATCH] Update error:", updateError);
			return NextResponse.json(
				{ error: `Error al actualizar metadatos: ${updateError.message}` },
				{ status: 500 },
			);
		}

		return NextResponse.json({ file: updated });
	} catch (error) {
		return handleRouteError(error);
	}
}

async function deleteOneMedia(deleteId: string) {
	try {
		// Handle orphan files (no metadata row)
		if (deleteId.startsWith("orphan::")) {
			const [, bucket, storagePath] = deleteId.split("::");
			if (bucket && storagePath) {
				const safePath = sanitizePath(storagePath);
				const { error: removeError } = await supabaseAdmin.storage
					.from(bucket)
					.remove([safePath]);
				if (removeError) {
					console.error(
						`[MEDIA_DELETE] Orphan storage remove error for ${storagePath}:`,
						removeError,
					);
					return {
						ok: false,
						error: `ID ${deleteId}: ${removeError.message}`,
					};
				}
				return { ok: true };
			}
			return {
				ok: false,
				error: `ID ${deleteId}: archivo no encontrado`,
			};
		}

		// Regular file: look up metadata row
		const { data: file, error: fetchError } = await supabaseAdmin
			.from("media_metadata")
			.select("*")
			.eq("id", deleteId)
			.maybeSingle();

		if (fetchError || !file) {
			return {
				ok: false,
				error: `ID ${deleteId}: archivo no encontrado`,
			};
		}

		// Remove from storage
		const safePath = sanitizePath(file.storage_path);
		const { error: removeError } = await supabaseAdmin.storage
			.from(file.bucket)
			.remove([safePath]);

		if (removeError) {
			console.error(
				`[MEDIA_DELETE] Storage remove error for ${deleteId}:`,
				removeError,
			);
		}

		// Delete metadata row
		const { error: deleteError } = await supabaseAdmin
			.from("media_metadata")
			.delete()
			.eq("id", deleteId);

		if (deleteError) {
			console.error(
				`[MEDIA_DELETE] Metadata delete error for ${deleteId}:`,
				deleteError,
			);
			return {
				ok: false,
				error: `ID ${deleteId}: ${deleteError.message}`,
			};
		}

		return { ok: true };
	} catch (err) {
		return {
			ok: false,
			error: `ID ${deleteId}: ${err instanceof Error ? err.message : "Error"}`,
		};
	}
}

export async function DELETE(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await ensureAppPermission("media-library", "edit");

		const { id } = await params;
		const url = new URL(req.url);
		const idsParam = url.searchParams.get("ids");
		const hasIdsParam = url.searchParams.has("ids");

		// Bulk delete mode
		if (hasIdsParam) {
			const ids = idsParam!.split(",").filter(Boolean);

			if (ids.length === 0) {
				return NextResponse.json(
					{ error: "Se requiere al menos un ID para eliminar" },
					{ status: 400 },
				);
			}

			const results = await Promise.all(ids.map(deleteOneMedia));
			let processed = 0;
			const errors: string[] = [];
			for (const r of results) {
				if (r.ok) processed++;
				else if (r.error) errors.push(r.error);
			}

			return NextResponse.json({
				success: errors.length === 0,
				processed,
				total: ids.length,
				...(errors.length > 0 ? { errors } : {}),
			});
		}

		// Single delete mode
		// Handle orphan files
		if (id.startsWith("orphan::")) {
			const [, bucket, storagePath] = id.split("::");
			if (bucket && storagePath) {
				const safePath = sanitizePath(storagePath);
				const { error: removeError } = await supabaseAdmin.storage
					.from(bucket)
					.remove([safePath]);
				if (removeError) {
					return NextResponse.json(
						{ error: removeError.message },
						{ status: 500 },
					);
				}
				return NextResponse.json({ success: true });
			}
			return NextResponse.json(
				{ error: "Archivo no encontrado" },
				{ status: 404 },
			);
		}

		const { data: file, error: fetchError } = await supabaseAdmin
			.from("media_metadata")
			.select("*")
			.eq("id", id)
			.maybeSingle();

		if (fetchError || !file) {
			return NextResponse.json(
				{ error: "Archivo no encontrado" },
				{ status: 404 },
			);
		}

		// Remove from storage
		const safePath = sanitizePath(file.storage_path);
		const { error: removeError } = await supabaseAdmin.storage
			.from(file.bucket)
			.remove([safePath]);

		if (removeError) {
			console.error("[MEDIA_DELETE] Storage remove error:", removeError);
		}

		// Delete metadata row
		const { error: deleteError } = await supabaseAdmin
			.from("media_metadata")
			.delete()
			.eq("id", id);

		if (deleteError) {
			console.error("[MEDIA_DELETE] Delete error:", deleteError);
			return NextResponse.json(
				{ error: `Error al eliminar: ${deleteError.message}` },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		return handleRouteError(error);
	}
}
