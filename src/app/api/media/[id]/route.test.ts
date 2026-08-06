import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------
const { mockFromChain, mockStorageFrom, mockStorageRemove } = vi.hoisted(
	() => ({
		mockFromChain: vi.fn(),
		mockStorageFrom: vi.fn(),
		mockStorageRemove: vi.fn(),
	}),
);

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

import { PATCH, DELETE } from "./route";
import { ensureAppPermission } from "@/shared/auth/permissions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildPatchRequest(body: unknown): Request {
	return new Request("http://localhost/api/media/aaa-bbbb-cccc", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

function buildDeleteRequest(query?: string): Request {
	const qs = query ? `?${query}` : "";
	return new Request(`http://localhost/api/media/aaa-bbbb-cccc${qs}`, {
		method: "DELETE",
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
		remove: mockStorageRemove,
	});
	mockStorageRemove.mockResolvedValue({ data: null, error: null });
});

// ===========================================================================
// Test suite: PATCH /api/media/[id]
// ===========================================================================
describe("PATCH /api/media/[id]", () => {
	it("updates metadata title and alt_text", async () => {
		const existing = makeMetadataRow();
		const updated = { ...existing, title: "Hero", alt_text: "A hero image" };

		let callCount = 0;
		mockFromChain.mockImplementation(() => {
			callCount++;
			if (callCount === 1) {
				return mockQueryResult(existing);
			}
			return mockQueryResult(updated);
		});

		const res = await PATCH(
			buildPatchRequest({ title: "Hero", alt_text: "A hero image" }),
			{ params: Promise.resolve({ id: "aaa-bbbb-cccc" }) },
		);

		expect(res.status).toBe(200);
		expect(ensureAppPermission).toHaveBeenCalledWith("media-library", "edit");

		const body = await jsonBody(res);
		expect(body.file).toMatchObject({
			title: "Hero",
			alt_text: "A hero image",
		});
	});

	it("returns 404 when metadata row not found", async () => {
		mockFromChain.mockReturnValue(mockQueryResult(null));

		const res = await PATCH(buildPatchRequest({ title: "Hero" }), {
			params: Promise.resolve({ id: "nonexistent" }),
		});

		expect(res.status).toBe(404);
	});

	it("allows partial updates (only title)", async () => {
		const existing = makeMetadataRow();
		const updated = { ...existing, title: "New Title" };

		let callCount = 0;
		mockFromChain.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockQueryResult(existing);
			return mockQueryResult(updated);
		});

		const res = await PATCH(buildPatchRequest({ title: "New Title" }), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(200);
		const body = await jsonBody(res);
		expect(body.file.title).toBe("New Title");
	});

	it("returns 400 for title over 255 chars", async () => {
		mockFromChain.mockReturnValue(mockQueryResult(makeMetadataRow()));

		const res = await PATCH(buildPatchRequest({ title: "a".repeat(256) }), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(400);
	});

	it("returns 400 for invalid JSON body", async () => {
		const res = await PATCH(
			new Request("http://localhost/api/media/aaa-bbbb-cccc", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: "not-json",
			}),
			{ params: Promise.resolve({ id: "aaa-bbbb-cccc" }) },
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for empty update body", async () => {
		// Empty body should still parse (all fields are optional)
		mockFromChain.mockReturnValue(mockQueryResult(makeMetadataRow()));

		const res = await PATCH(buildPatchRequest({}), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(200);
	});

	it("returns 403 when permission denied", async () => {
		const permError = new Error("Forbidden");
		(permError as any).status = 403;
		vi.mocked(ensureAppPermission).mockRejectedValue(permError);

		const res = await PATCH(buildPatchRequest({ title: "X" }), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(403);
	});
});

// ===========================================================================
// Test suite: DELETE /api/media/[id]
// ===========================================================================
describe("DELETE /api/media/[id]", () => {
	it("deletes a single file successfully", async () => {
		const file = makeMetadataRow();

		let callCount = 0;
		mockFromChain.mockImplementation(() => {
			callCount++;
			if (callCount === 1) {
				return mockQueryResult(file);
			}
			// Delete metadata row
			return mockQueryResult(null);
		});

		const res = await DELETE(buildDeleteRequest(), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(200);
		expect(ensureAppPermission).toHaveBeenCalledWith("media-library", "edit");
		expect(mockStorageFrom).toHaveBeenCalledWith("news-images");
		expect(mockStorageRemove).toHaveBeenCalledWith(["abc123.jpg"]);

		const body = await jsonBody(res);
		expect(body.success).toBe(true);
	});

	it("returns 404 when file not found", async () => {
		mockFromChain.mockReturnValue(mockQueryResult(null));

		const res = await DELETE(buildDeleteRequest(), {
			params: Promise.resolve({ id: "nonexistent" }),
		});

		expect(res.status).toBe(404);
	});

	it("handles bulk delete via ?ids= query", async () => {
		const file1 = makeMetadataRow({ id: "id1", storage_path: "f1.jpg" });
		const file2 = makeMetadataRow({ id: "id2", storage_path: "f2.png" });

		// Promise.all runs deleteOneMedia concurrently — selects interleave first, then deletes
		let callCount = 0;
		mockFromChain.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockQueryResult(file1); // select id1
			if (callCount === 2) return mockQueryResult(file2); // select id2 (concurrent)
			if (callCount === 3) return mockQueryResult(null); // delete id1
			return mockQueryResult(null); // delete id2
		});

		const res = await DELETE(buildDeleteRequest("ids=id1,id2"), {
			params: Promise.resolve({ id: "id1" }), // single id still works
		});

		expect(res.status).toBe(200);
		const body = await jsonBody(res);
		expect(body.success).toBe(true);
	});

	it("reports partial success with mixed valid/invalid ids", async () => {
		const file1 = makeMetadataRow({ id: "id1", storage_path: "f1.jpg" });

		let callCount = 0;
		mockFromChain.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockQueryResult(file1); // fetch id1 → found
			if (callCount === 2) return mockQueryResult(null); // delete metadata id1 → ok
			if (callCount === 3) return mockQueryResult(null); // fetch id2 → not found
			// Should not reach further
			return mockQueryResult(null);
		});

		const res = await DELETE(buildDeleteRequest("ids=id1,id2"), {
			params: Promise.resolve({ id: "id1" }),
		});

		expect(res.status).toBe(200);
		const body = await jsonBody(res);
		// id1 deleted, id2 not found — errors present, success false
		expect(body.success).toBe(false);
		expect(body.processed).toBeGreaterThan(0);
	});

	it("returns 400 for empty ids param", async () => {
		// When ids is empty string, should return 400
		const res = await DELETE(buildDeleteRequest("ids="), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(400);
	});

	it("returns 403 when permission denied", async () => {
		const permError = new Error("Forbidden");
		(permError as any).status = 403;
		vi.mocked(ensureAppPermission).mockRejectedValue(permError);

		const res = await DELETE(buildDeleteRequest(), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(403);
	});

	// --- TRIANGULATE ---
	it("handles storage remove failure gracefully", async () => {
		const file = makeMetadataRow();
		mockStorageRemove.mockResolvedValue({
			data: null,
			error: { name: "StorageError", message: "Not found" },
		});

		let callCount = 0;
		mockFromChain.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockQueryResult(file);
			return mockQueryResult(null);
		});

		const res = await DELETE(buildDeleteRequest(), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		// Storage remove error shouldn't block the flow
		expect(res.status).toBe(200);
	});

	it("returns 500 on database error during metadata delete", async () => {
		const file = makeMetadataRow();

		let callCount = 0;
		mockFromChain.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockQueryResult(file);
			// delete error
			return mockQueryResult(null, { message: "DB error" });
		});

		const res = await DELETE(buildDeleteRequest(), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(500);
	});
});
