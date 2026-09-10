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

// Mock clipboard
const mockWriteText = vi.fn();
Object.defineProperty(navigator, "clipboard", {
	value: { writeText: mockWriteText },
	writable: true,
	configurable: true,
});

beforeEach(() => {
	vi.clearAllMocks();
	mockWriteText.mockResolvedValue(undefined);
});

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
// Import AFTER mocks
// ═══════════════════════════════════════════
import { FileDetailSheet } from "../file-detail-sheet";

// ═══════════════════════════════════════════
// FileDetailSheet Tests
// ═══════════════════════════════════════════
describe("FileDetailSheet", () => {
	// ── Open/Close ──────────────────────────
	it("renders sheet when open and file is provided", () => {
		const file = makeFile();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		// Should render the sheet title
		expect(screen.getByText("Test Image")).toBeDefined();
	});

	it("does not render sheet content when closed", () => {
		const file = makeFile();

		render(
			<FileDetailSheet
				file={file}
				open={false}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		// Sheet title should not be visible
		expect(screen.queryByText("Test Image")).toBeNull();
	});

	it("calls onOpenChange when close button is clicked", () => {
		const file = makeFile();
		const onOpenChange = vi.fn();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={onOpenChange}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		const closeBtn = screen.getByLabelText("Cerrar detalle");
		fireEvent.click(closeBtn);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	// ── Preview ────────────────────────────
	it("renders image preview for image files", () => {
		const file = makeFile({ mime_type: "image/png" });

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		const img = document.querySelector("img");
		expect(img).not.toBeNull();
		expect(img!.getAttribute("src")).toBe(file.url);
	});

	it("renders file type icon for non-image files", () => {
		const file = makeFile({
			mime_type: "application/pdf",
			title: "reporte.pdf",
		});

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		const img = document.querySelector("img");
		expect(img).toBeNull();
		expect(screen.getByText("reporte.pdf")).toBeDefined();
	});

	// ── Metadata Form ──────────────────────
	it("renders editable title field", () => {
		const file = makeFile({ title: "Mi imagen" });

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		const titleInput = screen.getByLabelText("Título");
		expect(titleInput).toBeDefined();
		expect((titleInput as HTMLInputElement).value).toBe("Mi imagen");
	});

	it("renders editable alt_text field", () => {
		const file = makeFile({ alt_text: "Descripción alternativa" });

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		const altInput = screen.getByLabelText("Texto alternativo");
		expect(altInput).toBeDefined();
		expect((altInput as HTMLInputElement).value).toBe("Descripción alternativa");
	});

	it("renders editable caption field", () => {
		const file = makeFile({ caption: "Un pie de foto" });

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		const captionInput = screen.getByLabelText("Pie de foto");
		expect(captionInput).toBeDefined();
	});

	it("renders editable description field", () => {
		const file = makeFile({ description: "Una descripción larga" });

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		const descInput = screen.getByLabelText("Descripción");
		expect(descInput).toBeDefined();
	});

	it("disables metadata fields when canEdit is false", () => {
		const file = makeFile();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={false}
			/>,
		);

		const titleInput = screen.getByLabelText("Título");
		expect((titleInput as HTMLInputElement).disabled).toBe(true);
	});

	// ── Autosave on blur ───────────────────
	it("calls onSave when title field blurs with changed value", async () => {
		const file = makeFile({ id: "file-1", title: "Original" });
		const onSave = vi.fn().mockResolvedValue(undefined);

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={onSave}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		const titleInput = screen.getByLabelText("Título");
		fireEvent.change(titleInput, { target: { value: "Nuevo título" } });
		fireEvent.blur(titleInput);

		await waitFor(() => {
			expect(onSave).toHaveBeenCalledWith("file-1", "title", "Nuevo título");
		});
	});

	it("does not call onSave when field value is unchanged on blur", () => {
		const file = makeFile({ id: "file-1", title: "Original" });
		const onSave = vi.fn();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={onSave}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		const titleInput = screen.getByLabelText("Título");
		fireEvent.focus(titleInput);
		fireEvent.blur(titleInput);

		expect(onSave).not.toHaveBeenCalled();
	});

	// ── Action Buttons ─────────────────────
	it("renders Copy URL button", () => {
		const file = makeFile();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		expect(screen.getByText("Copiar URL")).toBeDefined();
	});

	it("copies URL to clipboard when Copy URL is clicked", async () => {
		const file = makeFile();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		const copyBtn = screen.getByText("Copiar URL");
		fireEvent.click(copyBtn);

		await waitFor(() => {
			expect(mockWriteText).toHaveBeenCalledWith(file.url);
		});
	});

	it("renders Download button", () => {
		const file = makeFile();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		expect(screen.getByText("Descargar")).toBeDefined();
	});

	it("opens file URL in new tab when Download is clicked", () => {
		const file = makeFile();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		const clickSpy = vi
			.spyOn(HTMLAnchorElement.prototype, "click")
			.mockImplementation(() => {});

		const downloadBtn = screen.getByText("Descargar");
		fireEvent.click(downloadBtn);

		expect(clickSpy).toHaveBeenCalledTimes(1);
		const anchor = clickSpy.mock.instances[0] as unknown as HTMLAnchorElement;
		expect(anchor.href).toBe(file.url);
		expect(anchor.target).toBe("_blank");
		expect(anchor.rel).toBe("noopener noreferrer");

		clickSpy.mockRestore();
	});

	it("renders Delete button when canEdit is true", () => {
		const file = makeFile();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		expect(screen.getByText("Eliminar")).toBeDefined();
	});

	it("does not render Delete button when canEdit is false", () => {
		const file = makeFile();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={false}
			/>,
		);

		expect(screen.queryByText("Eliminar")).toBeNull();
	});

	it("calls onDelete when Delete button is clicked", () => {
		const file = makeFile({ id: "file-1" });
		const onDelete = vi.fn();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={onDelete}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		const deleteBtn = screen.getByText("Eliminar");
		fireEvent.click(deleteBtn);
		expect(onDelete).toHaveBeenCalledWith("file-1");
	});

	// ── Navigation ─────────────────────────
	it("does not render navigation arrows when hasPrev and hasNext are false", () => {
		const file = makeFile();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		expect(screen.queryByLabelText("Archivo anterior")).toBeNull();
		expect(screen.queryByLabelText("Archivo siguiente")).toBeNull();
	});

	it("renders previous arrow when hasPrev is true", () => {
		const file = makeFile();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={true}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		expect(screen.getByLabelText("Archivo anterior")).toBeDefined();
	});

	it("renders next arrow when hasNext is true", () => {
		const file = makeFile();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={true}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		expect(screen.getByLabelText("Archivo siguiente")).toBeDefined();
	});

	it("calls onNavigate with prev when previous arrow is clicked", () => {
		const file = makeFile();
		const onNavigate = vi.fn();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={true}
				hasNext={false}
				onNavigate={onNavigate}
				canEdit={true}
			/>,
		);

		const prevBtn = screen.getByLabelText("Archivo anterior");
		fireEvent.click(prevBtn);
		expect(onNavigate).toHaveBeenCalledWith("prev");
	});

	it("calls onNavigate with next when next arrow is clicked", () => {
		const file = makeFile();
		const onNavigate = vi.fn();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={true}
				onNavigate={onNavigate}
				canEdit={true}
			/>,
		);

		const nextBtn = screen.getByLabelText("Archivo siguiente");
		fireEvent.click(nextBtn);
		expect(onNavigate).toHaveBeenCalledWith("next");
	});

	// ── Read-only Info ─────────────────────
	it("displays file bucket name", () => {
		const file = makeFile({ bucket: "news-images" });

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		expect(screen.getByText("news-images")).toBeDefined();
	});

	it("displays file storage path", () => {
		const file = makeFile({ storage_path: "abc123.jpg" });

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		expect(screen.getByText("abc123.jpg")).toBeDefined();
	});

	it("displays file MIME type", () => {
		const file = makeFile({ mime_type: "image/png" });

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		expect(screen.getByText("image/png")).toBeDefined();
	});

	it("displays file dimensions", () => {
		const file = makeFile({ dimensions: "1920x1080" });

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		expect(screen.getByText("1920x1080")).toBeDefined();
	});

	it("displays human-readable file size", () => {
		const file = makeFile({ file_size: 2048000 });

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		// 2,048,000 bytes ≈ 1.95 MB
		expect(screen.getByText(/MB/)).toBeDefined();
	});

	// ── TRIANGULATE: Non-image file ────────
	it("displays document icon for PDF in detail panel", () => {
		const file = makeFile({
			mime_type: "application/pdf",
			title: "Guía.pdf",
		});

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		expect(screen.getByText("Guía.pdf")).toBeDefined();
		const img = document.querySelector("img");
		expect(img).toBeNull();
	});

	// ── TRIANGULATE: Max-length validation ──
	it("prevents saving title over 255 characters", async () => {
		const file = makeFile({ id: "file-1", title: "short" });
		const onSave = vi.fn().mockResolvedValue(undefined);
		const longTitle = "a".repeat(256);

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={onSave}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={false}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		const titleInput = screen.getByLabelText("Título");
		fireEvent.change(titleInput, { target: { value: longTitle } });
		fireEvent.blur(titleInput);

		await waitFor(() => {
			expect(onSave).not.toHaveBeenCalled();
		});

		// Should show validation error
		expect(screen.getByText(/demasiado largo|255 caracteres/i)).toBeDefined();
	});

	// ── TRIANGULATE: Navigation boundary ───
	it("first file has no previous, last file has no next", () => {
		const file = makeFile();

		render(
			<FileDetailSheet
				file={file}
				open={true}
				onOpenChange={vi.fn()}
				onSave={vi.fn()}
				onDelete={vi.fn()}
				hasPrev={false}
				hasNext={true}
				onNavigate={vi.fn()}
				canEdit={true}
			/>,
		);

		expect(screen.queryByLabelText("Archivo anterior")).toBeNull();
		expect(screen.getByLabelText("Archivo siguiente")).toBeDefined();
	});
});
