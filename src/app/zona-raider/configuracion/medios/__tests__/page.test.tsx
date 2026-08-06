import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// ---------------------------------------------------------------------------
// Mock dependencies (vi.hoisted pattern)
// ---------------------------------------------------------------------------
const {
	mockGetCachedServerSession,
	mockRedirect,
	mockGetAuthzSnapshot,
	mockGetAppPermission,
	mockMediaFoldersSelect,
	mockMediaFoldersOrder,
	mockMediaMetadataSelect,
	mockMediaMetadataIn,
	mockSupabaseFrom,
	mockStorageFrom,
	mockStorageList,
} = vi.hoisted(() => ({
	mockGetCachedServerSession: vi.fn(),
	mockRedirect: vi.fn(),
	mockGetAuthzSnapshot: vi.fn(),
	mockGetAppPermission: vi.fn(),
	mockMediaFoldersSelect: vi.fn(),
	mockMediaFoldersOrder: vi.fn(),
	mockMediaMetadataSelect: vi.fn(),
	mockMediaMetadataIn: vi.fn(),
	mockSupabaseFrom: vi.fn(),
	mockStorageFrom: vi.fn(),
	mockStorageList: vi.fn(),
}));

// redirect() must throw to stop execution
mockRedirect.mockImplementation(() => {
	throw new Error("NEXT_REDIRECT");
});

vi.mock("@/shared/auth/get-cached-server-session", () => ({
	getCachedServerSession: mockGetCachedServerSession,
}));

vi.mock("next/navigation", () => ({
	redirect: mockRedirect,
}));

vi.mock("@/shared/auth/authz", () => ({
	getAuthzSnapshot: mockGetAuthzSnapshot,
}));

vi.mock("@/shared/auth/permissions", () => ({
	getAppPermission: mockGetAppPermission,
}));

vi.mock("@/shared/lib/supabase-admin", () => ({
	supabaseAdmin: {
		from: mockSupabaseFrom,
		storage: {
			from: mockStorageFrom,
		},
	},
}));

// Mock Forbidden component
// Forbidden is NOT mocked — we check its real output text

// ── These imports happen AFTER vi.mock registrations ──

import MediaLibraryPage from "../page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeMockSession(overrides: Record<string, unknown> = {}) {
	return {
		user: {
			id: "user-1",
			name: "Test User",
			email: "test@test.com",
			roleLevel: "raider",
			...overrides,
		},
	};
}

function makeFolder(overrides: Record<string, unknown> = {}) {
	return {
		id: "folder-1",
		bucket_name: "news-images",
		display_name: "Imágenes de Noticias",
		description: "Imágenes destacadas",
		sort_order: 2,
		is_system: true,
		created_at: "2024-01-15T00:00:00Z",
		updated_at: "2024-01-15T00:00:00Z",
		...overrides,
	};
}

function extractClientProps(
	element: React.ReactNode,
): Record<string, unknown> | null {
	const stack: React.ReactNode[] = [element];
	while (stack.length > 0) {
		const current = stack.pop();
		if (!current || !React.isValidElement(current)) continue;
		const rawProps = current.props as Record<string, unknown>;
		const dataProps = rawProps["data-props"];
		if (typeof dataProps === "string") {
			try {
				return JSON.parse(dataProps);
			} catch {
				return null;
			}
		}
		if (rawProps.folders && rawProps.permissions) {
			return rawProps;
		}
		const children = rawProps.children;
		if (children) {
			if (Array.isArray(children)) {
				for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
			} else {
				stack.push(children as React.ReactNode);
			}
		}
	}
	return null;
}

// Setup mock chains before each test
function setupSupabaseMocks(
	folders: Record<string, unknown>[] = [],
	counts: Record<string, unknown>[] = [],
) {
	mockSupabaseFrom.mockImplementation((table: string) => {
		if (table === "media_folders") {
			return {
				select: mockMediaFoldersSelect,
			};
		}
		if (table === "media_metadata") {
			return {
				select: mockMediaMetadataSelect,
			};
		}
		return {
			select: vi.fn().mockReturnValue({
				order: vi.fn().mockResolvedValue({ data: [], error: null }),
			}),
		};
	});

	mockMediaFoldersSelect.mockReturnValue({ order: mockMediaFoldersOrder });
	mockMediaFoldersOrder.mockResolvedValue({ data: folders, error: null });

	mockMediaMetadataSelect.mockReturnValue({ in: mockMediaMetadataIn });
	mockMediaMetadataIn.mockResolvedValue({ data: counts, error: null });

	// Storage mock for file counts
	mockStorageFrom.mockReturnValue({ list: mockStorageList });
	mockStorageList.mockResolvedValue({ data: [], error: null });
}

// ═══════════════════════════════════════════
// T013: RSC Page Tests
// ═══════════════════════════════════════════
describe("MediaLibraryPage (RSC)", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Re-register redirect throw
		mockRedirect.mockImplementation(() => {
			throw new Error("NEXT_REDIRECT");
		});

		// Default setup: empty data
		setupSupabaseMocks([], []);
	});

	// ── Security ──────────────────────────────
	describe("authentication", () => {
		it("redirects to / when no session exists", async () => {
			mockGetCachedServerSession.mockResolvedValue(null);

			try {
				await MediaLibraryPage();
			} catch {
				// Expected — redirect throws
			}

			expect(mockRedirect).toHaveBeenCalledWith("/");
		});

		it("renders Forbidden when user lacks canView permission", async () => {
			mockGetCachedServerSession.mockResolvedValue(makeMockSession());
			mockGetAuthzSnapshot.mockResolvedValue({
				roleSlug: "member",
				scope: "member",
				sources: {},
			});
			mockGetAppPermission.mockResolvedValue({
				canView: false,
				canEdit: false,
				canManage: false,
			});

			const element = await MediaLibraryPage();

			const html = renderToStaticMarkup(element);
			expect(html).toContain("Esta zona no está disponible");
		});

		it("does NOT redirect when session exists", async () => {
			mockGetCachedServerSession.mockResolvedValue(makeMockSession());
			mockGetAuthzSnapshot.mockResolvedValue({
				roleSlug: "raider",
				scope: "raider",
				sources: {},
			});
			mockGetAppPermission.mockResolvedValue({
				canView: true,
				canEdit: false,
				canManage: false,
			});

			await MediaLibraryPage();

			expect(mockRedirect).not.toHaveBeenCalled();
		});
	});

	// ── Data fetching ─────────────────────────
	describe("data fetching", () => {
		beforeEach(() => {
			mockGetCachedServerSession.mockResolvedValue(makeMockSession());
			mockGetAuthzSnapshot.mockResolvedValue({
				roleSlug: "raider",
				scope: "raider",
				sources: {},
			});
			mockGetAppPermission.mockResolvedValue({
				canView: true,
				canEdit: false,
				canManage: false,
			});
		});

		it("fetches folders ordered by sort_order", async () => {
			const folders = [
				makeFolder({ id: "f1", display_name: "Assets", sort_order: 1 }),
				makeFolder({ id: "f2", display_name: "Noticias", sort_order: 2 }),
			];
			setupSupabaseMocks(folders, []);

			await MediaLibraryPage();

			expect(mockSupabaseFrom).toHaveBeenCalledWith("media_folders");
			expect(mockMediaFoldersSelect).toHaveBeenCalledWith("*");
			expect(mockMediaFoldersOrder).toHaveBeenCalledWith("sort_order");
		});

		it("fetches file counts from media_metadata", async () => {
			const folders = [
				makeFolder(),
				makeFolder({ id: "f2", bucket_name: "guild_assets" }),
			];
			setupSupabaseMocks(folders, []);

			await MediaLibraryPage();

			expect(mockSupabaseFrom).toHaveBeenCalledWith("media_metadata");
		});

		it("computes folder counts from media_metadata rows", async () => {
			const folders = [
				makeFolder({ id: "f1", bucket_name: "news-images" }),
				makeFolder({ id: "f2", bucket_name: "guild_assets" }),
			];
			setupSupabaseMocks(folders, [
				{ bucket: "news-images" },
				{ bucket: "news-images" },
				{ bucket: "guild_assets" },
			]);

			await MediaLibraryPage();

			expect(mockMediaMetadataIn).toHaveBeenCalledWith("bucket", [
				"news-images",
				"guild_assets",
			]);
		});
	});

	// ── Client props ──────────────────────────
	describe("client props", () => {
		beforeEach(() => {
			mockGetCachedServerSession.mockResolvedValue(makeMockSession());
			mockGetAuthzSnapshot.mockResolvedValue({
				roleSlug: "raider",
				scope: "raider",
				sources: {},
			});
			mockGetAppPermission.mockResolvedValue({
				canView: true,
				canEdit: false,
				canManage: false,
			});
		});

		it("passes folders, folderCounts, and permissions to MediaLibraryClient", async () => {
			const folders = [
				makeFolder({ id: "f1", bucket_name: "news-images" }),
				makeFolder({ id: "f2", bucket_name: "guild_assets" }),
			];
			setupSupabaseMocks(folders, [
				{ bucket: "news-images" },
				{ bucket: "news-images" },
				{ bucket: "guild_assets" },
			]);

			const element = await MediaLibraryPage();
			const props = extractClientProps(element);

			expect(props).not.toBeNull();
			expect(props!.folders).toHaveLength(2);
			expect(props!.folderCounts).toEqual({
				"news-images": 2,
				guild_assets: 1,
			});
			expect(props!.permissions).toEqual({
				canView: true,
				canEdit: false,
				canManage: false,
			});
		});

		it("handles empty folder counts gracefully", async () => {
			const folders = [makeFolder({ id: "f1", bucket_name: "empty-bucket" })];
			setupSupabaseMocks(folders, []);

			const element = await MediaLibraryPage();
			const props = extractClientProps(element);

			expect(props!.folderCounts).toEqual({ "empty-bucket": 0 });
		});
	});

	// ── Edge cases ────────────────────────────
	describe("edge cases", () => {
		it("handles empty folders list", async () => {
			mockGetCachedServerSession.mockResolvedValue(makeMockSession());
			mockGetAuthzSnapshot.mockResolvedValue({
				roleSlug: "raider",
				scope: "raider",
				sources: {},
			});
			mockGetAppPermission.mockResolvedValue({
				canView: true,
				canEdit: false,
				canManage: false,
			});
			setupSupabaseMocks([], []);

			const element = await MediaLibraryPage();
			const props = extractClientProps(element);

			expect(props!.folders).toHaveLength(0);
			expect(props!.folderCounts).toEqual({});
		});

		it("handles banned user (session has isBanned)", async () => {
			mockGetCachedServerSession.mockResolvedValue(
				makeMockSession({ user: { isBanned: true } }),
			);
			mockGetAuthzSnapshot.mockResolvedValue({
				roleSlug: "member",
				scope: "member",
				sources: {},
			});
			mockGetAppPermission.mockResolvedValue({
				canView: false,
				canEdit: false,
				canManage: false,
			});

			const element = await MediaLibraryPage();

			const html = renderToStaticMarkup(element);
			expect(html).toContain("Esta zona no está disponible");
		});

		it("handles GM role with full permissions", async () => {
			mockGetCachedServerSession.mockResolvedValue(
				makeMockSession({ user: { roleLevel: "gm" } }),
			);
			mockGetAuthzSnapshot.mockResolvedValue({
				roleSlug: "gm",
				scope: "internal_admin",
				sources: {},
			});
			mockGetAppPermission.mockResolvedValue({
				canView: true,
				canEdit: true,
				canManage: true,
			});
			setupSupabaseMocks([], []);

			const element = await MediaLibraryPage();
			const props = extractClientProps(element);

			expect(props!.permissions).toEqual({
				canView: true,
				canEdit: true,
				canManage: true,
			});
		});
	});
});
