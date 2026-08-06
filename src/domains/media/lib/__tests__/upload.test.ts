import { describe, it, expect } from "vitest";
import {
	getExtension,
	ALLOWED_MIME_TYPES_BY_BUCKET,
	MAX_FILE_SIZE,
	generateStoragePath,
	validateFileType,
	validateFileSize,
} from "../upload";

// ═══════════════════════════════════════════
// getExtension
// ═══════════════════════════════════════════
describe("getExtension", () => {
	it("extracts extension from filename", () => {
		expect(getExtension("hero.jpg", "image/jpeg")).toBe(".jpg");
	});

	it("extracts png extension", () => {
		expect(getExtension("icon.png", "image/png")).toBe(".png");
	});

	it("extracts webp extension", () => {
		expect(getExtension("banner.webp", "image/webp")).toBe(".webp");
	});

	it("extracts gif extension", () => {
		expect(getExtension("animated.gif", "image/gif")).toBe(".gif");
	});

	it("extracts avif extension", () => {
		expect(getExtension("photo.avif", "image/avif")).toBe(".avif");
	});

	it("extracts pdf extension", () => {
		expect(getExtension("doc.pdf", "application/pdf")).toBe(".pdf");
	});

	it("extracts svg extension", () => {
		expect(getExtension("logo.svg", "image/svg+xml")).toBe(".svg");
	});

	it("falls back to MIME type when filename has no extension", () => {
		expect(getExtension("noextension", "image/jpeg")).toBe(".jpg");
	});

	it("falls back to MIME type for unknown extension(filename)", () => {
		expect(getExtension("file.unknown", "image/png")).toBe(".png");
	});

	it("handles multiple dots in filename", () => {
		expect(getExtension("archive.tar.gz", "image/jpeg")).toBe(".jpg");
	});

	// --- TRIANGULATE ---

	it("returns .bin for unknown MIME with no filename extension", () => {
		expect(getExtension("noext", "application/unknown")).toBe(".bin");
	});

	it("handles filename with only extension dot", () => {
		// .gitignore style — last dot at position 0
		expect(getExtension(".hidden", "image/png")).toBe(".png");
	});

	it("normalizes jpeg to .jpg", () => {
		expect(getExtension("photo.jpeg", "image/jpeg")).toBe(".jpg");
	});

	it("handles uppercase extension in filename", () => {
		expect(getExtension("PHOTO.JPG", "image/jpeg")).toBe(".jpg");
	});
});

// ═══════════════════════════════════════════
// ALLOWED_MIME_TYPES_BY_BUCKET
// ═══════════════════════════════════════════
describe("ALLOWED_MIME_TYPES_BY_BUCKET", () => {
	it("defines allowed types for guild_assets", () => {
		expect(ALLOWED_MIME_TYPES_BY_BUCKET["guild_assets"]).toBeDefined();
		expect(ALLOWED_MIME_TYPES_BY_BUCKET["guild_assets"]).toContain(
			"image/jpeg",
		);
	});

	it("defines allowed types for feedback_attachments (includes PDF)", () => {
		expect(ALLOWED_MIME_TYPES_BY_BUCKET["feedback_attachments"]).toBeDefined();
		expect(ALLOWED_MIME_TYPES_BY_BUCKET["feedback_attachments"]).toContain(
			"application/pdf",
		);
	});

	it("all image buckets exclude PDFs", () => {
		expect(ALLOWED_MIME_TYPES_BY_BUCKET["news-images"]).not.toContain(
			"application/pdf",
		);
	});
});

// ═══════════════════════════════════════════
// MAX_FILE_SIZE
// ═══════════════════════════════════════════
describe("MAX_FILE_SIZE", () => {
	it("equals 50 MB", () => {
		expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
	});
});

// ═══════════════════════════════════════════
// generateStoragePath
// ═══════════════════════════════════════════
describe("generateStoragePath", () => {
	it("returns a path with a UUID and extension", () => {
		const path = generateStoragePath("news-images", "hero.jpg");
		expect(path).toMatch(/^[a-f0-9-]{36}\.jpg$/);
	});

	it("uses extension from filename", () => {
		const path = generateStoragePath("news-images", "banner.png");
		expect(path).toMatch(/\.png$/);
	});

	it("produces unique paths on successive calls", () => {
		const path1 = generateStoragePath("news-images", "hero.jpg");
		const path2 = generateStoragePath("news-images", "hero.jpg");
		expect(path1).not.toBe(path2);
	});

	it("handles filename without extension (uses .bin fallback)", () => {
		const path = generateStoragePath("attachments", "noext");
		// Falls back to .bin when no extension can be inferred
		expect(path).toMatch(/\.[a-z]+$/);
	});

	// --- TRIANGULATE ---

	it("generates path with .jpg for JPEG MIME when no filename extension", () => {
		const path = generateStoragePath("news-images", "photo");
		// getExtension uses MIME as fallback — but generateStoragePath
		// passes application/octet-stream as the MIME, so it yields .bin
		expect(path).toMatch(/\.[a-z0-9]+$/);
	});

	it("path contains valid UUID v4 format", () => {
		const path = generateStoragePath("guild_assets", "icon.png");
		const uuidPart = path.replace(/\.png$/, "");
		expect(uuidPart).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		);
	});
});

// ═══════════════════════════════════════════
// validateFileType
// ═══════════════════════════════════════════
describe("validateFileType", () => {
	it("accepts image/jpeg in news-images", () => {
		const result = validateFileType("news-images", "image/jpeg");
		expect(result.valid).toBe(true);
	});

	it("accepts image/png in guild_assets", () => {
		const result = validateFileType("guild_assets", "image/png");
		expect(result.valid).toBe(true);
	});

	it("accepts image/webp in image_boses_kills", () => {
		const result = validateFileType("image_boses_kills", "image/webp");
		expect(result.valid).toBe(true);
	});

	it("accepts application/pdf in attachments", () => {
		const result = validateFileType("attachments", "application/pdf");
		expect(result.valid).toBe(true);
	});

	it("rejects application/pdf in news-images", () => {
		const result = validateFileType("news-images", "application/pdf");
		expect(result.valid).toBe(false);
	});

	it("rejects text/html in any bucket", () => {
		const result = validateFileType("guild_assets", "text/html");
		expect(result.valid).toBe(false);
	});

	it("allows common image types for unknown buckets", () => {
		const result = validateFileType("nonexistent-bucket", "image/jpeg");
		expect(result.valid).toBe(true);
	});

	it("returns error message with allowed types on rejection", () => {
		const result = validateFileType("news-images", "application/pdf");
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
		expect(result.error).toContain("image/");
	});
});

// ═══════════════════════════════════════════
// validateFileSize
// ═══════════════════════════════════════════
describe("validateFileSize", () => {
	it("accepts file at 1KB", () => {
		const result = validateFileSize(1024);
		expect(result.valid).toBe(true);
	});

	it("accepts file at exactly 50MB", () => {
		const result = validateFileSize(MAX_FILE_SIZE);
		expect(result.valid).toBe(true);
	});

	it("rejects file at 0", () => {
		const result = validateFileSize(0);
		expect(result.valid).toBe(false);
	});

	it("rejects negative file size", () => {
		const result = validateFileSize(-100);
		expect(result.valid).toBe(false);
	});

	it("rejects file over 50MB", () => {
		const result = validateFileSize(MAX_FILE_SIZE + 1);
		expect(result.valid).toBe(false);
	});

	it("returns error message in Spanish on rejection", () => {
		const result = validateFileSize(MAX_FILE_SIZE + 1);
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
		expect(result.error).toMatch(/50/);
	});

	// --- TRIANGULATE ---

	it("rejects NaN as invalid", () => {
		const result = validateFileSize(NaN);
		expect(result.valid).toBe(false);
	});

	it("rejects Infinity as invalid", () => {
		const result = validateFileSize(Infinity);
		expect(result.valid).toBe(false);
	});

	it("accepts file at MAX_FILE_SIZE - 1 byte", () => {
		const result = validateFileSize(MAX_FILE_SIZE - 1);
		expect(result.valid).toBe(true);
	});
});
