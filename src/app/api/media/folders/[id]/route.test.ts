import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------
const {
	mockStorageFrom,
	mockStorageRemove,
	mockStorageDeleteBucket,
	mockFromChain,
	mockGetPublicUrl,
} = vi.hoisted(() => ({
	mockStorageFrom: vi.fn(),
	mockStorageRemove: vi.fn(),
	mockStorageDeleteBucket: vi.fn(),
	mockFromChain: vi.fn(),
	mockGetPublicUrl: vi.fn(),
}));

vi.mock("@/shared/lib/supabase-admin", () => ({
	supabaseAdmin: {
		storage: {
			from: mockStorageFrom,
			deleteBucket: mockStorageDeleteBucket,
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
	return new Request("http://localhost/api/media/folders/aaa-bbbb-cccc", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

function buildDeleteRequest(): Request {
	return new Request("http://localhost/api/media/folders/aaa-bbbb-cccc", {
		method: "DELETE",
	});
}

async function jsonBody(res: Response) {
	return res.json();
}

function makeFolderRow(overrides: Record<string, unknown> = {}) {
	return {
		id: "aaa-bbbb-cccc",
		bucket_name: "mi-carpeta",
		display_name: "Mi Carpeta",
		description: "",
		sort_order: 0,
		is_system: false,
		created_at: "2024-01-01T00:00:00Z",
		updated_at: "2024-01-01T00:00:00Z",
		...overrides,
	};
}

/**
 * Create a mock Supabase query chain that returns data/error when awaited.
 */
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
		getPublicUrl: mockGetPublicUrl,
		remove: mockStorageRemove,
	});
	mockStorageRemove.mockResolvedValue({ data: null, error: null });
	mockStorageDeleteBucket.mockResolvedValue({ data: null, error: null });
	mockGetPublicUrl.mockReturnValue({
		data: { publicUrl: "https://storage.supabase.co/public/b/file.jpg" },
	});
});

// ===========================================================================
// Test suite: PATCH /api/media/folders/[id]
// ===========================================================================
describe("PATCH /api/media/folders/[id]", () => {
	it("updates folder display_name and description", async () => {
		const existingFolder = makeFolderRow();
		const updatedFolder = {
			...existingFolder,
			display_name: "Nuevo Nombre",
			description: "Nueva desc",
		};

		// Mock: first from() returns existing folder, second from() returns updated
		let callCount = 0;
		mockFromChain.mockImplementation(() => {
			callCount++;
			if (callCount === 1) {
				return mockQueryResult(existingFolder);
			}
			return mockQueryResult(updatedFolder);
		});

		const res = await PATCH(
			buildPatchRequest({
				display_name: "Nuevo Nombre",
				description: "Nueva desc",
			}),
			{ params: Promise.resolve({ id: "aaa-bbbb-cccc" }) },
		);

		expect(res.status).toBe(200);
		expect(ensureAppPermission).toHaveBeenCalledWith("media-library", "manage");

		const body = await jsonBody(res);
		expect(body.folder).toMatchObject({
			display_name: "Nuevo Nombre",
			description: "Nueva desc",
		});
	});

	it("returns 404 when folder not found", async () => {
		mockFromChain.mockReturnValue(mockQueryResult(null));

		const res = await PATCH(buildPatchRequest({ display_name: "X" }), {
			params: Promise.resolve({ id: "nonexistent" }),
		});

		expect(res.status).toBe(404);
	});

	it("allows display_name update on system folder", async () => {
		const systemFolder = makeFolderRow({ is_system: true });

		let callCount = 0;
		mockFromChain.mockImplementation(() => {
			callCount++;
			if (callCount === 1) {
				return mockQueryResult(systemFolder);
			}
			return mockQueryResult({ ...systemFolder, display_name: "Nuevo" });
		});

		const res = await PATCH(buildPatchRequest({ display_name: "Nuevo" }), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(200);
	});

	it("returns 403 when permission denied", async () => {
		const permError = new Error("Forbidden");
		(permError as any).status = 403;
		vi.mocked(ensureAppPermission).mockRejectedValue(permError);

		const res = await PATCH(buildPatchRequest({ display_name: "X" }), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(403);
	});
});

// ===========================================================================
// Test suite: DELETE /api/media/folders/[id]
// ===========================================================================
describe("DELETE /api/media/folders/[id]", () => {
	it("deletes a non-system folder successfully", async () => {
		const folder = makeFolderRow({
			bucket_name: "user-bucket",
			is_system: false,
		});

		// 4 calls: fetch folder, list files (metadata), delete metadata, delete folder
		let callCount = 0;
		mockFromChain.mockImplementation(() => {
			callCount++;
			if (callCount === 1) {
				// Fetch folder
				return mockQueryResult(folder);
			}
			if (callCount === 2) {
				// List files in bucket
				return mockQueryResult([
					{ storage_path: "file1.jpg" },
					{ storage_path: "file2.png" },
				]);
			}
			if (callCount === 3) {
				// Delete metadata rows
				return mockQueryResult(null);
			}
			// Delete folder row
			return mockQueryResult(null);
		});

		const res = await DELETE(buildDeleteRequest(), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(200);
		expect(ensureAppPermission).toHaveBeenCalledWith("media-library", "manage");

		const body = await jsonBody(res);
		expect(body.success).toBe(true);
	});

	it("returns 404 when folder not found", async () => {
		mockFromChain.mockReturnValue(mockQueryResult(null));

		const res = await DELETE(buildDeleteRequest(), {
			params: Promise.resolve({ id: "nonexistent" }),
		});

		expect(res.status).toBe(404);
	});

	it("returns 403 when trying to delete system folder", async () => {
		const systemFolder = makeFolderRow({ is_system: true });
		mockFromChain.mockReturnValue(mockQueryResult(systemFolder));

		const res = await DELETE(buildDeleteRequest(), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(403);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/sistema/i);
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

	it("handles empty folder (no files) delete", async () => {
		const folder = makeFolderRow({ bucket_name: "empty-bucket" });

		let callCount = 0;
		mockFromChain.mockImplementation(() => {
			callCount++;
			if (callCount === 1) {
				return mockQueryResult(folder);
			}
			if (callCount === 2) {
				// metadata query returns empty
				return mockQueryResult([]);
			}
			if (callCount === 3) {
				return mockQueryResult(null);
			}
			return mockQueryResult(null);
		});

		const res = await DELETE(buildDeleteRequest(), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(200);
		expect(mockStorageRemove).not.toHaveBeenCalled();
	});

	// --- TRIANGULATE: edge cases ---
	it("PATCH: returns 400 for invalid JSON body", async () => {
		const res = await PATCH(
			new Request("http://localhost/api/media/folders/aaa-bbbb-cccc", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: "not-json",
			}),
			{ params: Promise.resolve({ id: "aaa-bbbb-cccc" }) },
		);

		expect(res.status).toBe(400);
	});

	it("PATCH: allows empty update body (no-op)", async () => {
		const folder = makeFolderRow();

		let callCount = 0;
		mockFromChain.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return mockQueryResult(folder);
			return mockQueryResult(folder);
		});

		const res = await PATCH(buildPatchRequest({}), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(200);
	});

	it("PATCH: rejects sort_order as float", async () => {
		mockFromChain.mockReturnValue(mockQueryResult(makeFolderRow()));

		const res = await PATCH(buildPatchRequest({ sort_order: 1.5 }), {
			params: Promise.resolve({ id: "aaa-bbbb-cccc" }),
		});

		expect(res.status).toBe(400);
	});
});
