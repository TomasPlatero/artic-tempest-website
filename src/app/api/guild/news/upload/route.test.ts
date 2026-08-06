import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock dependencies — use vi.hoisted so factory references are hoisted too
// ---------------------------------------------------------------------------
const { mockCreateSignedUploadUrl, mockGetPublicUrl, mockStorageFrom } =
	vi.hoisted(() => ({
		mockCreateSignedUploadUrl: vi.fn(),
		mockGetPublicUrl: vi.fn(),
		mockStorageFrom: vi.fn(),
	}));

vi.mock("@/shared/lib/supabase-admin", () => ({
	supabaseAdmin: {
		storage: {
			from: mockStorageFrom,
		},
	},
}));

vi.mock("@/shared/auth/permissions", () => ({
	ensureAppPermission: vi.fn(),
}));

import { POST } from "./route";
import { ensureAppPermission } from "@/shared/auth/permissions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildRequest(body: unknown): Request {
	return new Request("http://localhost/api/guild/news/upload", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
}

async function jsonBody(res: Response) {
	return res.json();
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
	vi.clearAllMocks();

	// Default: permission check passes silently
	vi.mocked(ensureAppPermission).mockResolvedValue(undefined as any);

	// Default: signed URL succeeds
	mockStorageFrom.mockReturnValue({
		createSignedUploadUrl: mockCreateSignedUploadUrl,
		getPublicUrl: mockGetPublicUrl,
	});
	mockCreateSignedUploadUrl.mockResolvedValue({
		data: {
			path: "articles/test-uuid.jpg",
			token: "signed-token-123",
			signedUrl: "https://storage.supabase.co/signed-url",
		},
		error: null,
	});
	mockGetPublicUrl.mockReturnValue({
		data: {
			publicUrl: "https://storage.supabase.co/public/articles/test-uuid.jpg",
		},
	});
});

// ===========================================================================
// Test suite
// ===========================================================================
describe("POST /api/guild/news/upload", () => {
	// -----------------------------------------------------------------------
	// Success
	// -----------------------------------------------------------------------
	it("returns path, token and publicUrl on valid request", async () => {
		const res = await POST(
			buildRequest({
				fileName: "hero.jpg",
				mimeType: "image/jpeg",
				fileSize: 102400,
			}),
		);

		expect(res.status).toBe(200);
		const body = await jsonBody(res);
		expect(body).toMatchObject({
			path: "articles/test-uuid.jpg",
			token: "signed-token-123",
			signedUrl: "https://storage.supabase.co/signed-url",
			publicUrl: "https://storage.supabase.co/public/articles/test-uuid.jpg",
		});

		// Verify permission was checked
		expect(ensureAppPermission).toHaveBeenCalledWith("settings-news", "edit");

		// Verify bucket call uses the generated path
		expect(mockStorageFrom).toHaveBeenCalledWith("news-images");
		expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith(
			expect.stringMatching(/^articles\/[a-f0-9-]+\.jpg$/),
		);
	});

	it("calls createSignedUploadUrl with correct path for webp", async () => {
		const res = await POST(
			buildRequest({
				fileName: "banner.webp",
				mimeType: "image/webp",
				fileSize: 1,
			}),
		);

		expect(res.status).toBe(200);
		expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith(
			expect.stringMatching(/^articles\/[a-f0-9-]+\.webp$/),
		);
	});

	// -----------------------------------------------------------------------
	// Invalid / non-object body
	// -----------------------------------------------------------------------
	it("returns 400 for missing JSON body", async () => {
		const res = await POST(
			new Request("http://localhost/api/guild/news/upload", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "not json",
			}),
		);

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/json/i);
	});

	it("returns 400 when body is JSON null", async () => {
		const res = await POST(buildRequest(null));

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/json/i);
	});

	it("returns 400 when body is a JSON array", async () => {
		const res = await POST(buildRequest([]));

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/json/i);
	});

	it("returns 400 when body is a JSON string", async () => {
		const res = await POST(buildRequest("hello"));

		expect(res.status).toBe(400);
	});

	// -----------------------------------------------------------------------
	// Missing / invalid fields
	// -----------------------------------------------------------------------
	it("returns 400 for missing fileName", async () => {
		const res = await POST(
			buildRequest({ mimeType: "image/jpeg", fileSize: 1024 }),
		);

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/fileName/);
	});

	it("returns 400 for missing mimeType", async () => {
		const res = await POST(buildRequest({ fileName: "x.jpg", fileSize: 1024 }));

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/mimeType/);
	});

	it("returns 400 for missing fileSize", async () => {
		const res = await POST(
			buildRequest({ fileName: "x.jpg", mimeType: "image/jpeg" }),
		);

		expect(res.status).toBe(400);
	});

	// -----------------------------------------------------------------------
	// MIME type validation
	// -----------------------------------------------------------------------
	it("returns 400 for unsupported MIME type", async () => {
		const res = await POST(
			buildRequest({
				fileName: "x.pdf",
				mimeType: "application/pdf",
				fileSize: 1024,
			}),
		);

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/no permitido/);
	});

	it("accepts all allowed MIME types", async () => {
		for (const mime of [
			"image/jpeg",
			"image/png",
			"image/webp",
			"image/gif",
			"image/avif",
		]) {
			vi.clearAllMocks();
			mockStorageFrom.mockReturnValue({
				createSignedUploadUrl: mockCreateSignedUploadUrl,
				getPublicUrl: mockGetPublicUrl,
			});
			mockCreateSignedUploadUrl.mockResolvedValue({
				data: { path: "x", token: "t", signedUrl: "u" },
				error: null,
			});
			mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "pu" } });

			const res = await POST(
				buildRequest({ fileName: "x.bin", mimeType: mime, fileSize: 1 }),
			);
			expect(res.status).toBe(200);
		}
	});

	// -----------------------------------------------------------------------
	// File size validation
	// -----------------------------------------------------------------------
	it("returns 400 for fileSize over 50 MB", async () => {
		const res = await POST(
			buildRequest({
				fileName: "big.jpg",
				mimeType: "image/jpeg",
				fileSize: 50 * 1024 * 1024 + 1,
			}),
		);

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/excede/);
	});

	it("returns 400 for fileSize of 0", async () => {
		const res = await POST(
			buildRequest({ fileName: "x.jpg", mimeType: "image/jpeg", fileSize: 0 }),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for negative fileSize", async () => {
		const res = await POST(
			buildRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: -100,
			}),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for non-integer fileSize", async () => {
		const res = await POST(
			buildRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: 5.5,
			}),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for null fileSize (JSON cannot encode NaN / Infinity)", async () => {
		// JSON.stringify({ fileSize: NaN }) → {"fileSize":null}
		// JSON.stringify({ fileSize: Infinity }) → {"fileSize":null}
		// Our route catches null via typeof !== 'number', returning 400 deterministically.
		const res = await POST(
			buildRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: null,
			}),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for string fileSize", async () => {
		const res = await POST(
			buildRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: "abc",
			}),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for boolean fileSize", async () => {
		const res = await POST(
			buildRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: true,
			}),
		);

		expect(res.status).toBe(400);
	});

	// -----------------------------------------------------------------------
	// Permission errors
	// -----------------------------------------------------------------------
	it("preserves 403 from ensureAppPermission", async () => {
		// Simulate a permission denial (ApiError with status 403)
		const permError = new Error("Role member cannot edit settings-news");
		(permError as any).status = 403;
		vi.mocked(ensureAppPermission).mockRejectedValue(permError);

		const res = await POST(
			buildRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: 1024,
			}),
		);

		expect(res.status).toBe(403);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/member/);
	});

	it("preserves 401 from ensureAppPermission", async () => {
		const authError = new Error("No session");
		(authError as any).status = 401;
		vi.mocked(ensureAppPermission).mockRejectedValue(authError);

		const res = await POST(
			buildRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: 1024,
			}),
		);

		expect(res.status).toBe(401);
	});

	// -----------------------------------------------------------------------
	// Signed URL failure
	// -----------------------------------------------------------------------
	it("returns 500 when createSignedUploadUrl fails", async () => {
		mockCreateSignedUploadUrl.mockResolvedValue({
			data: null,
			error: { name: "StorageError", message: "Bucket not found" },
		});

		const res = await POST(
			buildRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: 1024,
			}),
		);

		expect(res.status).toBe(500);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/autorización/);
	});

	// -----------------------------------------------------------------------
	// Edge case: exactly at 50 MB limit
	// -----------------------------------------------------------------------
	it("accepts fileSize exactly at 50 MB limit", async () => {
		const res = await POST(
			buildRequest({
				fileName: "max.jpg",
				mimeType: "image/jpeg",
				fileSize: 50 * 1024 * 1024,
			}),
		);

		expect(res.status).toBe(200);
	});
});
