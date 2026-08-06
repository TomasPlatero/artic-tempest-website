/**
 * @vitest-environment jsdom
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { SWRConfig } from "swr";
import { useMediaFiles } from "../use-media-files";

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function createMockResponse(
	body: Record<string, unknown>,
	status = 200,
): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
		headers: new Headers(),
	} as Response;
}

// ---------------------------------------------------------------------------
// Fresh SWR cache per test to prevent cross-test cache contamination
// ---------------------------------------------------------------------------
function freshCacheWrapper() {
	const FreshCacheProvider = ({ children }: { children: React.ReactNode }) =>
		React.createElement(
			SWRConfig,
			{ value: { provider: () => new Map() } },
			children,
		);
	FreshCacheProvider.displayName = "FreshCacheProvider";
	return FreshCacheProvider;
}

// ---------------------------------------------------------------------------
// T014: useMediaFiles Hook Tests
// ---------------------------------------------------------------------------
describe("useMediaFiles", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetch.mockReset();
	});

	// ── Initial load ──────────────────────────
	describe("initial load", () => {
		it("fetches files for a bucket on mount", async () => {
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					files: [
						{
							id: "file-1",
							bucket: "news-images",
							storage_path: "img1.jpg",
							title: "Test Image",
							file_size: 1024,
							mime_type: "image/jpeg",
							url: "https://example.com/img1.jpg",
						},
					],
					nextCursor: null,
					total: 1,
				}),
			);

			const { result } = renderHook(
				() => useMediaFiles({ bucket: "news-images" }),
				{ wrapper: freshCacheWrapper() },
			);

			// Initially loading
			expect(result.current.isLoading).toBe(true);
			expect(result.current.files).toEqual([]);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.files).toHaveLength(1);
			expect(result.current.files[0].id).toBe("file-1");
			expect(result.current.total).toBe(1);
			expect(result.current.hasMore).toBe(false);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/media?bucket=news-images"),
			);
		});

		it("sets error state on fetch failure", async () => {
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			const { result } = renderHook(
				() => useMediaFiles({ bucket: "news-images" }),
				{ wrapper: freshCacheWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.error).toBeTruthy();
			expect(result.current.files).toEqual([]);
		});

		it("handles non-200 response as error", async () => {
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ error: "Bucket not found" }, 400),
			);

			const { result } = renderHook(
				() => useMediaFiles({ bucket: "news-images" }),
				{ wrapper: freshCacheWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.error).toBeTruthy();
		});
	});

	// ── Pagination ────────────────────────────
	describe("pagination", () => {
		it("sets hasMore=true when nextCursor is provided", async () => {
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					files: [
						{
							id: "file-1",
							bucket: "n",
							storage_path: "a.jpg",
							file_size: 1,
							mime_type: "image/jpeg",
							url: "",
						},
					],
					nextCursor: "cursor-abc",
					total: 3,
				}),
			);

			const { result } = renderHook(
				() => useMediaFiles({ bucket: "news-images" }),
				{ wrapper: freshCacheWrapper() },
			);

			await waitFor(() => {
				expect(result.current.hasMore).toBe(true);
			});

			expect(result.current.files).toHaveLength(1);
		});

		it("loadMore appends files using cursor", async () => {
			// First page
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					files: [
						{
							id: "file-1",
							bucket: "n",
							storage_path: "a.jpg",
							file_size: 1,
							mime_type: "image/jpeg",
							url: "",
						},
					],
					nextCursor: "cursor-1",
					total: 3,
				}),
			);

			const { result } = renderHook(
				() => useMediaFiles({ bucket: "news-images" }),
				{ wrapper: freshCacheWrapper() },
			);

			await waitFor(() => {
				expect(result.current.files).toHaveLength(1);
			});

			// Second page
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					files: [
						{
							id: "file-2",
							bucket: "n",
							storage_path: "b.jpg",
							file_size: 1,
							mime_type: "image/jpeg",
							url: "",
						},
						{
							id: "file-3",
							bucket: "n",
							storage_path: "c.jpg",
							file_size: 1,
							mime_type: "image/jpeg",
							url: "",
						},
					],
					nextCursor: null,
					total: 3,
				}),
			);

			await act(async () => {
				await result.current.loadMore();
			});

			expect(result.current.files).toHaveLength(3);
			expect(result.current.hasMore).toBe(false);
			expect(mockFetch).toHaveBeenCalledTimes(2);
			expect(mockFetch).toHaveBeenLastCalledWith(
				expect.stringContaining("cursor=cursor-1"),
			);
		});

		it("does not load more when already loading", async () => {
			// Never resolves on first attempt (simulating slow load)
			let resolveFirst: (value: Response) => void;
			const firstPromise = new Promise<Response>((resolve) => {
				resolveFirst = resolve;
			});
			mockFetch.mockReturnValueOnce(firstPromise);

			const { result } = renderHook(
				() => useMediaFiles({ bucket: "news-images" }),
				{ wrapper: freshCacheWrapper() },
			);

			// Try to load more while first is still loading
			await act(async () => {
				await result.current.loadMore();
			});

			// Should only have called fetch once
			expect(mockFetch).toHaveBeenCalledTimes(1);

			// Resolve the first
			resolveFirst!(
				createMockResponse({
					files: [
						{
							id: "f1",
							bucket: "n",
							storage_path: "a.jpg",
							file_size: 1,
							mime_type: "image/jpeg",
							url: "",
						},
					],
					nextCursor: null,
					total: 1,
				}),
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});
		});
	});

	// ── Filters ───────────────────────────────
	describe("filters", () => {
		it("passes type filter to API", async () => {
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ files: [], nextCursor: null, total: 0 }),
			);

			renderHook(
				() => useMediaFiles({ bucket: "news-images", type: "image" }),
				{ wrapper: freshCacheWrapper() },
			);

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledWith(
					expect.stringContaining("type=image"),
				);
			});
		});

		it("passes search query to API", async () => {
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ files: [], nextCursor: null, total: 0 }),
			);

			renderHook(
				() => useMediaFiles({ bucket: "news-images", search: "hero" }),
				{ wrapper: freshCacheWrapper() },
			);

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledWith(
					expect.stringContaining("search=hero"),
				);
			});
		});

		it("refetches when bucket changes", async () => {
			mockFetch
				.mockResolvedValueOnce(
					createMockResponse({ files: [], nextCursor: null, total: 0 }),
				)
				.mockResolvedValueOnce(
					createMockResponse({ files: [], nextCursor: null, total: 0 }),
				);

			const { rerender } = renderHook(
				({ bucket }) => useMediaFiles({ bucket }),
				{
					initialProps: { bucket: "news-images" },
					wrapper: freshCacheWrapper(),
				},
			);

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledTimes(1);
			});

			rerender({ bucket: "guild_assets" });

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledTimes(2);
				expect(mockFetch).toHaveBeenLastCalledWith(
					expect.stringContaining("bucket=guild_assets"),
				);
			});
		});

		it("refetches when search changes", async () => {
			mockFetch
				.mockResolvedValueOnce(
					createMockResponse({ files: [], nextCursor: null, total: 0 }),
				)
				.mockResolvedValueOnce(
					createMockResponse({ files: [], nextCursor: null, total: 0 }),
				);

			const { rerender } = renderHook(
				({ search }) =>
					useMediaFiles({
						bucket: "news-images",
						search: search as string | undefined,
					}),
				{
					initialProps: { search: undefined as string | undefined },
					wrapper: freshCacheWrapper(),
				},
			);

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledTimes(1);
			});

			rerender({ search: "hero" });

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledTimes(2);
			});
		});
	});

	// ── Edge cases ────────────────────────────
	describe("edge cases", () => {
		it("handles empty results", async () => {
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ files: [], nextCursor: null, total: 0 }),
			);

			const { result } = renderHook(
				() => useMediaFiles({ bucket: "empty-bucket" }),
				{ wrapper: freshCacheWrapper() },
			);

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.files).toEqual([]);
			expect(result.current.total).toBe(0);
			expect(result.current.hasMore).toBe(false);
		});

		it("encodes search param for special characters", async () => {
			mockFetch.mockResolvedValueOnce(
				createMockResponse({ files: [], nextCursor: null, total: 0 }),
			);

			renderHook(
				() =>
					useMediaFiles({ bucket: "news-images", search: "héroe & villano" }),
				{ wrapper: freshCacheWrapper() },
			);

			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledWith(
					expect.stringContaining("search=h%C3%A9roe+%26+villano"),
				);
			});
		});

		it("does not loadMore when hasMore is false", async () => {
			mockFetch.mockResolvedValueOnce(
				createMockResponse({
					files: [
						{
							id: "f1",
							bucket: "n",
							storage_path: "a.jpg",
							file_size: 1,
							mime_type: "image/jpeg",
							url: "",
						},
					],
					nextCursor: null,
					total: 1,
				}),
			);

			const { result } = renderHook(
				() => useMediaFiles({ bucket: "news-images" }),
				{ wrapper: freshCacheWrapper() },
			);

			await waitFor(() => {
				expect(result.current.hasMore).toBe(false);
			});

			await act(async () => {
				await result.current.loadMore();
			});

			// Still only one fetch
			expect(mockFetch).toHaveBeenCalledTimes(1);
		});
	});
});
