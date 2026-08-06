import { describe, it, expect } from "vitest";
import {
	CreateFolderSchema,
	UpdateFolderSchema,
	SignedUploadSchema,
	UpdateMetadataSchema,
	RenameFileSchema,
	ListMediaQuerySchema,
	BulkDeleteQuerySchema,
} from "../../schemas";

// ═══════════════════════════════════════════
// CreateFolderSchema
// ═══════════════════════════════════════════
describe("CreateFolderSchema", () => {
	it("accepts valid input with display_name only", () => {
		const result = CreateFolderSchema.safeParse({ display_name: "Mi Carpeta" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.display_name).toBe("Mi Carpeta");
			expect(result.data.description).toBe("");
		}
	});

	it("accepts valid input with display_name and description", () => {
		const result = CreateFolderSchema.safeParse({
			display_name: "Mi Carpeta",
			description: "Una descripción",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty display_name", () => {
		const result = CreateFolderSchema.safeParse({ display_name: "" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].path).toContain("display_name");
		}
	});

	it("rejects missing display_name", () => {
		const result = CreateFolderSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it("rejects display_name longer than 100 chars", () => {
		const result = CreateFolderSchema.safeParse({
			display_name: "x".repeat(101),
		});
		expect(result.success).toBe(false);
	});

	it("accepts display_name at exactly 100 chars", () => {
		const result = CreateFolderSchema.safeParse({
			display_name: "x".repeat(100),
		});
		expect(result.success).toBe(true);
	});

	it("defaults description to empty string when omitted", () => {
		const result = CreateFolderSchema.safeParse({ display_name: "Test" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.description).toBe("");
		}
	});

	it("rejects description longer than 500 chars", () => {
		const result = CreateFolderSchema.safeParse({
			display_name: "Test",
			description: "x".repeat(501),
		});
		expect(result.success).toBe(false);
	});

	it("accepts special chars in display_name (ñ, accents)", () => {
		const result = CreateFolderSchema.safeParse({
			display_name: "Carpeta Cañón con tildes áéíóú",
		});
		expect(result.success).toBe(true);
	});

	it("accepts display_name with emojis", () => {
		const result = CreateFolderSchema.safeParse({
			display_name: "🎉 Eventos Especiales 🎉",
		});
		expect(result.success).toBe(true);
	});

	// --- TRIANGULATE ---

	it("accepts display_name with only whitespace (handler trims)", () => {
		const result = CreateFolderSchema.safeParse({ display_name: "   " });
		expect(result.success).toBe(true);
	});

	it("accepts display_name with quotes", () => {
		const result = CreateFolderSchema.safeParse({
			display_name: "La 'mejor' carpeta del \"clan\"",
		});
		expect(result.success).toBe(true);
	});

	it("accepts display_name with forward slashes", () => {
		const result = CreateFolderSchema.safeParse({
			display_name: "Noticias/Eventos",
		});
		expect(result.success).toBe(true);
	});
});

// ═══════════════════════════════════════════
// UpdateFolderSchema
// ═══════════════════════════════════════════
describe("UpdateFolderSchema", () => {
	it("accepts valid input with all optional fields", () => {
		const result = UpdateFolderSchema.safeParse({
			display_name: "Nuevo Nombre",
			description: "Nueva descripción",
			sort_order: 3,
		});
		expect(result.success).toBe(true);
	});

	it("accepts empty object (all fields optional)", () => {
		const result = UpdateFolderSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("accepts partial update with only display_name", () => {
		const result = UpdateFolderSchema.safeParse({
			display_name: "Solo nombre",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty display_name", () => {
		const result = UpdateFolderSchema.safeParse({ display_name: "" });
		expect(result.success).toBe(false);
	});

	it("rejects sort_order less than 0", () => {
		const result = UpdateFolderSchema.safeParse({ sort_order: -1 });
		expect(result.success).toBe(false);
	});

	it("accepts sort_order of 0", () => {
		const result = UpdateFolderSchema.safeParse({ sort_order: 0 });
		expect(result.success).toBe(true);
	});

	it("rejects non-integer sort_order", () => {
		const result = UpdateFolderSchema.safeParse({ sort_order: 1.5 });
		expect(result.success).toBe(false);
	});

	// --- TRIANGULATE ---

	it("rejects description longer than 500 chars", () => {
		const result = UpdateFolderSchema.safeParse({
			description: "x".repeat(501),
		});
		expect(result.success).toBe(false);
	});

	it("accepts sort_order at max safe integer", () => {
		const result = UpdateFolderSchema.safeParse({
			sort_order: Number.MAX_SAFE_INTEGER,
		});
		expect(result.success).toBe(true);
	});
});

// ═══════════════════════════════════════════
// SignedUploadSchema
// ═══════════════════════════════════════════
describe("SignedUploadSchema", () => {
	it("accepts valid upload input", () => {
		const result = SignedUploadSchema.safeParse({
			fileName: "hero.webp",
			mimeType: "image/webp",
			fileSize: 1024000,
			bucket: "news-images",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty fileName", () => {
		const result = SignedUploadSchema.safeParse({
			fileName: "",
			mimeType: "image/webp",
			fileSize: 1024,
			bucket: "news-images",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty mimeType", () => {
		const result = SignedUploadSchema.safeParse({
			fileName: "test.png",
			mimeType: "",
			fileSize: 1024,
			bucket: "news-images",
		});
		expect(result.success).toBe(false);
	});

	it("rejects zero fileSize", () => {
		const result = SignedUploadSchema.safeParse({
			fileName: "test.png",
			mimeType: "image/png",
			fileSize: 0,
			bucket: "news-images",
		});
		expect(result.success).toBe(false);
	});

	it("rejects negative fileSize", () => {
		const result = SignedUploadSchema.safeParse({
			fileName: "test.png",
			mimeType: "image/png",
			fileSize: -100,
			bucket: "news-images",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty bucket", () => {
		const result = SignedUploadSchema.safeParse({
			fileName: "test.png",
			mimeType: "image/png",
			fileSize: 1024,
			bucket: "",
		});
		expect(result.success).toBe(false);
	});

	it("accepts large file at 50MB boundary", () => {
		const result = SignedUploadSchema.safeParse({
			fileName: "big.bin",
			mimeType: "application/pdf",
			fileSize: 50 * 1024 * 1024, // 50 MB
			bucket: "attachments",
		});
		expect(result.success).toBe(true);
	});

	// --- TRIANGULATE ---

	it("rejects float fileSize", () => {
		const result = SignedUploadSchema.safeParse({
			fileName: "test.png",
			mimeType: "image/png",
			fileSize: 1024.5,
			bucket: "news-images",
		});
		expect(result.success).toBe(false);
	});

	it("accepts fileName with multiple dots", () => {
		const result = SignedUploadSchema.safeParse({
			fileName: "my.file.name.jpg",
			mimeType: "image/jpeg",
			fileSize: 1024,
			bucket: "news-images",
		});
		expect(result.success).toBe(true);
	});

	it("accepts fileName with spaces", () => {
		const result = SignedUploadSchema.safeParse({
			fileName: "my hero image.png",
			mimeType: "image/png",
			fileSize: 1024,
			bucket: "news-images",
		});
		expect(result.success).toBe(true);
	});

	it("accepts fileName with spanish accents", () => {
		const result = SignedUploadSchema.safeParse({
			fileName: "cañón-épico.png",
			mimeType: "image/png",
			fileSize: 1024,
			bucket: "news-images",
		});
		expect(result.success).toBe(true);
	});
});

// ═══════════════════════════════════════════
// UpdateMetadataSchema
// ═══════════════════════════════════════════
describe("UpdateMetadataSchema", () => {
	it("accepts valid metadata update", () => {
		const result = UpdateMetadataSchema.safeParse({
			title: "Hero Image",
			alt_text: "A beautiful hero image",
		});
		expect(result.success).toBe(true);
	});

	it("accepts empty object (all optional)", () => {
		const result = UpdateMetadataSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("rejects title longer than 255 chars", () => {
		const result = UpdateMetadataSchema.safeParse({
			title: "x".repeat(256),
		});
		expect(result.success).toBe(false);
	});

	it("accepts title at exactly 255 chars", () => {
		const result = UpdateMetadataSchema.safeParse({
			title: "x".repeat(255),
		});
		expect(result.success).toBe(true);
	});

	it("rejects alt_text longer than 500 chars", () => {
		const result = UpdateMetadataSchema.safeParse({
			alt_text: "x".repeat(501),
		});
		expect(result.success).toBe(false);
	});

	it("rejects caption longer than 1000 chars", () => {
		const result = UpdateMetadataSchema.safeParse({
			caption: "x".repeat(1001),
		});
		expect(result.success).toBe(false);
	});

	it("rejects description longer than 2000 chars", () => {
		const result = UpdateMetadataSchema.safeParse({
			description: "x".repeat(2001),
		});
		expect(result.success).toBe(false);
	});

	it("accepts all fields at boundary", () => {
		const result = UpdateMetadataSchema.safeParse({
			title: "x".repeat(255),
			alt_text: "x".repeat(500),
			caption: "x".repeat(1000),
			description: "x".repeat(2000),
		});
		expect(result.success).toBe(true);
	});
});

// ═══════════════════════════════════════════
// RenameFileSchema
// ═══════════════════════════════════════════
describe("RenameFileSchema", () => {
	it("accepts valid new name", () => {
		const result = RenameFileSchema.safeParse({ newName: "hero-banner.webp" });
		expect(result.success).toBe(true);
	});

	it("rejects empty newName", () => {
		const result = RenameFileSchema.safeParse({ newName: "" });
		expect(result.success).toBe(false);
	});

	it("rejects newName longer than 255 chars", () => {
		const result = RenameFileSchema.safeParse({
			newName: "x".repeat(256),
		});
		expect(result.success).toBe(false);
	});

	it("accepts newName at exactly 255 chars", () => {
		const result = RenameFileSchema.safeParse({
			newName: "x".repeat(255),
		});
		expect(result.success).toBe(true);
	});

	it("accepts newName with special characters (underscores, hyphens)", () => {
		const result = RenameFileSchema.safeParse({
			newName: "my_file-2024_final.jpg",
		});
		expect(result.success).toBe(true);
	});

	// --- TRIANGULATE ---

	it("accepts newName without extension", () => {
		const result = RenameFileSchema.safeParse({ newName: "just-a-name" });
		expect(result.success).toBe(true);
	});

	it("accepts newName with only dots", () => {
		const result = RenameFileSchema.safeParse({ newName: "...hidden" });
		expect(result.success).toBe(true);
	});
});

// ═══════════════════════════════════════════
// ListMediaQuerySchema
// ═══════════════════════════════════════════
describe("ListMediaQuerySchema", () => {
	it("accepts valid query with bucket only", () => {
		const result = ListMediaQuerySchema.safeParse({ bucket: "news-images" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.type).toBe("all");
			expect(result.data.limit).toBe(50);
		}
	});

	it("rejects missing bucket", () => {
		const result = ListMediaQuerySchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it("accepts type 'image'", () => {
		const result = ListMediaQuerySchema.safeParse({
			bucket: "news-images",
			type: "image",
		});
		expect(result.success).toBe(true);
	});

	it("accepts type 'document'", () => {
		const result = ListMediaQuerySchema.safeParse({
			bucket: "attachments",
			type: "document",
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid type", () => {
		const result = ListMediaQuerySchema.safeParse({
			bucket: "news-images",
			type: "video",
		});
		expect(result.success).toBe(false);
	});

	it("accepts search param", () => {
		const result = ListMediaQuerySchema.safeParse({
			bucket: "news-images",
			search: "hero",
		});
		expect(result.success).toBe(true);
	});

	it("rejects search longer than 200 chars", () => {
		const result = ListMediaQuerySchema.safeParse({
			bucket: "news-images",
			search: "x".repeat(201),
		});
		expect(result.success).toBe(false);
	});

	it("accepts cursor param", () => {
		const result = ListMediaQuerySchema.safeParse({
			bucket: "news-images",
			cursor: "eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0wMSJ9",
		});
		expect(result.success).toBe(true);
	});

	it("coerces string limit to number", () => {
		const result = ListMediaQuerySchema.safeParse({
			bucket: "news-images",
			limit: "25",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.limit).toBe(25);
		}
	});

	it("rejects limit > 100", () => {
		const result = ListMediaQuerySchema.safeParse({
			bucket: "news-images",
			limit: 101,
		});
		expect(result.success).toBe(false);
	});

	it("rejects limit < 1", () => {
		const result = ListMediaQuerySchema.safeParse({
			bucket: "news-images",
			limit: 0,
		});
		expect(result.success).toBe(false);
	});

	it("defaults type to 'all'", () => {
		const result = ListMediaQuerySchema.safeParse({
			bucket: "news-images",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.type).toBe("all");
		}
	});
});

// ═══════════════════════════════════════════
// BulkDeleteQuerySchema
// ═══════════════════════════════════════════
describe("BulkDeleteQuerySchema", () => {
	it("accepts a single id", () => {
		const result = BulkDeleteQuerySchema.safeParse({
			ids: "550e8400-e29b-41d4-a716-446655440000",
		});
		expect(result.success).toBe(true);
	});

	it("accepts comma-separated ids", () => {
		const result = BulkDeleteQuerySchema.safeParse({
			ids: "550e8400-e29b-41d4-a716-446655440000,660e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty ids string", () => {
		const result = BulkDeleteQuerySchema.safeParse({ ids: "" });
		expect(result.success).toBe(false);
	});

	it("rejects missing ids", () => {
		const result = BulkDeleteQuerySchema.safeParse({});
		expect(result.success).toBe(false);
	});

	// --- TRIANGULATE ---

	it("accepts UUIDs with mixed valid/invalid looking (just validates string)", () => {
		const result = BulkDeleteQuerySchema.safeParse({
			ids: "not-a-uuid,also-not-uuid",
		});
		expect(result.success).toBe(true);
	});

	it("accepts many comma-separated ids", () => {
		const uuids = Array.from(
			{ length: 100 },
			() => "550e8400-e29b-41d4-a716-446655440000",
		).join(",");
		const result = BulkDeleteQuerySchema.safeParse({ ids: uuids });
		expect(result.success).toBe(true);
	});

	it("strips whitespace around ids (schema doesn't, handler will)", () => {
		const result = BulkDeleteQuerySchema.safeParse({
			ids: " uuid1 , uuid2 ",
		});
		expect(result.success).toBe(true);
	});
});
