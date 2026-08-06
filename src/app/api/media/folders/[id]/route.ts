import { NextResponse } from "next/server";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from "@/shared/auth/permissions";
import { handleRouteError, parseJsonBody } from "@/shared/api/errors";
import { UpdateFolderSchema } from "@/domains/media/schemas";
import { canDeleteFolder } from "@/domains/media/lib/folders";

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await ensureAppPermission("media-library", "manage");

		const { id } = await params;
		const body = await parseJsonBody(req, UpdateFolderSchema);

		// Fetch existing folder
		const { data: existing, error: fetchError } = await supabaseAdmin
			.from("media_folders")
			.select("*")
			.eq("id", id)
			.maybeSingle();

		if (fetchError || !existing) {
			return NextResponse.json(
				{ error: "Carpeta no encontrada" },
				{ status: 404 },
			);
		}

		// Build update payload — only include valid fields (Zod strips unknowns)
		const updates: Record<string, unknown> = {};
		if (body.display_name !== undefined)
			updates.display_name = body.display_name;
		if (body.description !== undefined) updates.description = body.description;
		if (body.sort_order !== undefined) updates.sort_order = body.sort_order;
		if (body.is_system !== undefined) updates.is_system = body.is_system;

		const { data: updated, error: updateError } = await supabaseAdmin
			.from("media_folders")
			.update(updates)
			.eq("id", id)
			.select()
			.single();

		if (updateError) {
			console.error("[MEDIA_FOLDERS_PATCH] Update error:", updateError);
			return NextResponse.json(
				{ error: `Error al actualizar la carpeta: ${updateError.message}` },
				{ status: 500 },
			);
		}

		return NextResponse.json({ folder: updated });
	} catch (error) {
		return handleRouteError(error);
	}
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await ensureAppPermission("media-library", "manage");

		const { id } = await params;

		// Fetch existing folder
		const { data: existing, error: fetchError } = await supabaseAdmin
			.from("media_folders")
			.select("*")
			.eq("id", id)
			.maybeSingle();

		if (fetchError || !existing) {
			return NextResponse.json(
				{ error: "Carpeta no encontrada" },
				{ status: 404 },
			);
		}

		// Guard: cannot delete system folders
		if (!canDeleteFolder(existing)) {
			return NextResponse.json(
				{ error: "Las carpetas del sistema no se pueden eliminar" },
				{ status: 403 },
			);
		}

		// Get all file paths in the bucket (from metadata)
		const { data: files } = await supabaseAdmin
			.from("media_metadata")
			.select("storage_path")
			.eq("bucket", existing.bucket_name);

		// Delete files from storage
		if (files && files.length > 0) {
			const paths = files.map((f: { storage_path: string }) => f.storage_path);
			const { error: removeError } = await supabaseAdmin.storage
				.from(existing.bucket_name)
				.remove(paths);

			if (removeError) {
				console.error(
					"[MEDIA_FOLDERS_DELETE] Storage remove error:",
					removeError,
				);
			}
		}

		// Delete metadata rows
		const { error: metadataDeleteError } = await supabaseAdmin
			.from("media_metadata")
			.delete()
			.eq("bucket", existing.bucket_name);

		if (metadataDeleteError) {
			console.error(
				"[MEDIA_FOLDERS_DELETE] Metadata delete error:",
				metadataDeleteError,
			);
		}

		// Delete the storage bucket
		const { error: bucketDeleteError } =
			await supabaseAdmin.storage.deleteBucket(existing.bucket_name);

		if (bucketDeleteError) {
			console.error(
				"[MEDIA_FOLDERS_DELETE] Bucket delete error:",
				bucketDeleteError,
			);
		}

		// Delete the folder row
		const { error: folderDeleteError } = await supabaseAdmin
			.from("media_folders")
			.delete()
			.eq("id", id);

		if (folderDeleteError) {
			console.error(
				"[MEDIA_FOLDERS_DELETE] Folder delete error:",
				folderDeleteError,
			);
			return NextResponse.json(
				{ error: `Error al eliminar la carpeta: ${folderDeleteError.message}` },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		return handleRouteError(error);
	}
}
