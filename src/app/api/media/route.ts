import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { ensureAppPermission } from "@/shared/auth/permissions";
import { handleRouteError } from "@/shared/api/errors";
import { ListMediaQuerySchema } from "@/domains/media/schemas";
import {
	MAX_FILE_SIZE,
	validateFileType,
	generateStoragePath,
} from "@/domains/media/lib/upload";
import { getPublicUrl } from "@/domains/media/lib/storage";

export async function GET(req: Request) {
	try {
		await ensureAppPermission("media-library", "view");

		// Parse query params
		const url = new URL(req.url);
		const rawParams: Record<string, string> = {};
		for (const [key, value] of url.searchParams.entries()) {
			rawParams[key] = value;
		}

		const query = ListMediaQuerySchema.parse(rawParams);
		const effectivePrefix = query.prefix || "";

		// ── 1. List from Supabase Storage (V2: files + folders) ─────────
		const { data: listData, error: listError } = await supabaseAdmin.storage
			.from(query.bucket)
			.listV2({
				prefix: effectivePrefix,
				limit: query.limit,
				cursor: query.cursor || undefined,
			});

		if (listError) {
			console.error("[MEDIA_GET] Storage list error:", listError);
			return NextResponse.json(
				{ error: "Error al listar los archivos" },
				{ status: 500 },
			);
		}

		const storageObjects = listData?.objects ?? [];
		const subfolders: Array<{ name: string; key: string }> = (
			listData?.folders ?? []
		).map((f) => ({ name: f.name, key: effectivePrefix + f.name }));

		// ── 2. Merge with media_metadata ─────────
		const storagePaths = storageObjects.map((o) => o.name);
		let metadataRows: Array<Record<string, unknown>> = [];
		if (storagePaths.length > 0) {
			const { data: rows } = await supabaseAdmin
				.from("media_metadata")
				.select("*")
				.eq("bucket", query.bucket)
				.in("storage_path", storagePaths);
			metadataRows = (rows as Array<Record<string, unknown>>) ?? [];
		}
		const metadataByPath = new Map(
			metadataRows.map((r) => [r.storage_path as string, r]),
		);

		// ── 3. Build file list (skip Supabase placeholders) ─────────
		let files = storageObjects.reduce((acc, obj) => {
			if (obj.name === ".emptyFolderPlaceholder") return acc;
			const meta = metadataByPath.get(obj.name);
			const { data: publicData } = supabaseAdmin.storage
				.from(query.bucket)
				.getPublicUrl(effectivePrefix + obj.name);

			acc.push({
				id:
					(meta?.id as string) ??
					`orphan::${query.bucket}::${effectivePrefix}${obj.name}`,
				bucket: query.bucket,
				storage_path: effectivePrefix + obj.name,
				title: (meta?.title as string) ?? obj.name,
				alt_text: (meta?.alt_text as string) ?? "",
				caption: (meta?.caption as string) ?? "",
				description: (meta?.description as string) ?? "",
				file_size: (meta?.file_size as number) ?? obj.metadata?.size ?? 0,
				mime_type: (meta?.mime_type as string) ?? obj.metadata?.mimetype ?? "",
				dimensions: (meta?.dimensions as string) ?? "",
				url: publicData.publicUrl,
				uploaded_by: (meta?.uploaded_by as string) ?? null,
				created_at:
					(meta?.created_at as string) ??
					obj.created_at ??
					new Date().toISOString(),
				updated_at:
					(meta?.updated_at as string) ??
					obj.updated_at ??
					new Date().toISOString(),
			});
			return acc;
		}, [] as any[]);

		// ── 4. Apply type + search filters ─────────
		if (query.type === "image") {
			files = files.filter((f) => f.mime_type.startsWith("image/"));
		} else if (query.type === "document") {
			files = files.filter(
				(f) =>
					f.mime_type.startsWith("application/") ||
					f.mime_type.startsWith("text/"),
			);
		}
		if (query.search) {
			const s = query.search.toLowerCase();
			files = files.filter(
				(f) =>
					f.title.toLowerCase().includes(s) ||
					f.storage_path.toLowerCase().includes(s),
			);
		}

		// ── 5. Pagination ─────────
		const hasMore = listData?.hasNext ?? false;
		const nextCursor = listData?.nextCursor ?? null;

		return NextResponse.json({
			files,
			subfolders,
			nextCursor: hasMore ? nextCursor : null,
		});
	} catch (error) {
		return handleRouteError(error);
	}
}

export async function POST(req: Request) {
	try {
		await ensureAppPermission("media-library", "edit");

		// Manual validation — follows news/upload pattern exactly
		let rawBody: unknown;
		try {
			rawBody = await req.json();
		} catch {
			return NextResponse.json(
				{ error: "Cuerpo JSON inválido o faltante" },
				{ status: 400 },
			);
		}

		// Reject null, arrays, and primitive values — only plain objects allowed
		if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
			return NextResponse.json(
				{ error: "Cuerpo JSON inválido o faltante" },
				{ status: 400 },
			);
		}

		const { fileName, mimeType, fileSize, bucket } = rawBody as Record<
			string,
			unknown
		>;

		if (!fileName || typeof fileName !== "string") {
			return NextResponse.json(
				{ error: "Falta el nombre del archivo (fileName)" },
				{ status: 400 },
			);
		}

		if (!mimeType || typeof mimeType !== "string") {
			return NextResponse.json(
				{ error: "Falta el tipo de archivo (mimeType)" },
				{ status: 400 },
			);
		}

		// fileSize must be a finite positive integer
		if (
			typeof fileSize !== "number" ||
			!Number.isFinite(fileSize) ||
			!Number.isInteger(fileSize) ||
			fileSize <= 0
		) {
			return NextResponse.json(
				{ error: "El archivo está vacío o tiene un tamaño inválido" },
				{ status: 400 },
			);
		}

		if (!bucket || typeof bucket !== "string") {
			return NextResponse.json(
				{ error: "Falta la carpeta de destino (bucket)" },
				{ status: 400 },
			);
		}

		// Validate bucket exists in media_folders
		const { data: folder } = await supabaseAdmin
			.from("media_folders")
			.select("bucket_name")
			.eq("bucket_name", bucket)
			.maybeSingle();

		if (!folder) {
			return NextResponse.json(
				{ error: `Carpeta "${bucket}" no encontrada` },
				{ status: 400 },
			);
		}

		// Validate MIME type against per-bucket allowlist
		const typeResult = validateFileType(bucket, mimeType);
		if (!typeResult.valid) {
			return NextResponse.json({ error: typeResult.error! }, { status: 400 });
		}

		// Validate file size against max
		if (fileSize > MAX_FILE_SIZE) {
			return NextResponse.json(
				{
					error: `El archivo excede el límite de 50 MB (${(fileSize / 1024 / 1024).toFixed(1)} MB)`,
				},
				{ status: 400 },
			);
		}

		// Generate storage path and signed upload URL
		const filePath = generateStoragePath(bucket, fileName);

		const { data: signedData, error: signedError } = await supabaseAdmin.storage
			.from(bucket)
			.createSignedUploadUrl(filePath);

		if (signedError) {
			console.error("[MEDIA_UPLOAD] Signed URL error:", signedError);
			return NextResponse.json(
				{ error: "Error al generar la autorización de subida" },
				{ status: 500 },
			);
		}

		const publicUrl = getPublicUrl(bucket, filePath);

		return NextResponse.json({
			path: signedData.path ?? filePath,
			token: signedData.token,
			signedUrl: signedData.signedUrl,
			publicUrl,
		});
	} catch (error: unknown) {
		console.error("[MEDIA_UPLOAD]", error);
		// Preserve ApiError status codes from ensureAppPermission
		if (
			error instanceof Error &&
			"status" in error &&
			typeof (error as { status: unknown }).status === "number"
		) {
			const status = (error as { status: number }).status;
			if (status >= 400 && status < 500) {
				return NextResponse.json({ error: error.message }, { status });
			}
		}
		const message =
			error instanceof Error ? error.message : "Error interno del servidor";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
