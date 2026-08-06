import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------
const {
	mockCreateSignedUploadUrl,
	mockGetPublicUrl,
	mockRemove,
	mockMove,
	mockList,
	mockStorageFrom,
} = vi.hoisted(() => ({
	mockCreateSignedUploadUrl: vi.fn(),
	mockGetPublicUrl: vi.fn(),
	mockRemove: vi.fn(),
	mockMove: vi.fn(),
	mockList: vi.fn(),
	mockStorageFrom: vi.fn(),
}));

vi.mock("@/shared/lib/supabase-admin", () => ({
	supabaseAdmin: {
		storage: {
			from: mockStorageFrom,
		},
	},
}));

import {
	createSignedUploadUrl,
	getPublicUrl,
	deleteFile,
	moveFile,
	bulkDelete,
} from "../storage";

// ---------------------------------------------------------------------------
beforeEach(() => {
	vi.clearAllMocks();
	mockStorageFrom.mockReturnValue({
		createSignedUploadUrl: mockCreateSignedUploadUrl,
		getPublicUrl: mockGetPublicUrl,
		remove: mockRemove,
		move: mockMove,
		list: mockList,
	});
});

// ═══════════════════════════════════════════
// createSignedUploadUrl
// ═══════════════════════════════════════════
describe("createSignedUploadUrl", () => {
	it("returns signed URL data", async () => {
		mockCreateSignedUploadUrl.mockResolvedValue({
			data: {
				path: "abc-123.jpg",
				token: "token-xyz",
				signedUrl: "https://storage.example.com/signed/abc-123.jpg",
			},
		});

		const result = await createSignedUploadUrl("news-images", "abc-123.jpg");

		expect(mockStorageFrom).toHaveBeenCalledWith("news-images");
		expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith("abc-123.jpg");
		expect(result).toEqual({
			path: "abc-123.jpg",
			token: "token-xyz",
			signedUrl: "https://storage.example.com/signed/abc-123.jpg",
		});
	});

	it("throws when signed URL creation fails", async () => {
		mockCreateSignedUploadUrl.mockResolvedValue({
			data: null,
			error: { message: "Bucket not found" },
		});

		await expect(
			createSignedUploadUrl("no-bucket", "file.jpg"),
		).rejects.toThrow("Bucket not found");
	});

	it("throws when signed URL returns no data", async () => {
		mockCreateSignedUploadUrl.mockResolvedValue({ data: null, error: null });

		await expect(
			createSignedUploadUrl("news-images", "file.jpg"),
		).rejects.toThrow("No se pudo generar la URL firmada");
	});
});

// ═══════════════════════════════════════════
// getPublicUrl
// ═══════════════════════════════════════════
describe("getPublicUrl", () => {
	it("returns public URL for a file", () => {
		mockGetPublicUrl.mockReturnValue({
			data: { publicUrl: "https://storage.example.com/public/file.jpg" },
		});

		const url = getPublicUrl("news-images", "file.jpg");

		expect(mockStorageFrom).toHaveBeenCalledWith("news-images");
		expect(mockGetPublicUrl).toHaveBeenCalledWith("file.jpg");
		expect(url).toBe("https://storage.example.com/public/file.jpg");
	});
});

// ═══════════════════════════════════════════
// deleteFile
// ═══════════════════════════════════════════
describe("deleteFile", () => {
	it("deletes a single file from storage", async () => {
		mockRemove.mockResolvedValue({ data: [{ id: "1" }], error: null });

		await deleteFile("news-images", "file.jpg");

		expect(mockStorageFrom).toHaveBeenCalledWith("news-images");
		expect(mockRemove).toHaveBeenCalledWith(["file.jpg"]);
	});

	it("throws on deletion error", async () => {
		mockRemove.mockResolvedValue({
			data: null,
			error: { message: "Permission denied" },
		});

		await expect(deleteFile("news-images", "file.jpg")).rejects.toThrow(
			"Permission denied",
		);
	});
});

// ═══════════════════════════════════════════
// moveFile
// ═══════════════════════════════════════════
describe("moveFile", () => {
	it("moves a file within a bucket", async () => {
		mockMove.mockResolvedValue({ data: { message: "Success" }, error: null });

		await moveFile("news-images", "old.jpg", "new.jpg");

		expect(mockStorageFrom).toHaveBeenCalledWith("news-images");
		expect(mockMove).toHaveBeenCalledWith("old.jpg", "new.jpg");
	});

	it("throws on move error", async () => {
		mockMove.mockResolvedValue({
			data: null,
			error: { message: "Target already exists" },
		});

		await expect(
			moveFile("news-images", "old.jpg", "existing.jpg"),
		).rejects.toThrow("Target already exists");
	});
});

// ═══════════════════════════════════════════
// bulkDelete
// ═══════════════════════════════════════════
describe("bulkDelete", () => {
	it("deletes a single file", async () => {
		mockRemove.mockResolvedValue({ data: [{ id: "1" }], error: null });

		const result = await bulkDelete("news-images", ["file.jpg"]);

		expect(result.success).toBe(true);
		expect(result.processed).toBe(1);
		expect(mockRemove).toHaveBeenCalledTimes(1);
		expect(mockRemove).toHaveBeenCalledWith(["file.jpg"]);
	});

	it("deletes 49 files in one batch", async () => {
		mockRemove.mockResolvedValue({ data: [], error: null });
		const paths = Array.from({ length: 49 }, (_, i) => `file-${i}.jpg`);

		const result = await bulkDelete("news-images", paths);

		expect(result.processed).toBe(49);
		expect(result.success).toBe(true);
		expect(mockRemove).toHaveBeenCalledTimes(1);
		expect(mockRemove).toHaveBeenCalledWith(paths);
	});

	it("deletes 50 files in one batch", async () => {
		mockRemove.mockResolvedValue({ data: [], error: null });
		const paths = Array.from({ length: 50 }, (_, i) => `file-${i}.jpg`);

		const result = await bulkDelete("news-images", paths);

		expect(result.processed).toBe(50);
		expect(result.success).toBe(true);
		expect(mockRemove).toHaveBeenCalledTimes(1);
	});

	it("splits 100 files into 2 batches of 50", async () => {
		mockRemove.mockResolvedValue({ data: [], error: null });
		const paths = Array.from({ length: 100 }, (_, i) => `file-${i}.jpg`);

		const result = await bulkDelete("news-images", paths);

		expect(result.processed).toBe(100);
		expect(result.success).toBe(true);
		expect(mockRemove).toHaveBeenCalledTimes(2);
		// First batch: 50 items
		expect(mockRemove).toHaveBeenNthCalledWith(1, paths.slice(0, 50));
		// Second batch: 50 items
		expect(mockRemove).toHaveBeenNthCalledWith(2, paths.slice(50, 100));
	});

	it("splits 150 files into 3 batches of 50", async () => {
		mockRemove.mockResolvedValue({ data: [], error: null });
		const paths = Array.from({ length: 150 }, (_, i) => `file-${i}.jpg`);

		const result = await bulkDelete("news-images", paths);

		expect(result.processed).toBe(150);
		expect(mockRemove).toHaveBeenCalledTimes(3);
	});

	it("returns errors for partial batch failures", async () => {
		// First call succeeds (50 files), second fails (counts 0)
		mockRemove
			.mockResolvedValueOnce({ data: [], error: null })
			.mockResolvedValueOnce({
				data: null,
				error: { message: "Storage error" },
			});

		const paths = Array.from({ length: 100 }, (_, i) => `file-${i}.jpg`);

		const result = await bulkDelete("news-images", paths);

		expect(result.success).toBe(false);
		expect(result.processed).toBe(50);
		expect(result.errors).toBeDefined();
		expect(result.errors?.length).toBe(1);
		expect(result.errors?.[0]).toMatch(/error/i);
	});

	it("returns empty result for empty paths array", async () => {
		const result = await bulkDelete("news-images", []);

		expect(result.processed).toBe(0);
		expect(result.success).toBe(true);
		expect(mockRemove).not.toHaveBeenCalled();
	});

	// --- TRIANGULATE ---

	it("handles batch where every call in sequence fails", async () => {
		mockRemove.mockRejectedValue(new Error("Network failure"));
		const paths = Array.from({ length: 10 }, (_, i) => `file-${i}.jpg`);

		await expect(bulkDelete("news-images", paths)).rejects.toThrow(
			"Network failure",
		);
	});

	it("handles exactly 51 files (batch of 50 + batch of 1)", async () => {
		mockRemove.mockResolvedValue({ data: [], error: null });
		const paths = Array.from({ length: 51 }, (_, i) => `file-${i}.jpg`);

		const result = await bulkDelete("news-images", paths);

		expect(result.processed).toBe(51);
		expect(mockRemove).toHaveBeenCalledTimes(2);
		expect(mockRemove).toHaveBeenNthCalledWith(1, paths.slice(0, 50));
		expect(mockRemove).toHaveBeenNthCalledWith(2, paths.slice(50, 51));
	});

	it("continues processing after a batch failure", async () => {
		mockRemove
			.mockResolvedValueOnce({
				data: null,
				error: { message: "Fail batch 1" },
			})
			.mockResolvedValueOnce({ data: [], error: null });

		const paths = Array.from({ length: 100 }, (_, i) => `file-${i}.jpg`);
		const result = await bulkDelete("news-images", paths);

		expect(result.processed).toBe(50);
		expect(result.success).toBe(false);
		expect(result.errors?.length).toBe(1);
	});
});
