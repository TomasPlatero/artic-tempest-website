import type { MediaFolder } from "../types";

/**
 * Converts a display name into a valid bucket_name:
 * - lowercase
 * - spaces → hyphens
 * - normalize accents
 * - strip special characters
 * - collapse multiple hyphens
 * - trim leading/trailing hyphens
 * - truncate to 100 chars
 * - append a random 4-char suffix for collision safety
 */
export function slugify(name: string): string {
	let slug = name
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "") // remove special chars
		.trim()
		.replace(/\s+/g, "-") // spaces → hyphens
		.replace(/-+/g, "-") // collapse multiple hyphens
		.replace(/^-+/, "") // trim leading hyphens
		.replace(/-+$/, ""); // trim trailing hyphens

	// If the result is empty, use a placeholder
	if (!slug) {
		slug = "carpeta";
	}

	// Truncate to leave room for the random suffix
	const maxBase = 95;
	if (slug.length > maxBase) {
		slug = slug.slice(0, maxBase);
	}

	// Append random 4-char suffix for collision safety
	const suffix = Math.random().toString(36).slice(2, 6);
	return `${slug}-${suffix}`;
}

export function isSystemFolder(folder: MediaFolder): boolean {
	return folder.is_system === true;
}

export function canDeleteFolder(folder: MediaFolder): boolean {
	return !isSystemFolder(folder);
}

export function canEditBucketName(folder: MediaFolder): boolean {
	return !isSystemFolder(folder);
}
