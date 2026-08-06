import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------
const {
	mockFromChain,
	mockGetPublicUrl,
	mockStorageFrom,
	mockStorageList,
	mockCreateSignedUploadUrl,
} = vi.hoisted(() => ({
	mockFromChain: vi.fn(),
	mockGetPublicUrl: vi.fn(),
	mockStorageFrom: vi.fn(),
	mockStorageList: vi.fn(),
	mockCreateSignedUploadUrl: vi.fn(),
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

import { GET, POST } from "./route";
import { ensureAppPermission } from "@/shared/auth/permissions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildRequest(searchParams: string = "bucket=news-images"): Request {
	return new Request(`http://localhost/api/media?${searchParams}`, {
		method: "GET",
	});
}

async function jsonBody(res: Response) {
	return res.json();
}

function makeFileRow(overrides: Record<string, unknown> = {}) {
	return {
		id: "file-111-aaa",
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

function buildPostRequest(body: unknown): Request {
	return new Request("http://localhost/api/media", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(ensureAppPermission).mockResolvedValue(undefined as any);

	// GET mock defaults
	mockStorageFrom.mockReturnValue({
		getPublicUrl: mockGetPublicUrl,
		createSignedUploadUrl: mockCreateSignedUploadUrl,
		listV2: mockStorageList,
	});
	mockStorageList.mockResolvedValue({
		data: { objects: [], folders: [], hasNext: false, nextCursor: null },
		error: null,
	});
	mockGetPublicUrl.mockReturnValue({
		data: { publicUrl: "https://storage.supabase.co/public/bucket/abc123.jpg" },
	});

	// POST mock defaults: signed URL succeeds
	mockCreateSignedUploadUrl.mockResolvedValue({
		data: {
			path: "abc123.jpg",
			token: "signed-token-123",
			signedUrl: "https://storage.supabase.co/signed-url",
		},
		error: null,
	});
});

// ===========================================================================
// Test suite: GET /api/media
// ===========================================================================
describe("GET /api/media", () => {
	// -----------------------------------------------------------------------
	// Success
	// -----------------------------------------------------------------------
	it("returns paginated list of files with URLs", async () => {
		const files = [
			makeFileRow({ id: "f1", storage_path: "img1.jpg" }),
			makeFileRow({
				id: "f2",
				storage_path: "img2.png",
				mime_type: "image/png",
			}),
		];

		mockStorageList.mockResolvedValue({
			data: {
				objects: [{ name: "img1.jpg" }, { name: "img2.png" }],
				folders: [],
				hasNext: false,
				nextCursor: null,
			},
			error: null,
		});
		mockFromChain.mockReturnValue(mockQueryResult(files));

		const res = await GET(buildRequest("bucket=news-images&limit=50"));

		expect(res.status).toBe(200);
		expect(ensureAppPermission).toHaveBeenCalledWith("media-library", "view");
		expect(mockFromChain).toHaveBeenCalledWith("media_metadata");

		const body = await jsonBody(res);
		expect(body).toHaveProperty("files");
		expect(body.files).toHaveLength(2);
		expect(body.files[0]).toHaveProperty("url");
		expect(body.files[1]).toHaveProperty("url");
	});

	it("returns nextCursor when more results exist", async () => {
		const files = Array.from({ length: 51 }, (_, i) =>
			makeFileRow({
				id: `f${i}`,
				storage_path: `img${i}.jpg`,
				created_at: `2024-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
			}),
		);

		// Storage returns only 50 objects (the limit), with hasNext:true signalling more exist
		mockStorageList.mockResolvedValue({
			data: {
				objects: files.slice(0, 50).map((f) => ({ name: f.storage_path })),
				folders: [],
				hasNext: true,
				nextCursor: "next-cursor",
			},
			error: null,
		});
		mockFromChain.mockReturnValue(mockQueryResult(files.slice(0, 50)));

		const res = await GET(buildRequest("bucket=news-images&limit=50"));

		expect(res.status).toBe(200);
		const body = await jsonBody(res);
		expect(body.files).toHaveLength(50);
		expect(body.nextCursor).toBeTruthy();
	});

	it("returns no nextCursor when fewer results than limit", async () => {
		const files = [makeFileRow()];

		mockStorageList.mockResolvedValue({
			data: {
				objects: [{ name: "abc123.jpg" }],
				folders: [],
				hasNext: false,
				nextCursor: null,
			},
			error: null,
		});
		mockFromChain.mockReturnValue(mockQueryResult(files));

		const res = await GET(buildRequest("bucket=news-images"));

		expect(res.status).toBe(200);
		const body = await jsonBody(res);
		expect(body.nextCursor).toBeNull();
	});

	it("returns empty array for bucket with no files", async () => {
		mockFromChain.mockReturnValue(mockQueryResult([]));

		const res = await GET(buildRequest("bucket=empty-bucket"));

		expect(res.status).toBe(200);
		const body = await jsonBody(res);
		expect(body.files).toEqual([]);
		expect(body.nextCursor).toBeNull();
	});

	// -----------------------------------------------------------------------
	// Filters
	// -----------------------------------------------------------------------
	it("filters by search term", async () => {
		mockStorageList.mockResolvedValue({
			data: {
				objects: [{ name: "abc123.jpg" }],
				folders: [],
				hasNext: false,
				nextCursor: null,
			},
			error: null,
		});
		mockFromChain.mockReturnValue(
			mockQueryResult([makeFileRow({ id: "f1", title: "hero" })]),
		);

		const res = await GET(buildRequest("bucket=news-images&search=hero"));

		expect(res.status).toBe(200);
		const body = await jsonBody(res);
		expect(body.files).toHaveLength(1);
	});

	it("filters by image type", async () => {
		mockStorageList.mockResolvedValue({
			data: {
				objects: [{ name: "abc123.jpg" }],
				folders: [],
				hasNext: false,
				nextCursor: null,
			},
			error: null,
		});
		mockFromChain.mockReturnValue(mockQueryResult([makeFileRow()]));

		const res = await GET(buildRequest("bucket=news-images&type=image"));

		expect(res.status).toBe(200);
	});

	// -----------------------------------------------------------------------
	// Validation
	// -----------------------------------------------------------------------
	it("returns 400 when bucket param is missing", async () => {
		const res = await GET(buildRequest(""));

		expect(res.status).toBe(400);
	});

	it("returns 400 for invalid type enum", async () => {
		const res = await GET(buildRequest("bucket=news-images&type=video"));

		expect(res.status).toBe(400);
	});

	it("returns 400 for limit over 100", async () => {
		const res = await GET(buildRequest("bucket=news-images&limit=200"));

		expect(res.status).toBe(400);
	});

	it("returns 400 for limit of 0", async () => {
		const res = await GET(buildRequest("bucket=news-images&limit=0"));

		expect(res.status).toBe(400);
	});

	// -----------------------------------------------------------------------
	// Permissions
	// -----------------------------------------------------------------------
	it("returns 403 when permission denied", async () => {
		const permError = new Error("Role member cannot view media-library");
		(permError as any).status = 403;
		vi.mocked(ensureAppPermission).mockRejectedValue(permError);

		const res = await GET(buildRequest());

		expect(res.status).toBe(403);
	});

	// -----------------------------------------------------------------------
	// Server error
	// -----------------------------------------------------------------------
	it("returns 500 on database error", async () => {
		mockStorageList.mockResolvedValue({
			data: null,
			error: { message: "Connection refused" },
		});

		const res = await GET(buildRequest());

		expect(res.status).toBe(500);
	});

	// -----------------------------------------------------------------------
	// TRIANGULATE: cursor pagination edge cases
	// -----------------------------------------------------------------------
	it("returns nextCursor as null at exact page boundary", async () => {
		// Exactly 50 items (limit 50) — no extra, so no nextCursor
		const files = Array.from({ length: 50 }, (_, i) =>
			makeFileRow({
				id: `f${i}`,
				storage_path: `img${i}.jpg`,
				created_at: `2024-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
			}),
		);

		mockStorageList.mockResolvedValue({
			data: {
				objects: files.map((f) => ({ name: f.storage_path })),
				folders: [],
				hasNext: false,
				nextCursor: null,
			},
			error: null,
		});
		mockFromChain.mockReturnValue(mockQueryResult(files));

		const res = await GET(buildRequest("bucket=news-images&limit=50"));

		expect(res.status).toBe(200);
		const body = await jsonBody(res);
		expect(body.files).toHaveLength(50);
		expect(body.nextCursor).toBeNull();
	});

	it("paginates with cursor (second page)", async () => {
		// Encode cursor for page 2
		const cursor = Buffer.from("2024-01-31T00:00:00Z|f30").toString(
			"base64url",
		);

		const files = [
			makeFileRow({ id: "f31", storage_path: "img31.jpg" }),
			makeFileRow({ id: "f32", storage_path: "img32.jpg" }),
		];

		mockStorageList.mockResolvedValue({
			data: {
				objects: [{ name: "img31.jpg" }, { name: "img32.jpg" }],
				folders: [],
				hasNext: false,
				nextCursor: null,
			},
			error: null,
		});
		mockFromChain.mockReturnValue(mockQueryResult(files));

		const res = await GET(
			buildRequest(`bucket=news-images&limit=50&cursor=${cursor}`),
		);

		expect(res.status).toBe(200);
		const body = await jsonBody(res);
		expect(body.files).toHaveLength(2);
		// No next page since only 2 results
		expect(body.nextCursor).toBeNull();
	});

	it("returns empty for no-results search", async () => {
		mockFromChain.mockReturnValue(mockQueryResult([]));

		const res = await GET(
			buildRequest("bucket=news-images&search=xyzzy_nonexistent"),
		);

		expect(res.status).toBe(200);
		const body = await jsonBody(res);
		expect(body.files).toEqual([]);
	});

	it("filters by document type", async () => {
		mockStorageList.mockResolvedValue({
			data: {
				objects: [{ name: "abc123.jpg" }],
				folders: [],
				hasNext: false,
				nextCursor: null,
			},
			error: null,
		});
		mockFromChain.mockReturnValue(
			mockQueryResult([makeFileRow({ mime_type: "application/pdf" })]),
		);

		const res = await GET(buildRequest("bucket=news-images&type=document"));

		expect(res.status).toBe(200);
	});

	it("handles search with special characters", async () => {
		mockStorageList.mockResolvedValue({
			data: {
				objects: [{ name: "abc123.jpg" }],
				folders: [],
				hasNext: false,
				nextCursor: null,
			},
			error: null,
		});
		mockFromChain.mockReturnValue(mockQueryResult([makeFileRow()]));

		const res = await GET(
			buildRequest("bucket=news-images&search=imagen%20con%20espacio"),
		);

		expect(res.status).toBe(200);
	});
});

// ===========================================================================
// Test suite: POST /api/media (signed upload URL)
// ===========================================================================
describe("POST /api/media", () => {
	// -----------------------------------------------------------------------
	// Success
	// -----------------------------------------------------------------------
	it("returns path, token, signedUrl and publicUrl on valid request", async () => {
		// Mock bucket exists in media_folders
		mockFromChain.mockReturnValue(
			mockQueryResult({ id: "folder-1", bucket_name: "news-images" }),
		);

		const res = await POST(
			buildPostRequest({
				fileName: "hero.jpg",
				mimeType: "image/jpeg",
				fileSize: 102400,
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(200);
		const body = await jsonBody(res);
		expect(body).toMatchObject({
			path: "abc123.jpg",
			token: "signed-token-123",
			signedUrl: "https://storage.supabase.co/signed-url",
			publicUrl: "https://storage.supabase.co/public/bucket/abc123.jpg",
		});

		expect(ensureAppPermission).toHaveBeenCalledWith("media-library", "edit");
		expect(mockStorageFrom).toHaveBeenCalledWith("news-images");
		expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith(
			expect.stringMatching(/^[a-f0-9-]+\.jpg$/),
		);
	});

	it("generates correct extension for webp", async () => {
		mockFromChain.mockReturnValue(
			mockQueryResult({ id: "folder-1", bucket_name: "news-images" }),
		);

		const res = await POST(
			buildPostRequest({
				fileName: "banner.webp",
				mimeType: "image/webp",
				fileSize: 1,
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(200);
		expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith(
			expect.stringMatching(/^[a-f0-9-]+\.webp$/),
		);
	});

	// -----------------------------------------------------------------------
	// Invalid / non-object body
	// -----------------------------------------------------------------------
	it("returns 400 for missing JSON body", async () => {
		const res = await POST(
			new Request("http://localhost/api/media", {
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
		const res = await POST(buildPostRequest(null));

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/json/i);
	});

	it("returns 400 when body is a JSON array", async () => {
		const res = await POST(buildPostRequest([]));

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/json/i);
	});

	it("returns 400 when body is a JSON string", async () => {
		const res = await POST(buildPostRequest("hello"));

		expect(res.status).toBe(400);
	});

	// -----------------------------------------------------------------------
	// Missing / invalid fields
	// -----------------------------------------------------------------------
	it("returns 400 for missing fileName", async () => {
		const res = await POST(
			buildPostRequest({
				mimeType: "image/jpeg",
				fileSize: 1024,
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/fileName/);
	});

	it("returns 400 for missing mimeType", async () => {
		const res = await POST(
			buildPostRequest({
				fileName: "x.jpg",
				fileSize: 1024,
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/mimeType/);
	});

	it("returns 400 for missing fileSize", async () => {
		const res = await POST(
			buildPostRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for missing bucket", async () => {
		const res = await POST(
			buildPostRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: 1024,
			}),
		);

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/arpeta/i);
	});

	// -----------------------------------------------------------------------
	// MIME type validation
	// -----------------------------------------------------------------------
	it("returns 400 for unsupported MIME type", async () => {
		mockFromChain.mockReturnValue(
			mockQueryResult({ id: "folder-1", bucket_name: "news-images" }),
		);

		const res = await POST(
			buildPostRequest({
				fileName: "x.pdf",
				mimeType: "application/pdf",
				fileSize: 1024,
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/no permitido/);
	});

	it("returns 400 for unknown bucket", async () => {
		mockFromChain.mockReturnValue(mockQueryResult(null));

		const res = await POST(
			buildPostRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: 1024,
				bucket: "nonexistent-bucket",
			}),
		);

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/arpeta/i);
	});

	it("accepts all allowed image MIME types", async () => {
		const allowed = [
			"image/jpeg",
			"image/png",
			"image/webp",
			"image/gif",
			"image/avif",
			"image/svg+xml",
		];

		for (const mime of allowed) {
			vi.clearAllMocks();
			vi.mocked(ensureAppPermission).mockResolvedValue(undefined as any);

			mockFromChain.mockReturnValue(
				mockQueryResult({ id: "f", bucket_name: "news-images" }),
			);
			mockStorageFrom.mockReturnValue({
				getPublicUrl: mockGetPublicUrl,
				createSignedUploadUrl: mockCreateSignedUploadUrl,
			});
			mockGetPublicUrl.mockReturnValue({
				data: { publicUrl: "pu" },
			});
			mockCreateSignedUploadUrl.mockResolvedValue({
				data: { path: "x", token: "t", signedUrl: "u" },
				error: null,
			});

			const res = await POST(
				buildPostRequest({
					fileName: "x.bin",
					mimeType: mime,
					fileSize: 1,
					bucket: "news-images",
				}),
			);
			expect(res.status).toBe(200);
		}
	});

	// -----------------------------------------------------------------------
	// File size validation
	// -----------------------------------------------------------------------
	it("returns 400 for fileSize over 50 MB", async () => {
		mockFromChain.mockReturnValue(
			mockQueryResult({ id: "folder-1", bucket_name: "news-images" }),
		);

		const res = await POST(
			buildPostRequest({
				fileName: "big.jpg",
				mimeType: "image/jpeg",
				fileSize: 50 * 1024 * 1024 + 1,
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(400);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/excede/);
	});

	it("returns 400 for fileSize of 0", async () => {
		const res = await POST(
			buildPostRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: 0,
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for negative fileSize", async () => {
		const res = await POST(
			buildPostRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: -100,
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for non-integer fileSize", async () => {
		const res = await POST(
			buildPostRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: 5.5,
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for null fileSize (NaN/Infinity → null in JSON)", async () => {
		const res = await POST(
			buildPostRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: null,
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(400);
	});

	it("returns 400 for string fileSize", async () => {
		const res = await POST(
			buildPostRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: "abc",
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(400);
	});

	// -----------------------------------------------------------------------
	// Permission errors
	// -----------------------------------------------------------------------
	it("preserves 403 from ensureAppPermission", async () => {
		const permError = new Error("Role member cannot edit media-library");
		(permError as any).status = 403;
		vi.mocked(ensureAppPermission).mockRejectedValue(permError);

		const res = await POST(
			buildPostRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: 1024,
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(403);
	});

	it("preserves 401 from ensureAppPermission", async () => {
		const authError = new Error("No session");
		(authError as any).status = 401;
		vi.mocked(ensureAppPermission).mockRejectedValue(authError);

		const res = await POST(
			buildPostRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: 1024,
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(401);
	});

	// -----------------------------------------------------------------------
	// Signed URL failure
	// -----------------------------------------------------------------------
	it("returns 500 when createSignedUploadUrl fails", async () => {
		mockFromChain.mockReturnValue(
			mockQueryResult({ id: "folder-1", bucket_name: "news-images" }),
		);
		mockCreateSignedUploadUrl.mockResolvedValue({
			data: null,
			error: { name: "StorageError", message: "Bucket not found" },
		});

		const res = await POST(
			buildPostRequest({
				fileName: "x.jpg",
				mimeType: "image/jpeg",
				fileSize: 1024,
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(500);
		const body = await jsonBody(res);
		expect(body.error).toMatch(/autorización/);
	});

	// -----------------------------------------------------------------------
	// TRIANGULATE: exact boundary
	// -----------------------------------------------------------------------
	it("accepts fileSize exactly at 50 MB limit", async () => {
		mockFromChain.mockReturnValue(
			mockQueryResult({ id: "folder-1", bucket_name: "news-images" }),
		);

		const res = await POST(
			buildPostRequest({
				fileName: "max.jpg",
				mimeType: "image/jpeg",
				fileSize: 50 * 1024 * 1024,
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(200);
	});

	it("accepts PDF for attachments bucket", async () => {
		mockFromChain.mockReturnValue(
			mockQueryResult({ id: "folder-2", bucket_name: "attachments" }),
		);

		const res = await POST(
			buildPostRequest({
				fileName: "doc.pdf",
				mimeType: "application/pdf",
				fileSize: 1024,
				bucket: "attachments",
			}),
		);

		expect(res.status).toBe(200);
	});

	it("returns 400 for special characters in fileName", async () => {
		mockFromChain.mockReturnValue(
			mockQueryResult({ id: "folder-1", bucket_name: "news-images" }),
		);

		// fileName with special chars should still be accepted
		const res = await POST(
			buildPostRequest({
				fileName: "imagen con espacios y ñ.jpg",
				mimeType: "image/jpeg",
				fileSize: 1024,
				bucket: "news-images",
			}),
		);

		expect(res.status).toBe(200);
	});
});
