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

vi.mock("next/image", () => ({
	default: ({ src, alt, ...props }: Record<string, unknown>) => {
		// eslint-disable-next-line @next/next/no-img-element
		// oxlint-disable-next-line no-base-to-string, next/no-img-element
		return <img src={String(src)} alt={String(alt ?? "")} {...props} />;
	},
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

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
function makeRanks() {
	return [
		{
			rank: 0,
			name: "Guild Master",
			color: "#ff0000",
			image_url: null,
			roster_section: "main" as const,
		},
		{
			rank: 1,
			name: "Officer",
			color: "#00ff00",
			image_url: "https://example.com/officer.jpg",
			roster_section: "main" as const,
		},
	];
}

function makeImages() {
	return [
		{
			path: "rank1.png",
			name: "Rank Image 1",
			url: "https://example.com/rank1.png",
			folder: "ranks",
		},
		{
			path: "rank2.png",
			name: "Rank Image 2",
			url: "https://example.com/rank2.png",
			folder: null,
		},
	];
}

// ═══════════════════════════════════════════
// Import component AFTER mocks
// ═══════════════════════════════════════════
import { SettingsWowauditRanksClient } from "@/domains/settings/components/settings-wowaudit-ranks";

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal("fetch", createEmptyFetch());
});

describe("SettingsWowauditRanksClient — MediaPicker integration", () => {
	it("shows 'Subir medio' button in rank edit dialog", async () => {
		const ranks = makeRanks();
		const images = makeImages();

		render(<SettingsWowauditRanksClient ranks={ranks} images={images} />);

		// Click edit on the first rank to open the dialog
		const editBtns = screen.getAllByText("Editar");
		fireEvent.click(editBtns[0]);

		// Dialog should now be open with a Subir medio button
		await waitFor(() => {
			const biblioBtn = screen.getByText(/subir medio/i);
			expect(biblioBtn).toBeDefined();
		});
	});

	it("opens MediaPicker scoped to roster_ranks_images when Subir medio is clicked", async () => {
		const ranks = makeRanks();
		const images = makeImages();

		render(<SettingsWowauditRanksClient ranks={ranks} images={images} />);

		// Open the edit dialog
		const editBtns = screen.getAllByText("Editar");
		fireEvent.click(editBtns[0]);

		// Click Subir medio button
		await waitFor(() => {
			expect(screen.getByText(/subir medio/i)).toBeDefined();
		});
		const biblioBtn = screen.getByText(/subir medio/i);
		fireEvent.click(biblioBtn);

		// MediaPicker should open
		await waitFor(() => {
			expect(
				screen.getByText("Seleccionar imagen para Guild Master"),
			).toBeDefined();
		});
	});

	it("keeps existing image select dropdown for manual selection", async () => {
		const ranks = makeRanks();
		const images = makeImages();

		render(<SettingsWowauditRanksClient ranks={ranks} images={images} />);

		const editBtns = screen.getAllByText("Editar");
		fireEvent.click(editBtns[0]);

		await waitFor(() => {
			// The Select for image should still exist (id="wowaudit-image")
			const imageSelect = document.getElementById("wowaudit-image");
			expect(imageSelect).not.toBeNull();
		});
	});

	it("keeps existing image preview grid for quick selection", async () => {
		const ranks = makeRanks();
		const images = makeImages();

		render(<SettingsWowauditRanksClient ranks={ranks} images={images} />);

		const editBtns = screen.getAllByText("Editar");
		fireEvent.click(editBtns[0]);

		await waitFor(() => {
			// Existing image previews should still render
			expect(screen.getByText("Rank Image 1")).toBeDefined();
			expect(screen.getByText("Rank Image 2")).toBeDefined();
		});
	});
});
