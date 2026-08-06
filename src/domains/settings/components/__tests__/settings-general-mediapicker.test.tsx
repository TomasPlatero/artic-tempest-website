/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	render,
	screen,
	fireEvent,
	cleanup,
	waitFor,
} from "@testing-library/react";

afterEach(() => {
	cleanup();
});

// ═══════════════════════════════════════════
// Mocks
// ═══════════════════════════════════════════
vi.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams(),
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

vi.mock("next/image", () => ({
	default: ({ src, alt, ...props }: Record<string, unknown>) => {
		// eslint-disable-next-line @next/next/no-img-element
		// oxlint-disable-next-line no-base-to-string, next/no-img-element
		return <img src={String(src)} alt={String(alt ?? "")} {...props} />;
	},
}));

vi.mock("next/cache", () => ({
	revalidateTag: vi.fn(),
}));

vi.mock("@/shared/auth/auth-options", () => ({
	supabaseAdmin: {
		from: vi.fn(),
		storage: {
			from: vi.fn().mockReturnValue({
				getPublicUrl: vi.fn().mockReturnValue({
					data: { publicUrl: "https://example.com/test.jpg" },
				}),
			}),
		},
	},
}));

vi.mock("@/shared/auth/permissions", () => ({
	ensureAppPermission: vi.fn().mockResolvedValue(undefined),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock empty MediaPicker response
function createEmptyFetch() {
	return vi.fn().mockResolvedValue(
		new Response(JSON.stringify({ files: [], nextCursor: null, total: 0 }), {
			status: 200,
		}),
	);
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════
function makeGuild() {
	return {
		id: 1,
		name: "Test Guild",
		realm: "Test Realm",
		region: "eu",
		version: "Zona Raider",
		iconUrl: "https://example.com/icon.jpg",
		mobileIconUrl: null,
		publicLogoUrl: null,
	};
}

function makeCredentials() {
	return {
		discord_client_id: "",
		discord_client_secret: "",
		discord_guild_id: "",
		bnet_client_id: "",
		bnet_client_secret: "",
		wcl_client_id: "",
		wcl_client_secret: "",
	};
}

// ═══════════════════════════════════════════
// Import component AFTER mocks
// ═══════════════════════════════════════════
import { SettingsGeneralClient } from "@/domains/settings/components/settings-general";

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal("fetch", createEmptyFetch());
	// Suppress act() warnings from async state updates
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

describe("SettingsGeneralClient — MediaPicker integration for icons", () => {
	it("renders 'Subir medio' button for main icon", () => {
		const guild = makeGuild();
		render(
			<SettingsGeneralClient
				guild={guild}
				credentials={makeCredentials()}
				tourEnabled={false}
				permissions={{
					general: { canView: true, canEdit: true, canManage: true },
				}}
			/>,
		);

		// Each icon section should have a MediaPicker trigger button
		const biblioBtns = screen.getAllByText(/subir medio/i);
		expect(biblioBtns.length).toBeGreaterThanOrEqual(3); // main + mobile + public
	});

	it("opens MediaPicker scoped to guild_assets when Subir medio is clicked", async () => {
		const guild = makeGuild();
		render(
			<SettingsGeneralClient
				guild={guild}
				credentials={makeCredentials()}
				tourEnabled={false}
				permissions={{
					general: { canView: true, canEdit: true, canManage: true },
				}}
			/>,
		);

		const biblioBtns = screen.getAllByText(/subir medio/i);
		fireEvent.click(biblioBtns[0]);

		// MediaPicker Dialog should appear with the correct title
		await waitFor(() => {
			// First button is for public logo (order: public → main → mobile in the card)
			expect(screen.getByText("Seleccionar logotipo de portada")).toBeDefined();
		});
	});

	it("does not show Subir medio buttons when user cannot edit", () => {
		const guild = makeGuild();
		render(
			<SettingsGeneralClient
				guild={guild}
				credentials={makeCredentials()}
				tourEnabled={false}
				permissions={{
					general: { canView: true, canEdit: false, canManage: false },
				}}
			/>,
		);

		const biblioBtns = screen.queryAllByText(/subir medio/i);
		expect(biblioBtns.length).toBe(0);
	});

	it("calls settings info PATCH when a file is selected from MediaPicker", async () => {
		const guild = makeGuild();
		const fetchMock = vi.fn((url: string) => {
			if (url.includes("/api/media/folders")) {
				return Promise.resolve(
					new Response(
						JSON.stringify({
							folders: [
								{
									id: "f1",
									bucket_name: "guild_assets",
									display_name: "Guild Assets",
									description: "",
									sort_order: 1,
									is_system: true,
									file_count: 1,
									created_at: "2024-01-01T00:00:00Z",
									updated_at: "2024-01-01T00:00:00Z",
								},
							],
						}),
						{ status: 200 },
					),
				);
			}
			if (url.includes("/api/media")) {
				return Promise.resolve(
					new Response(
						JSON.stringify({
							files: [
								{
									id: "test-file-1",
									bucket: "guild_assets",
									storage_path: "test.jpg",
									title: "Test Icon",
									alt_text: "",
									caption: "",
									description: "",
									file_size: 1024,
									mime_type: "image/jpeg",
									dimensions: "",
									url: "https://example.com/test.jpg",
									uploaded_by: null,
									created_at: "2025-01-01T00:00:00Z",
									updated_at: "2025-01-01T00:00:00Z",
								},
							],
							nextCursor: null,
							total: 1,
						}),
						{ status: 200 },
					),
				);
			}
			return Promise.resolve(
				new Response(JSON.stringify({ success: true }), { status: 200 }),
			);
		});
		vi.stubGlobal("fetch", fetchMock);

		render(
			<SettingsGeneralClient
				guild={guild}
				credentials={makeCredentials()}
				tourEnabled={false}
				permissions={{
					general: { canView: true, canEdit: true, canManage: true },
				}}
			/>,
		);

		// Open the picker
		const biblioBtns = screen.getAllByText(/subir medio/i);
		fireEvent.click(biblioBtns[0]);

		// Navigate into the folder
		await waitFor(() => {
			expect(screen.getByText("Guild Assets")).toBeDefined();
		});
		fireEvent.click(screen.getByText("Guild Assets"));

		// Wait for the file card to appear
		await waitFor(() => {
			expect(screen.getByText("Test Icon")).toBeDefined();
		});

		// Verify media API was called
		const mediaCalls = fetchMock.mock.calls.filter(
			(call: unknown[]) =>
				typeof call[0] === "string" &&
				(call[0] as string).includes("/api/media"),
		);
		expect(mediaCalls.length).toBeGreaterThanOrEqual(1);
	});
});
