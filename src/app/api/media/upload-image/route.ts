import { NextResponse } from "next/server";
import sharp from "sharp";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { ensureAppPermission } from "@/shared/auth/permissions";
import { handleRouteError } from "@/shared/api/errors";
import {
	validateFileType,
	generateStoragePath,
	getExtension,
} from "@/domains/media/lib/upload";
import { getPublicUrl } from "@/domains/media/lib/storage";

/**
 * POST /api/media/upload-image
 *
 * Sube una imagen, la convierte a WebP con sharp (quality:80, effort:6, alphaQuality:85)
 * y la almacena directamente en Supabase Storage + registra metadatos.
 *
 * Body: multipart/form-data con campos:
 *   - file: Blob (la imagen)
 *   - bucket: string (carpeta destino en Supabase Storage)
 *   - title?: string
 */
export async function POST(req: Request) {
	try {
		await ensureAppPermission("media-library", "edit");

		// ── 1. Parsear multipart/form-data ───────
		let formData: FormData;
		try {
			formData = await req.formData();
		} catch {
			return NextResponse.json(
				{ error: "Body inválido. Envía multipart/form-data." },
				{ status: 400 },
			);
		}

		const fileField = formData.get("file");
		if (!fileField || !(fileField instanceof Blob)) {
			return NextResponse.json(
				{ error: "Falta el campo 'file' con el archivo de imagen" },
				{ status: 400 },
			);
		}

		const bucket = formData.get("bucket");
		if (!bucket || typeof bucket !== "string") {
			return NextResponse.json(
				{ error: "Falta la carpeta de destino (bucket)" },
				{ status: 400 },
			);
		}

		const title = formData.get("title");
		const customTitle = title && typeof title === "string" ? title : undefined;

		// ── 2. Validar bucket ────────────────────
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

		// ── 3. Leer buffer original ──────────────
		const originalBuffer = Buffer.from(await fileField.arrayBuffer());
		const originalMimeType = fileField.type || "application/octet-stream";
		const originalFileName = fileField.name || "imagen";

		// ── 4. Validar tipo de archivo ───────────
		const typeResult = validateFileType(bucket, originalMimeType);
		if (!typeResult.valid) {
			return NextResponse.json({ error: typeResult.error! }, { status: 400 });
		}

		// ── 5. Validar tamaño (máx 50 MB) ────────
		if (originalBuffer.length > 50 * 1024 * 1024) {
			return NextResponse.json(
				{
					error: `El archivo excede el límite de 50 MB (${(originalBuffer.length / 1024 / 1024).toFixed(1)} MB)`,
				},
				{ status: 400 },
			);
		}

		// ── 6. Convertir a WebP con sharp ────────
		const isConvertibleImage = [
			"image/jpeg",
			"image/png",
			"image/webp",
			"image/avif",
			"image/gif",
			"image/bmp",
			"image/tiff",
		].includes(originalMimeType);

		let finalBuffer: Buffer;
		let finalMimeType: string;
		let finalExtension: string;
		let dimensions: string;

		if (isConvertibleImage) {
			const img = sharp(originalBuffer);
			const metadata = await img.metadata();

			dimensions = `${metadata.width ?? 0}x${metadata.height ?? 0}`;

			// Detectar si la imagen original tiene transparencia (alpha channel)
			const hasAlpha = metadata.channels === 4 || metadata.hasAlpha;

			finalBuffer = await img
				.webp({
					quality: 80,
					effort: 6,
					alphaQuality: hasAlpha ? 85 : undefined,
				})
				.toBuffer();

			finalMimeType = "image/webp";
			finalExtension = ".webp";

			console.log(
				`[MEDIA_UPLOAD_IMAGE] Converted ${originalFileName} (${(originalBuffer.length / 1024).toFixed(0)}KB → ${(finalBuffer.length / 1024).toFixed(0)}KB, alpha: ${hasAlpha})`,
			);
		} else {
			// No es una imagen convertible — subir tal cual
			const meta = await sharp(originalBuffer)
				.metadata()
				.catch(() => null);
			dimensions = meta ? `${meta.width ?? 0}x${meta.height ?? 0}` : "";
			finalBuffer = originalBuffer;
			finalMimeType = originalMimeType;
			finalExtension = getExtension(originalFileName, originalMimeType);
		}

		// ── 7. Generar path y subir a Supabase ───
		const storagePath = generateStoragePath(bucket, `image${finalExtension}`);

		// Belt-and-suspenders: reject path traversal even though generateStoragePath is safe
		if (storagePath.includes("..") || bucket.includes("..")) {
			return NextResponse.json(
				{ error: "Invalid storage path" },
				{ status: 400 },
			);
		}

		const { error: uploadError } = await supabaseAdmin.storage
			.from(bucket)
			.upload(storagePath, finalBuffer, {
				contentType: finalMimeType,
				cacheControl: "public, max-age=31536000, immutable",
				upsert: false,
			});

		if (uploadError) {
			console.error("[MEDIA_UPLOAD_IMAGE] Storage upload error:", uploadError);
			return NextResponse.json(
				{ error: `Error al subir a Supabase: ${uploadError.message}` },
				{ status: 500 },
			);
		}

		// ── 8. Registrar metadatos ────────────────
		const { data: fileRecord, error: insertError } = await supabaseAdmin
			.from("media_metadata")
			.insert({
				bucket,
				storage_path: storagePath,
				file_size: finalBuffer.length,
				mime_type: finalMimeType,
				title: customTitle ?? originalFileName.replace(/\.[^.]+$/, ""),
				alt_text: "",
				dimensions,
			})
			.select()
			.single();

		if (insertError) {
			console.error("[MEDIA_UPLOAD_IMAGE] Metadata insert error:", insertError);
			// Intentar limpiar el archivo subido
			await supabaseAdmin.storage.from(bucket).remove([storagePath]);
			return NextResponse.json(
				{ error: `Error al registrar metadatos: ${insertError.message}` },
				{ status: 500 },
			);
		}

		const publicUrl = getPublicUrl(bucket, storagePath);

		return NextResponse.json({
			file: {
				...fileRecord,
				url: publicUrl,
			},
		});
	} catch (error) {
		console.error("[MEDIA_UPLOAD_IMAGE]", error);
		return handleRouteError(error);
	}
}
