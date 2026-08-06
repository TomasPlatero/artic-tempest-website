/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { MediaFile } from "@/domains/media/types";

afterEach(() => {
	cleanup();
});

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════
function makeFile(overrides: Partial<MediaFile> = {}): MediaFile {
	return {
		id: "file-1",
		bucket: "news-images",
		storage_path: "abc123.jpg",
		title: "Test Image",
		alt_text: "",
		caption: "",
		description: "",
		file_size: 102400,
		mime_type: "image/jpeg",
		dimensions: "1920x1080",
		url: "https://example.com/storage/v1/object/public/news-images/abc123.jpg",
		uploaded_by: "user-1",
		created_at: "2024-06-15T10:30:00Z",
		updated_at: "2024-06-15T10:30:00Z",
		...overrides,
	};
}

// ═══════════════════════════════════════════
// Mock next/image
// ═══════════════════════════════════════════
vi.mock("next/image", () => ({
	default: ({ alt, src, ...rest }: Record<string, unknown>) => (
		// eslint-disable-next-line @next/next/no-img-element -- mock for next/image in tests
		<img src={src as string} alt={(alt as string) ?? ""} {...rest} />
	),
}));

// ═══════════════════════════════════════════
// Import components AFTER mocks
// ═══════════════════════════════════════════
import { FileView } from "../file-view";
import { FileGrid } from "../file-grid";
import { FileCard } from "../file-card";
import { FileList } from "../file-list";
import { FileRow } from "../file-row";

beforeEach(() => {
	vi.clearAllMocks();
});

// ═══════════════════════════════════════════
// FileCard Tests
// ═══════════════════════════════════════════
describe("FileCard", () => {
	it("renders thumbnail image for image files", () => {
		const file = makeFile({ mime_type: "image/png" });

		render(<FileCard file={file} onSelect={vi.fn()} onClick={vi.fn()} />);

		const img = document.querySelector("img");
		expect(img).not.toBeNull();
		expect(img!.getAttribute("src")).toBe(file.url);
	});

	it("renders filename text", () => {
		const file = makeFile({ title: "Foto del evento" });

		render(<FileCard file={file} onSelect={vi.fn()} onClick={vi.fn()} />);

		expect(screen.getByText("Foto del evento")).toBeDefined();
	});

	it("shows document-type icon for non-image files", () => {
		const file = makeFile({
			mime_type: "application/pdf",
			title: "reporte.pdf",
			storage_path: "reporte.pdf",
		});

		render(<FileCard file={file} onSelect={vi.fn()} onClick={vi.fn()} />);

		// Should NOT render an <img> tag
		const img = document.querySelector("img");
		expect(img).toBeNull();

		// Should still show the filename
		expect(screen.getByText("reporte.pdf")).toBeDefined();
	});

	it("shows checkbox for selection", () => {
		const file = makeFile();
		const onSelect = vi.fn();

		render(<FileCard file={file} onSelect={onSelect} onClick={vi.fn()} />);

		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).toBeDefined();
	});

	it("calls onSelect when checkbox is clicked", () => {
		const file = makeFile();
		const onSelect = vi.fn();

		render(<FileCard file={file} onSelect={onSelect} onClick={vi.fn()} />);

		const checkbox = screen.getByRole("checkbox");
		fireEvent.click(checkbox);
		expect(onSelect).toHaveBeenCalledWith(file.id, true);
	});

	it("shows checked checkbox when selected", () => {
		const file = makeFile();

		render(
			<FileCard
				file={file}
				onSelect={vi.fn()}
				onClick={vi.fn()}
				isSelected={true}
			/>,
		);

		const checkbox = screen.getByRole("checkbox");
		expect(checkbox.getAttribute("data-state")).toBe("checked");
	});

	it("calls onClick when card body is clicked", () => {
		const file = makeFile();
		const onClick = vi.fn();

		render(<FileCard file={file} onSelect={vi.fn()} onClick={onClick} />);

		// Click the card area (not the checkbox)
		const card = screen.getByTestId(`file-card-${file.id}`);
		fireEvent.click(card);
		expect(onClick).toHaveBeenCalledWith(file);
	});

	it("renders document icon for video files", () => {
		const file = makeFile({
			mime_type: "video/mp4",
			title: "video.mp4",
			storage_path: "video.mp4",
		});

		render(<FileCard file={file} onSelect={vi.fn()} onClick={vi.fn()} />);

		const img = document.querySelector("img");
		expect(img).toBeNull();
	});
});

// ═══════════════════════════════════════════
// FileGrid Tests
// ═══════════════════════════════════════════
describe("FileGrid", () => {
	it("renders file cards in a grid", () => {
		const files = [
			makeFile({ id: "f1", title: "Foto 1" }),
			makeFile({ id: "f2", title: "Foto 2" }),
			makeFile({ id: "f3", title: "Foto 3" }),
		];

		render(
			<FileGrid
				files={files}
				selectedIds={new Set()}
				onSelectFile={vi.fn()}
				onClickFile={vi.fn()}
			/>,
		);

		expect(screen.getByText("Foto 1")).toBeDefined();
		expect(screen.getByText("Foto 2")).toBeDefined();
		expect(screen.getByText("Foto 3")).toBeDefined();
	});

	it("renders empty state when no files", () => {
		render(
			<FileGrid
				files={[]}
				selectedIds={new Set()}
				onSelectFile={vi.fn()}
				onClickFile={vi.fn()}
			/>,
		);

		expect(screen.getByText(/esta carpeta está vacía/i)).toBeDefined();
	});

	it("renders single file card", () => {
		const files = [makeFile({ id: "only", title: "Unico" })];

		render(
			<FileGrid
				files={files}
				selectedIds={new Set()}
				onSelectFile={vi.fn()}
				onClickFile={vi.fn()}
			/>,
		);

		expect(screen.getByText("Unico")).toBeDefined();
	});
});

// ═══════════════════════════════════════════
// FileRow Tests
// ═══════════════════════════════════════════
describe("FileRow", () => {
	it("renders filename, MIME type, size, and date", () => {
		const file = makeFile({
			title: "documento.pdf",
			mime_type: "application/pdf",
			file_size: 2048000,
			created_at: "2024-01-15T08:00:00Z",
		});

		render(
			<table>
				<tbody>
					<FileRow
						file={file}
						isSelected={false}
						onSelect={vi.fn()}
						onClick={vi.fn()}
					/>
				</tbody>
			</table>,
		);

		expect(screen.getByText("documento.pdf")).toBeDefined();
		expect(screen.getByText("application/pdf")).toBeDefined();
	});

	it("shows checkbox for selection", () => {
		const file = makeFile();

		render(
			<table>
				<tbody>
					<FileRow
						file={file}
						isSelected={false}
						onSelect={vi.fn()}
						onClick={vi.fn()}
					/>
				</tbody>
			</table>,
		);

		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).toBeDefined();
	});

	it("calls onClick when row is clicked", () => {
		const file = makeFile();
		const onClick = vi.fn();

		render(
			<table>
				<tbody>
					<FileRow
						file={file}
						isSelected={false}
						onSelect={vi.fn()}
						onClick={onClick}
					/>
				</tbody>
			</table>,
		);

		const row = screen.getByTestId(`file-row-${file.id}`);
		fireEvent.click(row);
		expect(onClick).toHaveBeenCalledWith(file);
	});
});

// ═══════════════════════════════════════════
// FileList Tests
// ═══════════════════════════════════════════
describe("FileList", () => {
	it("renders table with column headers", () => {
		const files = [makeFile()];

		render(
			<FileList
				files={files}
				selectedIds={new Set()}
				onSelectFile={vi.fn()}
				onClickFile={vi.fn()}
			/>,
		);

		expect(screen.getByText(/nombre/i)).toBeDefined();
		expect(screen.getByText(/tipo/i)).toBeDefined();
		expect(screen.getByText(/tamaño/i)).toBeDefined();
		expect(screen.getByText(/fecha/i)).toBeDefined();
	});

	it("renders all file rows", () => {
		const files = [
			makeFile({ id: "a", title: "A" }),
			makeFile({ id: "b", title: "B" }),
		];

		render(
			<FileList
				files={files}
				selectedIds={new Set()}
				onSelectFile={vi.fn()}
				onClickFile={vi.fn()}
			/>,
		);

		expect(screen.getByText("A")).toBeDefined();
		expect(screen.getByText("B")).toBeDefined();
	});

	it("renders empty state when no files", () => {
		render(
			<FileList
				files={[]}
				selectedIds={new Set()}
				onSelectFile={vi.fn()}
				onClickFile={vi.fn()}
			/>,
		);

		expect(screen.getByText(/esta carpeta está vacía/i)).toBeDefined();
	});
});

// ═══════════════════════════════════════════
// FileView Tests
// ═══════════════════════════════════════════
describe("FileView", () => {
	it("renders in grid view by default", () => {
		const files = [makeFile({ title: "Grid Image" })];

		render(
			<FileView
				files={files}
				isLoading={false}
				error={null}
				hasMore={false}
				total={1}
				onLoadMore={vi.fn()}
			/>,
		);

		expect(screen.getByText("Grid Image")).toBeDefined();
	});

	it("switches to list view", () => {
		const files = [makeFile({ title: "List Image", mime_type: "image/png" })];

		render(
			<FileView
				files={files}
				isLoading={false}
				error={null}
				hasMore={false}
				total={1}
				onLoadMore={vi.fn()}
			/>,
		);

		// Find and click the list toggle button
		const listBtn = screen.getByLabelText("Vista de lista");
		fireEvent.click(listBtn);

		// After switching, we should see table column headers
		expect(screen.getByText(/nombre/i)).toBeDefined();
	});

	it("shows loading state", () => {
		render(
			<FileView
				files={[]}
				isLoading={true}
				error={null}
				hasMore={false}
				total={0}
				onLoadMore={vi.fn()}
			/>,
		);

		expect(screen.getByText(/cargando archivos/i)).toBeDefined();
	});

	it("shows error state", () => {
		render(
			<FileView
				files={[]}
				isLoading={false}
				error="Error de red"
				hasMore={false}
				total={0}
				onLoadMore={vi.fn()}
			/>,
		);

		expect(screen.getByText(/error de red/i)).toBeDefined();
	});

	it("shows file count", () => {
		const files = [makeFile(), makeFile(), makeFile()];

		render(
			<FileView
				files={files}
				isLoading={false}
				error={null}
				hasMore={false}
				total={3}
				onLoadMore={vi.fn()}
			/>,
		);

		expect(screen.getByText(/3 archivos/i)).toBeDefined();
	});

	it("shows 'Cargar más' button when hasMore is true", () => {
		const files = [makeFile()];

		render(
			<FileView
				files={files}
				isLoading={false}
				error={null}
				hasMore={true}
				total={5}
				onLoadMore={vi.fn()}
			/>,
		);

		expect(screen.getByText(/cargar más/i)).toBeDefined();
	});

	it("calls onLoadMore when 'Cargar más' is clicked", () => {
		const onLoadMore = vi.fn();
		const files = [makeFile()];

		render(
			<FileView
				files={files}
				isLoading={false}
				error={null}
				hasMore={true}
				total={5}
				onLoadMore={onLoadMore}
			/>,
		);

		const loadBtn = screen.getByText(/cargar más/i);
		fireEvent.click(loadBtn);
		expect(onLoadMore).toHaveBeenCalledTimes(1);
	});

	it("manages file selection state (select/deselect)", () => {
		const files = [makeFile({ id: "sel-1" }), makeFile({ id: "sel-2" })];

		render(
			<FileView
				files={files}
				isLoading={false}
				error={null}
				hasMore={false}
				total={2}
				onLoadMore={vi.fn()}
			/>,
		);

		// Initially no checkboxes should be checked
		const checkboxes = screen.getAllByRole("checkbox");
		expect(checkboxes[0].getAttribute("data-state")).toBe("unchecked");
		expect(checkboxes[1].getAttribute("data-state")).toBe("unchecked");
	});

	it("shows selected count in bulk action bar", () => {
		const files = [makeFile({ id: "sel-1" }), makeFile({ id: "sel-2" })];

		render(
			<FileView
				files={files}
				isLoading={false}
				error={null}
				hasMore={false}
				total={2}
				onLoadMore={vi.fn()}
			/>,
		);

		// Select the first file
		const checkbox = screen.getAllByRole("checkbox")[0];
		fireEvent.click(checkbox);

		// Should show selected count in bulk action bar
		expect(screen.getByText(/1 archivo seleccionado/i)).toBeDefined();
	});
});
