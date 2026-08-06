/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { MediaFolder } from "@/domains/media/types";

afterEach(() => {
	cleanup();
});

// ═══════════════════════════════════════════
// Mock next/navigation for useSearchParams
// ═══════════════════════════════════════════
const mockRouterPush = vi.fn();
const mockUseSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
	useSearchParams: () => mockUseSearchParams(),
	useRouter: () => ({ push: mockRouterPush }),
}));

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════
function makeFolder(overrides: Partial<MediaFolder> = {}): MediaFolder {
	return {
		id: "folder-1",
		bucket_name: "news-images",
		display_name: "Imágenes de Noticias",
		description: "Imágenes destacadas y contenido",
		sort_order: 2,
		is_system: false,
		file_count: 5,
		created_at: "2024-01-15T00:00:00Z",
		updated_at: "2024-01-15T00:00:00Z",
		...overrides,
	};
}

// ═══════════════════════════════════════════
// Import components AFTER mocks
// ═══════════════════════════════════════════
import { FolderGrid } from "../folder-grid";
import { FolderCard } from "../folder-card";
import { EmptyState } from "../empty-state";

// Global cleanup
beforeEach(() => {
	vi.clearAllMocks();
	mockUseSearchParams.mockReturnValue(new URLSearchParams());
});

describe("FolderGrid", () => {
	it("renders all folder cards", () => {
		const folders = [
			makeFolder({ id: "f1", display_name: "Assets", file_count: 3 }),
			makeFolder({ id: "f2", display_name: "Noticias", file_count: 10 }),
			makeFolder({ id: "f3", display_name: "Kills", file_count: 0 }),
		];

		render(
			<FolderGrid
				folders={folders}
				
				onSelectFolder={vi.fn()}
			/>,
		);

		expect(screen.getByText("Assets")).toBeDefined();
		expect(screen.getByText("Noticias")).toBeDefined();
		expect(screen.getByText("Kills")).toBeDefined();
	});

	it("shows file count on each card", () => {
		const folders = [
			makeFolder({ id: "f1", display_name: "Assets", file_count: 7 }),
		];

		render(
			<FolderGrid
				folders={folders}
				
				onSelectFolder={vi.fn()}
			/>,
		);

		expect(screen.getByText("7")).toBeDefined();
	});

	it("shows 'Nueva Carpeta' button when canManage is true", () => {
		const folders = [makeFolder()];

		render(
			<FolderGrid
				folders={folders}
				
				onSelectFolder={vi.fn()}
				canManage={true}
			/>,
		);

		expect(screen.getByTestId("new-folder-btn")).toBeDefined();
	});

	it("hides 'Nueva Carpeta' button when canManage is false", () => {
		const folders = [makeFolder()];

		render(
			<FolderGrid
				folders={folders}
				
				onSelectFolder={vi.fn()}
				canManage={false}
			/>,
		);

		expect(screen.queryByTestId("new-folder-btn")).toBeNull();
	});

	it("renders empty state when no folders", () => {
		render(
			<FolderGrid folders={[]}  onSelectFolder={vi.fn()} />,
		);

		expect(screen.getByText(/no hay carpetas/i)).toBeDefined();
	});
});

describe("FolderCard", () => {
	it("renders display_name and description", () => {
		const folder = makeFolder({
			display_name: "Mi Carpeta",
			description: "Una descripción",
		});

		render(<FolderCard folder={folder} onClick={vi.fn()} />);

		expect(screen.getByText("Mi Carpeta")).toBeDefined();
		expect(screen.getByText("Una descripción")).toBeDefined();
	});

	it("shows file_count badge", () => {
		const folder = makeFolder({ file_count: 25 });

		render(<FolderCard folder={folder} onClick={vi.fn()} />);

		expect(screen.getByText("25")).toBeDefined();
	});

	it("shows lock icon for system folders", () => {
		const folder = makeFolder({ is_system: true });

		render(<FolderCard folder={folder} onClick={vi.fn()} />);

		// System folders have a visual indicator - check for aria-label on lock icon
		expect(screen.getByLabelText("Carpeta del sistema")).toBeDefined();
	});

	it("calls onClick when clicked", () => {
		const onClick = vi.fn();
		const folder = makeFolder();

		render(<FolderCard folder={folder} onClick={onClick} />);

		const button = screen.getByTestId(`folder-card-${folder.id}`);
		fireEvent.click(button);
		expect(onClick).toHaveBeenCalledWith(folder);
	});

	it("does not show lock icon for non-system folders", () => {
		const folder = makeFolder({ is_system: false });

		render(<FolderCard folder={folder} onClick={vi.fn()} />);
		// Non-system folders should not have lock indicator
		// Use querySelector to find lock icon by aria-label
		const lockIcon = document.querySelector(
			'[aria-label="Carpeta del sistema"]',
		);
		expect(lockIcon).toBeNull();
	});

	it("truncates long display names", () => {
		const folder = makeFolder({
			display_name:
				"Nombre extremadamente largo que debería truncarse en la interfaz",
		});

		render(<FolderCard folder={folder} onClick={vi.fn()} />);

		expect(screen.getByText(folder.display_name)).toBeDefined();
	});
});

describe("EmptyState", () => {
	it("renders empty state message", () => {
		render(<EmptyState />);

		expect(screen.getByText(/esta carpeta está vacía/i)).toBeDefined();
	});

	it("shows upload hint", () => {
		render(<EmptyState />);

		expect(
			screen.getByText(/Arrastra archivos aquí para subirlos/i),
		).toBeDefined();
	});
});
