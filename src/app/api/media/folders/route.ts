import { NextResponse } from "next/server";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from "@/shared/auth/permissions";
import { handleRouteError, parseJsonBody } from "@/shared/api/errors";
import { CreateFolderSchema } from "@/domains/media/schemas";
import { slugify } from "@/domains/media/lib/folders";

export async function GET(_req: Request) {
	try {
		await ensureAppPermission("media-library", "view");

		// Query media_folders ordered by sort_order, then display_name
		const { data: folders, error: foldersError } = await supabaseAdmin
			.from("media_folders")
			.select("*")
			.order("sort_order", { ascending: true })
			.order("display_name", { ascending: true });

		if (foldersError) {
			console.error("[MEDIA_FOLDERS_GET] Folders query error:", foldersError);
			return NextResponse.json(
				{ error: "Error al cargar las carpetas" },
				{ status: 500 },
			);
		}

		// For each folder, get file count from media_metadata AND from storage
		const foldersWithCounts = await Promise.all(
			(folders ?? []).map(async (folder) => {
				const [{ count: metaCount }, { data: storageFiles }] =
					await Promise.all([
						supabaseAdmin
							.from("media_metadata")
							.select("*", { count: "exact", head: true })
							.eq("bucket", folder.bucket_name),
						supabaseAdmin.storage
							.from(folder.bucket_name)
							.list()
							.then((r) => ({
								data: r.error
									? []
									: (r.data ?? []).filter(
											(f) => f.name !== ".emptyFolderPlaceholder",
										),
							})),
					]);

				// Use the higher of the two counts (storage may have files without metadata)
				const storageCount = storageFiles?.length ?? 0;
				const fileCount = Math.max(metaCount ?? 0, storageCount);

				return {
					...folder,
					file_count: fileCount,
				};
			}),
		);

		return NextResponse.json({ folders: foldersWithCounts });
	} catch (error) {
		return handleRouteError(error);
	}
}

export async function POST(req: Request) {
	try {
		await ensureAppPermission("media-library", "manage");

		const body = await parseJsonBody(req, CreateFolderSchema);

		// Generate bucket_name from display_name
		const bucketName = slugify(body.display_name);

		// Create the Supabase storage bucket (public)
		const { error: bucketError } = await supabaseAdmin.storage.createBucket(
			bucketName,
			{ public: true },
		);

		// "already exists" is not a fatal error — the bucket is usable
		if (bucketError && !bucketError.message.includes("already exists")) {
			console.error("[MEDIA_FOLDERS_POST] Bucket creation error:", bucketError);
			return NextResponse.json(
				{ error: `Error al crear el bucket: ${bucketError.message}` },
				{ status: 500 },
			);
		}

		// Insert the media_folders row
		const { data: folder, error: insertError } = await supabaseAdmin
			.from("media_folders")
			.insert({
				bucket_name: bucketName,
				display_name: body.display_name,
				description: body.description ?? "",
			})
			.select()
			.single();

		if (insertError) {
			console.error("[MEDIA_FOLDERS_POST] Insert error:", insertError);
			return NextResponse.json(
				{ error: `Error al crear la carpeta: ${insertError.message}` },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			folder: {
				...folder,
				file_count: 0,
			},
		});
	} catch (error) {
		return handleRouteError(error);
	}
}
