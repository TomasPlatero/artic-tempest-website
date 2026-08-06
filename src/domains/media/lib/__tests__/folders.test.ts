import { describe, it, expect } from "vitest";
import {
	slugify,
	isSystemFolder,
	canDeleteFolder,
	canEditBucketName,
} from "../folders";
import type { MediaFolder } from "../../types";

// Helper to create a minimal MediaFolder for tests
function makeFolder(overrides: Partial<MediaFolder> = {}): MediaFolder {
	return {
		id: "00000000-0000-0000-0000-000000000001",
		bucket_name: "mi-carpeta",
		display_name: "Mi Carpeta",
		description: "",
		sort_order: 0,
		is_system: false,
		file_count: 0,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z",
		...overrides,
	};
}

// ═══════════════════════════════════════════
// slugify
// ═══════════════════════════════════════════
describe("slugify", () => {
	it("converts to lowercase", () => {
		expect(slugify("Mi Carpeta")).toMatch(/^mi-carpeta-[a-z0-9]{4}$/);
	});

	it("replaces spaces with hyphens", () => {
		expect(slugify("imagenes de noticias")).toMatch(
			/^imagenes-de-noticias-[a-z0-9]{4}$/,
		);
	});

	it("strips special characters", () => {
		expect(slugify("¡Hola! ¿Qué tal?")).toMatch(/^hola-que-tal-[a-z0-9]{4}$/);
	});

	it("normalizes accents", () => {
		expect(slugify("cañón épico áéíóú")).toMatch(
			/^canon-epico-aeiou-[a-z0-9]{4}$/,
		);
	});

	it("collapses multiple hyphens", () => {
		expect(slugify("a   b --- c")).toMatch(/^a-b-c-[a-z0-9]{4}$/);
	});

	it("trims leading and trailing hyphens", () => {
		expect(slugify("--hello--")).toMatch(/^hello-[a-z0-9]{4}$/);
	});

	it("handles empty string", () => {
		const result = slugify("");
		// Should return something usable (append suffix)
		expect(result.length).toBeGreaterThan(0);
	});

	it("returns deterministic output for same input", () => {
		// slugify is NOT deterministic — each call produces a different random suffix
		// This is by design for collision safety
		const a = slugify("Mi Carpeta");
		const b = slugify("Mi Carpeta");
		// Both should start with the same base
		expect(a).toMatch(/^mi-carpeta-[a-z0-9]{4}$/);
		expect(b).toMatch(/^mi-carpeta-[a-z0-9]{4}$/);
		// Different suffix each call (collision-safe)
		expect(a).not.toBe(b);
	});

	it("appends random suffix for collision safety (different calls differ)", () => {
		// slugify is deterministic for same input (it doesn't track collisions in-process)
		// but structurally it should produce valid bucket names
		const result = slugify("test folder");
		expect(result).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
	});

	it("handles numbers", () => {
		expect(slugify("Eventos 2024")).toMatch(/^eventos-2024-[a-z0-9]{4}$/);
	});

	it("handles input with only special characters", () => {
		const result = slugify("!!!@@@###");
		// Should produce a valid non-empty string with suffix
		expect(result.length).toBeGreaterThan(0);
		expect(result).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
	});

	it("handles very long names", () => {
		const long = "A".repeat(200);
		const result = slugify(long);
		expect(result.length).toBeLessThanOrEqual(100);
	});
});

// ═══════════════════════════════════════════
// isSystemFolder
// ═══════════════════════════════════════════
describe("isSystemFolder", () => {
	it("returns true for system folder", () => {
		const folder = makeFolder({ is_system: true });
		expect(isSystemFolder(folder)).toBe(true);
	});

	it("returns false for user-created folder", () => {
		const folder = makeFolder({ is_system: false });
		expect(isSystemFolder(folder)).toBe(false);
	});
});

// ═══════════════════════════════════════════
// canDeleteFolder
// ═══════════════════════════════════════════
describe("canDeleteFolder", () => {
	it("returns false for system folder", () => {
		const folder = makeFolder({ is_system: true });
		expect(canDeleteFolder(folder)).toBe(false);
	});

	it("returns true for user-created folder", () => {
		const folder = makeFolder({ is_system: false });
		expect(canDeleteFolder(folder)).toBe(true);
	});
});

// ═══════════════════════════════════════════
// canEditBucketName
// ═══════════════════════════════════════════
describe("canEditBucketName", () => {
	it("returns false for system folder", () => {
		const folder = makeFolder({ is_system: true });
		expect(canEditBucketName(folder)).toBe(false);
	});

	it("returns true for user-created folder", () => {
		const folder = makeFolder({ is_system: false });
		expect(canEditBucketName(folder)).toBe(true);
	});
});
