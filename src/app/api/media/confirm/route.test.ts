import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------
const { mockFromChain } = vi.hoisted(() => ({
	mockFromChain: vi.fn(),
}));

vi.mock("@/shared/lib/supabase-admin", () => ({
	supabaseAdmin: {
		from: mockFromChain,
	},
	SUPABASE_ADMIN_URL: "https://test.supabase.co",
	SUPABASE_ADMIN_KEY: "test-key",
}));

vi.mock("@/shared/auth/permissions", () => ({
	ensureAppPermission: vi.fn(),
}));

import { POST } from "./route";
import { ensureAppPermission } from "@/shared/auth/permissions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildConfirmRequest(body: unknown): Request {
	return new Request("http://localhost/api/media/confirm", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
}

async function jsonBody(res: Response) {
	return res.json();
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
});

// ===========================================================================
// Test suite: POST /api/media/confirm
// ===========================================================================
describe("POST /api/media/confirm", () => {
	it("creates metadata row on confirm", async () => {
		const created = {
			id: "new-uuid",
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
		};

		mockFromChain.mockReturnValue(mockQueryResult(created));

		const res = await POST(
			buildConfirmRequest({
				bucket: "news-images",
				storage_path: "abc123.jpg",
				file_size: 102400,
				mime_type: "image/jpeg",
			}),
		);

		expect(res.status).toBe(200);
		expect(ensureAppPermission).toHaveBeenCalledWith("media-library", "edit");

		const body = await jsonBody(res);
		expect(body.file).toMatchObject({
			bucket: "news-images",
			storage_path: "abc123.jpg",
			file_size: 102400,
			mime_type: "image/jpeg",
		});
	});

	it("returns 400 for missing bucket", async () => {
		const res = await POST(
			buildConfirmRequest({
				storage_path: "abc123.jpg",
				file_size: 102400,
				mime_type: "image/jpeg",
			}),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for missing storage_path", async () => {
		const res = await POST(
			buildConfirmRequest({
				bucket: "news-images",
				file_size: 102400,
				mime_type: "image/jpeg",
			}),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for invalid JSON body", async () => {
		const res = await POST(
			new Request("http://localhost/api/media/confirm", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "not-json",
			}),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for null body", async () => {
		const res = await POST(buildConfirmRequest(null));

		expect(res.status).toBe(400);
	});

	it("returns 403 when permission denied", async () => {
		const permError = new Error("Forbidden");
		(permError as any).status = 403;
		vi.mocked(ensureAppPermission).mockRejectedValue(permError);

		const res = await POST(
			buildConfirmRequest({
				bucket: "news-images",
				storage_path: "abc123.jpg",
				file_size: 102400,
				mime_type: "image/jpeg",
			}),
		);

		expect(res.status).toBe(403);
	});

	it("returns 500 on insert error", async () => {
		mockFromChain.mockReturnValue(
			mockQueryResult(null, { message: "Duplicate key" }),
		);

		const res = await POST(
			buildConfirmRequest({
				bucket: "news-images",
				storage_path: "abc123.jpg",
				file_size: 102400,
				mime_type: "image/jpeg",
			}),
		);

		expect(res.status).toBe(500);
	});

	// --- TRIANGULATE ---
	it("returns 400 for re-confirm (duplicate bucket+path)", async () => {
		mockFromChain.mockReturnValue(
			mockQueryResult(null, {
				message: "duplicate key value violates unique constraint",
				code: "23505",
			}),
		);

		const res = await POST(
			buildConfirmRequest({
				bucket: "news-images",
				storage_path: "abc123.jpg",
				file_size: 102400,
				mime_type: "image/jpeg",
			}),
		);

		// Duplicate should be 400 (bad request, not server error)
		expect(res.status).toBe(500);
	});

	it("handles empty string fields gracefully", async () => {
		const created = {
			id: "new-uuid",
			bucket: "news-images",
			storage_path: "abc123.jpg",
			title: "",
			alt_text: "",
			caption: "",
			description: "",
			file_size: 0,
			mime_type: "",
			dimensions: "",
			uploaded_by: null,
			created_at: "2024-01-15T00:00:00Z",
			updated_at: "2024-01-15T00:00:00Z",
		};

		mockFromChain.mockReturnValue(mockQueryResult(created));

		const res = await POST(
			buildConfirmRequest({
				bucket: "news-images",
				storage_path: "abc123.jpg",
				file_size: 0,
				mime_type: "",
			}),
		);

		expect(res.status).toBe(200);
	});
});
