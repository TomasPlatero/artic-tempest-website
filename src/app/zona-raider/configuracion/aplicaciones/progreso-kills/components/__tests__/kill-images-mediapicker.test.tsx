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
// Mock next/navigation
// ═══════════════════════════════════════════
vi.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams(),
	useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/image
vi.mock("next/image", () => ({
	default: ({ src, alt, ...props }: Record<string, unknown>) => {
		// eslint-disable-next-line @next/next/no-img-element
		// oxlint-disable-next-line no-base-to-string, next/no-img-element
		return <img src={String(src)} alt={String(alt ?? "")} {...props} />;
	},
}));

// Mock fetch to avoid MediaPicker fetching when opened
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
function makeBoss(slug: string, name: string, ordinal: number) {
	return { slug, name, ordinal, imageUrl: null };
}

// ═══════════════════════════════════════════
// Import component AFTER mocks
// ═══════════════════════════════════════════
import { KillImagesSettingsClient } from "@/app/zona-raider/configuracion/aplicaciones/progreso-kills/components/kill-images-settings-client";

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal("fetch", createEmptyFetch());
});

describe("KillImagesSettingsClient — MediaPicker integration", () => {
	it('has "Biblioteca" button per boss', () => {
		const bosses = [
			makeBoss("boss-1", "Test Boss 1", 1),
			makeBoss("boss-2", "Test Boss 2", 2),
		];

		render(
			<KillImagesSettingsClient
				bosses={bosses}
				images={[]}
				initialMappings={{}}
			/>,
		);

		// Each boss should have at least one "Biblioteca" button
		const biblioBtns = screen.getAllByRole("button", { name: /Biblioteca/ });
		expect(biblioBtns.length).toBeGreaterThanOrEqual(2);
	});

	it("opens MediaPicker scoped to image_boses_kills when Biblioteca is clicked", async () => {
		const bosses = [makeBoss("boss-1", "Test Boss", 1)];

		render(
			<KillImagesSettingsClient
				bosses={bosses}
				images={[]}
				initialMappings={{}}
			/>,
		);

		const biblioBtns = screen.getAllByRole("button", { name: /Biblioteca/ });
		fireEvent.click(biblioBtns[0]);

		// MediaPicker should open with correct bucket - title should be visible
		await waitFor(() => {
			expect(
				screen.getByText("Seleccionar imagen para Test Boss"),
			).toBeDefined();
		});
	});

	it("no longer shows old 'Subir' upload button after migration", () => {
		const bosses = [makeBoss("boss-1", "Test Boss", 1)];

		render(
			<KillImagesSettingsClient
				bosses={bosses}
				images={[]}
				initialMappings={{}}
			/>,
		);

		// Old "Subir" upload button should NOT exist after migration
		const subirBtns = screen.queryAllByRole("button", { name: /Subir/ });
		expect(subirBtns.length).toBe(0);
	});

	it("keeps PATCH assignment select dropdown", () => {
		const bosses = [makeBoss("boss-1", "Test Boss", 1)];
		const images = [
			{
				path: "img1.jpg",
				url: "https://example.com/img1.jpg",
				name: "Image 1",
			},
		];

		render(
			<KillImagesSettingsClient
				bosses={bosses}
				images={images}
				initialMappings={{}}
			/>,
		);

		// The Select dropdown placeholder for choosing from existing bucket images should still exist
		const selects = screen.getAllByText("Elige una imagen del bucket");
		expect(selects.length).toBeGreaterThanOrEqual(1);
	});
});
