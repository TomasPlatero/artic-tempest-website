import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------
const { mockFromChain, mockStorageFrom, mockStorageMove } = vi.hoisted(() => ({
	mockFromChain: vi.fn(),
	mockStorageFrom: vi.fn(),
	mockStorageMove: vi.fn(),
}));

vi.mock("@/shared/lib/supabase-admin", () => ({
	supabaseAdmin: {
		storage: {
			from: mockStorageFrom,
		},
		from: mockFromChain,
	},
	SUPABASE_ADMIN_URL: "https://test.supabase.co",
	SUPABASE_ADMIN_KEY: "test-key",
}));

vi.mock("@/shared/auth/permissions", () => ({
	ensureAppPermission: vi.fn(),
}));

import { PATCH } from "./route";
import { ensureAppPermission } from "@/shared/auth/permissions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildRenameRequest(body: unknown): Request {
	return new Request("http://localhost/api/media/aaa-bbbb-cccc/rename", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

async function jsonBody(res: Response) {
	return res.json();
}

function makeMetadataRow(overrides: Record<string, unknown> = {}) {
	return {
		id: "aaa-bbbb-cccc",
		bucket: "news-images",
		storage_path: "abc123.jpg",
		title: "",
		alt_text: "",
		caption: "",
		description: "",
		file_size: 102400,
		mime_type: "image/jpeg",
		dimensions: "",
		uploaded_by: null,
		created_at: "2024-01-15T00:00:00Z",
		updated_at: "2024-01-15T00:00:00Z",
		...overrides,
	};
}

function mockQueryResult<T>(data: T, error: unknown = null) {
	const chain: Record<string, unknown> = {
		// oxlint-disable-next-line unicorn/no-thenable
		then: (resolve: (value: unknown) => void) => resolve({ data, error }),
	};
	const methods = [
		"select",
		"eq",
		"neq",
		"gt",
		"gte",
		"lt",
		"lte",
		"like",
		"ilike",
		"is",
		"in",
		"contains",
		"or",
		"and",
		"not",
		"order",
		"limit",
		"range",
		"single",
		"maybeSingle",
		"insert",
		"update",
		"delete",
		"upsert",
	];
	for (const m of methods) {
		chain[m] = vi.fn().mockReturnValue(chain);
	}
	return chain;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(ensureAppPermission).mockResolvedValue(undefined as any);

	mockStorageFrom.mockReturnValue({
		move: mockStorageMove,
	});
	mockStorageMove.mockResolvedValue({ data: null, error: null });
});

// ===========================================================================
// Test suite: PATCH /api/media/[id]/rename
// ===========================================================================
describe("PATCH /api/media/[id]/rename", () => {
	it("renames file within same bucket", async () => {
		const existing = makeMetadataRow();
		const updatedRow = { ...existing, storage_path: "nuevo-nombre.jpg" };

		let callCount = 0;
		mockFromChain.mockImplementation(() => {
			callCount++;
			if (callCount === 1) {
				// Fetch existing
				return mockQueryResult(existing);
			}
			// Update metadata row
			return mockQueryResult(updatedRow);
		});

		const res = await PATCH(
			buildRenameRequest({ newName: "nuevo-nombre.jpg" }),
			{ params: Promise.resolve({ id: "aaa-bbbb-cccc" }) },
		);

		expect(res.status).toBe(200);
		expect(ensureAppPermission).toHaveBeenCalledWith("media-library", "edit");
		expect(mockStorageFrom).toHaveBeenCalledWith("news-images");
		expect(mockStorageMove).toHaveBeenCalledWith(
			"abc123.jpg",
			"nuevo-nombre.jpg",
		);

		const body = await jsonBody(res);
		expect(body.file.storage_path).toBe("nuevo-nombre.jpg");
	});

	it("preserves extension when newName has none", async () => {
		const existing = makeMetadataRow({ storage_path: "abc123.jpg" });
		const updatedRow = { ...existing, storage_path: "foto-nueva.jpg" };

		let callCount = 0;
		mockFromChain.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockQueryResult(existing);
			return mockQueryResult(updatedRow);
		});

		const res = await PATCH(buildRenameRequest({ newName: "foto-nueva" }), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(200);
		expect(mockStorageMove).toHaveBeenCalledWith(
			"abc123.jpg",
			"foto-nueva.jpg",
		);
	});

	it("returns 404 when metadata row not found", async () => {
		mockFromChain.mockReturnValue(mockQueryResult(null));

		const res = await PATCH(buildRenameRequest({ newName: "x.jpg" }), {
			params: Promise.resolve({ id: "nonexistent" }),
		});

		expect(res.status).toBe(404);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/no encontrad|archivo/i);
	});

	it("returns 400 for missing newName", async () => {
		const res = await PATCH(buildRenameRequest({}), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(400);
	});

	it("returns 400 for empty newName string", async () => {
		const res = await PATCH(buildRenameRequest({ newName: "" }), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(400);
	});

	it("returns 400 for newName over 255 chars", async () => {
		const res = await PATCH(buildRenameRequest({ newName: "a".repeat(256) }), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(400);
	});

	it("returns 400 for invalid JSON body", async () => {
		const res = await PATCH(
			new Request("http://localhost/api/media/aaa-bbbb-cccc/rename", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: "not-json",
			}),
			{ params: Promise.resolve({ id: "aaa-bbbb-cccc" }) },
		);

		expect(res.status).toBe(400);
	});

	it("returns 403 when permission denied", async () => {
		const permError = new Error("Forbidden");
		(permError as any).status = 403;
		vi.mocked(ensureAppPermission).mockRejectedValue(permError);

		const res = await PATCH(buildRenameRequest({ newName: "x.jpg" }), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(403);
	});

	// --- TRIANGULATE ---
	it("handles storage move error gracefully", async () => {
		const existing = makeMetadataRow();
		mockStorageMove.mockResolvedValue({
			data: null,
			error: { name: "StorageError", message: "Target exists" },
		});

		mockFromChain.mockReturnValue(mockQueryResult(existing));

		const res = await PATCH(buildRenameRequest({ newName: "exists.jpg" }), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(500);
	});

	it("preserves .jpeg extension from storage_path", async () => {
		const existing = makeMetadataRow({ storage_path: "photo1.jpeg" });
		const updated = { ...existing, storage_path: "renamed.jpeg" };

		let callCount = 0;
		mockFromChain.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockQueryResult(existing);
			return mockQueryResult(updated);
		});

		const res = await PATCH(buildRenameRequest({ newName: "renamed" }), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(200);
		expect(mockStorageMove).toHaveBeenCalledWith("photo1.jpeg", "renamed.jpeg");
	});
});
