import { supabaseAdmin } from "@/shared/lib/supabase-admin";
const BATCH_SIZE = 50;

export async function createSignedUploadUrl(
	bucket: string,
	filePath: string,
): Promise<{ path: string; token: string; signedUrl: string }> {
	const { data, error } = await supabaseAdmin.storage
		.from(bucket)
		.createSignedUploadUrl(filePath);

	if (error) throw new Error(error.message);
	if (!data?.signedUrl) {
		throw new Error("No se pudo generar la URL firmada");
	}

	return {
		path: data.path ?? filePath,
		token: data.token,
		signedUrl: data.signedUrl,
	};
}

export function getPublicUrl(bucket: string, filePath: string): string {
	const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
	return data.publicUrl;
}

export async function deleteFile(
	bucket: string,
	filePath: string,
): Promise<void> {
	const { error } = await supabaseAdmin.storage.from(bucket).remove([filePath]);

	if (error) throw new Error(error.message);
}

export async function moveFile(
	bucket: string,
	oldPath: string,
	newPath: string,
): Promise<void> {
	const { error } = await supabaseAdmin.storage
		.from(bucket)
		.move(oldPath, newPath);

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

	const batches: string[][] = [];
	for (let i = 0; i < paths.length; i += BATCH_SIZE) {
		batches.push(paths.slice(i, i + BATCH_SIZE));
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
