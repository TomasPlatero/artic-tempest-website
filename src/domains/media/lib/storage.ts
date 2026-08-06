import { supabaseAdmin } from "@/shared/lib/supabase-admin";
const BATCH_SIZE = 50;

/**
 * Sanitize a storage path to prevent path traversal attacks.
 * Rejects paths containing `..` segments or absolute-path prefixes
 * that could escape the intended bucket folder.
 */
export function sanitizePath(filePath: string): string {
	// Decode URL-encoded sequences first (catches %2e%2e%2f style attacks)
	let decoded: string;
	try {
		decoded = decodeURIComponent(filePath);
	} catch {
		throw new Error("Ruta de archivo inválida");
	}

	// Normalize slashes and strip leading/trailing whitespace
	const normalized = decoded.trim().replace(/\\/g, "/");

	// Reject empty paths
	if (normalized.length === 0) {
		throw new Error("La ruta del archivo no puede estar vacía");
	}

	// Split into segments and validate each one
	const segments = normalized.split("/");
	for (const segment of segments) {
		// Reject ".." (parent directory traversal)
		if (segment === "..") {
			throw new Error("Ruta de archivo no permitida");
		}
		// Reject "." segments in non-trivial paths (rarely valid, often suspicious)
		if (segment === "." && segments.length > 1) {
			throw new Error("Ruta de archivo no permitida");
		}
	}

	// Reject absolute paths (leading / after normalization)
	if (normalized.startsWith("/")) {
		throw new Error("Ruta de archivo no permitida");
	}

	return normalized;
}

export async function createSignedUploadUrl(
	bucket: string,
	filePath: string,
): Promise<{ path: string; token: string; signedUrl: string }> {
	const safePath = sanitizePath(filePath);

	const { data, error } = await supabaseAdmin.storage
		.from(bucket)
		.createSignedUploadUrl(safePath);

	if (error) throw new Error(error.message);
	if (!data?.signedUrl) {
		throw new Error("No se pudo generar la URL firmada");
	}

	return {
		path: data.path ?? safePath,
		token: data.token,
		signedUrl: data.signedUrl,
	};
}

export function getPublicUrl(bucket: string, filePath: string): string {
	const safePath = sanitizePath(filePath);
	const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(safePath);
	return data.publicUrl;
}

export async function deleteFile(
	bucket: string,
	filePath: string,
): Promise<void> {
	const safePath = sanitizePath(filePath);
	const { error } = await supabaseAdmin.storage.from(bucket).remove([safePath]);

	if (error) throw new Error(error.message);
}

export async function moveFile(
	bucket: string,
	oldPath: string,
	newPath: string,
): Promise<void> {
	const safeOld = sanitizePath(oldPath);
	const safeNew = sanitizePath(newPath);

	const { error } = await supabaseAdmin.storage
		.from(bucket)
		.move(safeOld, safeNew);

	if (error) throw new Error(error.message);
}

export async function bulkDelete(
	bucket: string,
	paths: string[],
): Promise<{
	success: boolean;
	processed: number;
	errors?: string[];
}> {
	if (paths.length === 0) {
		return { success: true, processed: 0 };
	}

	const safePaths = paths.map((p) => sanitizePath(p));

	const batches: string[][] = [];
	for (let i = 0; i < safePaths.length; i += BATCH_SIZE) {
		batches.push(safePaths.slice(i, i + BATCH_SIZE));
	}

	const results = await Promise.all(
		batches.map(async (batch) => {
			const { error } = await supabaseAdmin.storage.from(bucket).remove(batch);
			if (error) {
				return {
					ok: false as const,
					error: `Error eliminando lote: ${error.message}`,
					count: 0,
				};
			}
			return { ok: true as const, count: batch.length };
		}),
	);

	let processed = 0;
	const errorMessages: string[] = [];
	for (const r of results) {
		if (!r.ok) errorMessages.push(r.error);
		processed += r.count;
	}

	return {
		success: errorMessages.length === 0,
		processed,
		errors: errorMessages.length > 0 ? errorMessages : undefined,
	};
}
