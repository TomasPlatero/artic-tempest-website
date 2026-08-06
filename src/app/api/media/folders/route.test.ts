import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------
const {
	mockStorageCreateBucket,
	mockStorageFrom,
	mockStorageList,
	mockGetPublicUrl,
	mockFromChain,
} = vi.hoisted(() => ({
	mockStorageCreateBucket: vi.fn(),
	mockStorageFrom: vi.fn(),
	mockStorageList: vi.fn(),
	mockGetPublicUrl: vi.fn(),
	mockFromChain: vi.fn(),
}));

vi.mock("@/shared/lib/supabase-admin", () => ({
	supabaseAdmin: {
		storage: {
			createBucket: mockStorageCreateBucket,
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

import { GET, POST } from "./route";
import { ensureAppPermission } from "@/shared/auth/permissions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildRequest(method: "GET" | "POST", body?: unknown): Request {
	const init: RequestInit = {
		method,
		headers:
			method === "POST" ? { "Content-Type": "application/json" } : undefined,
	};
	if (method !== "GET" && body !== undefined) {
		init.body = JSON.stringify(body);
	}
	return new Request("http://localhost/api/media/folders", init);
}

async function jsonBody(res: Response) {
	return res.json();
}

/**
 * Create a mock Supabase query chain that returns the given data/error when awaited.
 * Each chain method (select, eq, order, etc.) returns `this` for fluent chaining,
 * and `then` resolves the final result.
 */
function mockQueryResult<T>(data: T, error: unknown = null) {
	const chain: Record<string, unknown> = {
		// oxlint-disable-next-line unicorn/no-thenable
		then: (resolve: (value: unknown) => void) => resolve({ data, error }),
	};

	// All chain methods return the chain itself (fluent)
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
		list: mockStorageList,
	});
	mockStorageList.mockResolvedValue({
		data: [],
		error: null,
	});
	mockGetPublicUrl.mockReturnValue({
		data: {
			publicUrl: "https://storage.supabase.co/public/test-bucket/file.jpg",
		},
	});
});

// ===========================================================================
// Test suite: GET /api/media/folders
// ===========================================================================
describe("GET /api/media/folders", () => {
	it("returns folders with file counts", async () => {
		const folders = [
			{
				id: "aaa-bbbb-cccc",
				bucket_name: "news-images",
				display_name: "Imágenes de Noticias",
				description: "",
				sort_order: 1,
				is_system: true,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			},
			{
				id: "ddd-eeee-ffff",
				bucket_name: "guild_assets",
				display_name: "Assets del Clan",
				description: "Logos",
				sort_order: 0,
				is_system: true,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			},
		];

		// Mock: media_folders query returns folders
		mockFromChain.mockReturnValue(mockQueryResult(folders));

		// Override for the count queries: from('media_metadata') → count
		let countCall = 0;
		mockFromChain.mockImplementation((table: string) => {
			if (table === "media_metadata") {
				countCall++;
				return mockQueryResult(null, null); // head:true returns count on the response
			}
			return mockQueryResult(folders);
		});

		// Wait — count queries with head:true return { count: N, error: null } directly
		// rather than { data: [...], error: null }
		// So we need a different mock for those.

		// Let's redo: the handler calls:
		// supabaseAdmin.from('media_metadata').select('*', { count: 'exact', head: true }).eq('bucket', name)
		// This returns { count: N, data: null, error: null }
		mockFromChain.mockReset();
		mockFromChain.mockImplementation((table: string) => {
			if (table === "media_metadata") {
				countCall++;
				const countChain: Record<string, unknown> = {
					// oxlint-disable-next-line unicorn/no-thenable
					then: (resolve: (value: unknown) => void) =>
						resolve({ count: countCall === 1 ? 5 : 3, error: null }),
				};
				const methods = ["select", "eq", "order", "limit"];
				for (const m of methods) {
					countChain[m] = vi.fn().mockReturnValue(countChain);
				}
				return countChain;
			}
			return mockQueryResult(folders);
		});

		const res = await GET(buildRequest("GET"));

		expect(res.status).toBe(200);
		expect(ensureAppPermission).toHaveBeenCalledWith("media-library", "view");

		const body = await jsonBody(res);
		expect(body).toHaveProperty("folders");
		expect(body.folders).toHaveLength(2);
		expect(body.folders[0]).toMatchObject({
			id: "aaa-bbbb-cccc",
			bucket_name: "news-images",
			display_name: "Imágenes de Noticias",
		});
		expect(body.folders[0]).toHaveProperty("file_count");
	});

	it("returns empty array when no folders exist", async () => {
		mockFromChain.mockReturnValue(mockQueryResult([]));

		const res = await GET(buildRequest("GET"));

		expect(res.status).toBe(200);
		const body = await jsonBody(res);
		expect(body.folders).toEqual([]);
	});

	it("returns 403 when permission denied", async () => {
		const permError = new Error("Role member cannot view media-library");
		(permError as any).status = 403;
		vi.mocked(ensureAppPermission).mockRejectedValue(permError);

		const res = await GET(buildRequest("GET"));

		expect(res.status).toBe(403);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/member/);
	});

	it("returns 500 on database error", async () => {
		mockFromChain.mockReturnValue(
			mockQueryResult(null, { message: "Connection refused" }),
		);

		const res = await GET(buildRequest("GET"));

		expect(res.status).toBe(500);
	});
});

// ===========================================================================
// Test suite: POST /api/media/folders
// ===========================================================================
describe("POST /api/media/folders", () => {
	it("creates a folder and returns it", async () => {
		// Mock: createBucket succeeds
		mockStorageCreateBucket.mockResolvedValue({
			data: { name: "mi-carpeta-abc1" },
			error: null,
		});

		// Mock: insert returns the new folder
		mockFromChain.mockReturnValue(
			mockQueryResult({
				id: "111-222-333",
				bucket_name: "mi-carpeta-abc1",
				display_name: "Mi Carpeta",
				description: "Una descripción",
				sort_order: 0,
				is_system: false,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			}),
		);

		const res = await POST(
			buildRequest("POST", {
				display_name: "Mi Carpeta",
				description: "Una descripción",
			}),
		);

		expect(res.status).toBe(200);
		expect(ensureAppPermission).toHaveBeenCalledWith("media-library", "manage");

		const body = await jsonBody(res);
		expect(body.folder).toMatchObject({
			display_name: "Mi Carpeta",
			description: "Una descripción",
		});
		expect(body.folder).toHaveProperty("bucket_name");
		expect(body.folder).toHaveProperty("id");
	});

	it("creates folder with empty description", async () => {
		mockStorageCreateBucket.mockResolvedValue({
			data: { name: "solo-nombre-x2y3" },
			error: null,
		});
		mockFromChain.mockReturnValue(
			mockQueryResult({
				id: "444-555-666",
				bucket_name: "solo-nombre-x2y3",
				display_name: "Solo Nombre",
				description: "",
				sort_order: 0,
				is_system: false,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			}),
		);

		const res = await POST(
			buildRequest("POST", { display_name: "Solo Nombre" }),
		);

		expect(res.status).toBe(200);
		const body = await jsonBody(res);
		expect(body.folder.display_name).toBe("Solo Nombre");
		expect(body.folder.description).toBe("");
	});

	it("returns 400 for missing display_name", async () => {
		const res = await POST(buildRequest("POST", { description: "sin nombre" }));

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toBeDefined();
	});

	it("returns 400 for empty display_name", async () => {
		const res = await POST(
			buildRequest("POST", { display_name: "", description: "" }),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for display_name over 100 chars", async () => {
		const res = await POST(
			buildRequest("POST", {
				display_name: "A".repeat(101),
				description: "",
			}),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for non-object body", async () => {
		const res = await POST(
			new Request("http://localhost/api/media/folders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "not-json",
			}),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for null body", async () => {
		const res = await POST(buildRequest("POST", null));

		expect(res.status).toBe(400);
	});

	it("returns 403 when permission denied", async () => {
		const permError = new Error("Role member cannot manage media-library");
		(permError as any).status = 403;
		vi.mocked(ensureAppPermission).mockRejectedValue(permError);

		const res = await POST(
			buildRequest("POST", { display_name: "Mi Carpeta" }),
		);

		expect(res.status).toBe(403);
	});

	it("returns 500 when bucket creation fails", async () => {
		mockStorageCreateBucket.mockResolvedValue({
			data: null,
			error: { message: "Duplicate bucket" },
		});

		const res = await POST(
			buildRequest("POST", { display_name: "Mi Carpeta" }),
		);

		expect(res.status).toBe(500);
		const body = await jsonBody(res);
		expect(body.error).toBeDefined();
	});

	it("returns 500 when DB insert fails", async () => {
		mockStorageCreateBucket.mockResolvedValue({
			data: { name: "test-x1y2" },
			error: null,
		});
		mockFromChain.mockReturnValue(
			mockQueryResult(null, { message: "Unique constraint violation" }),
		);

		const res = await POST(buildRequest("POST", { display_name: "Test" }));

		expect(res.status).toBe(500);
	});

	// --- TRIANGULATE: edge cases ---
	it("returns 400 for description over 500 chars", async () => {
		const res = await POST(
			buildRequest("POST", {
				display_name: "Test",
				description: "A".repeat(501),
			}),
		);

		expect(res.status).toBe(400);
	});

	it("handles display_name with emojis", async () => {
		mockStorageCreateBucket.mockResolvedValue({
			data: { name: "mi-carpeta-x1y2" },
			error: null,
		});
		mockFromChain.mockReturnValue(
			mockQueryResult({
				id: "777-888-999",
				bucket_name: "mi-carpeta-x1y2",
				display_name: "Mi Carpeta 🎨",
				description: "",
				sort_order: 0,
				is_system: false,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			}),
		);

		const res = await POST(
			buildRequest("POST", { display_name: "Mi Carpeta 🎨", description: "" }),
		);

		expect(res.status).toBe(200);
		const body = await jsonBody(res);
		expect(body.folder.display_name).toBe("Mi Carpeta 🎨");
	});

	it("ignores extra fields in POST body", async () => {
		mockStorageCreateBucket.mockResolvedValue({
			data: { name: "test-x1y2" },
			error: null,
		});
		mockFromChain.mockReturnValue(
			mockQueryResult({
				id: "extra-111",
				bucket_name: "test-x1y2",
				display_name: "Test",
				description: "",
				sort_order: 0,
				is_system: false,
				created_at: "2024-01-01T00:00:00Z",
				updated_at: "2024-01-01T00:00:00Z",
			}),
		);

		const res = await POST(
			buildRequest("POST", {
				display_name: "Test",
				malicious_field: "should-be-stripped",
			}),
		);

		expect(res.status).toBe(200);
	});
});
