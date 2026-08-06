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
		storage_path: "hero.jpg",
		title: "Hero Image",
		alt_text: "",
		caption: "",
		description: "",
		file_size: 204800,
		mime_type: "image/jpeg",
		dimensions: "1920x1080",
		url: "https://example.com/storage/v1/object/public/news-images/hero.jpg",
		uploaded_by: null,
		created_at: "2024-06-15T10:30:00Z",
		updated_at: "2024-06-15T10:30:00Z",
		...overrides,
	};
}

function createFetchMock(files: MediaFile[], nextCursor: string | null = null) {
	return vi.fn().mockImplementation(async (_url: string | URL | Request) => {
		// oxlint-disable-next-line no-base-to-string
		const urlStr = String(_url);
		// Handle folders API
		if (urlStr.startsWith("/api/media/folders")) {
			return new Response(
				JSON.stringify({
					folders: [
						{
							id: "f1",
							bucket_name: "news-images",
							display_name: "Imágenes de Noticias",
							description: "",
							sort_order: 1,
							is_system: true,
							file_count: files.length,
							created_at: "2024-01-01T00:00:00Z",
							updated_at: "2024-01-01T00:00:00Z",
						},
					],
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		}
		if (urlStr.startsWith("/api/media")) {
			return new Response(
				JSON.stringify({
					files,
					nextCursor,
					total: files.length,
				}),
				{ status: 200 },
			);
		}
		return new Response("Not found", { status: 404 });
	});
}

// ═══════════════════════════════════════════
// Mock next/navigation
// ═══════════════════════════════════════════
vi.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams(),
	useRouter: () => ({ push: vi.fn() }),
}));

// ═══════════════════════════════════════════
// Mock next/image
// ═══════════════════════════════════════════
vi.mock("next/image", () => ({
	default: ({
		priority: _priority,
		alt,
		src,
		fill: _fill,
		sizes: _sizes,
		className: _className,
		width: _width,
		height: _height,
		...rest
	}: Record<string, unknown>) => (
		// eslint-disable-next-line @next/next/no-img-element -- mock for next/image in tests
		<img src={src as string} alt={(alt as string) ?? ""} {...rest} />
	),
}));

// ═══════════════════════════════════════════
// Mock useMediaFiles — each test controls files via stubMediaFiles
// ═══════════════════════════════════════════
const stubMediaFiles = {
	files: [] as MediaFile[],
	isLoading: false,
};

vi.mock("@/domains/media/hooks/use-media-files", () => ({
	useMediaFiles: () => stubMediaFiles,
}));

// ═══════════════════════════════════════════
// Import component AFTER mocks

// ═══════════════════════════════════════════
import { MediaPicker } from "../media-picker";

async function navigateToFolder() {
	await waitFor(() => {
		expect(screen.getByText("Imágenes de Noticias")).toBeDefined();
	});
	fireEvent.click(screen.getByText("Imágenes de Noticias"));
}

// Global cleanup
beforeEach(() => {
	vi.clearAllMocks();
	stubMediaFiles.files = [];
	stubMediaFiles.isLoading = false;
});

describe("MediaPicker", () => {
	describe("when open", () => {
		it("renders the dialog with correct title", () => {
			const fetchMock = createFetchMock([]);
			vi.stubGlobal("fetch", fetchMock);

			render(
				<MediaPicker
					bucket="news-images"
					open={true}
					onSelect={vi.fn()}
					onClose={vi.fn()}
					title="Seleccionar imagen"
				/>,
			);

			expect(screen.getByText("Seleccionar imagen")).toBeDefined();
		});

		it("uses default title when none provided", () => {
			const fetchMock = createFetchMock([]);
			vi.stubGlobal("fetch", fetchMock);

			render(
				<MediaPicker
					bucket="news-images"
					open={true}
					onSelect={vi.fn()}
					onClose={vi.fn()}
				/>,
			);

			expect(screen.getByText("Biblioteca Multimedia")).toBeDefined();
		});

		it("fetches files scoped to the specified bucket", async () => {
			const files = [
				makeFile({
					id: "f1",
					title: "Image One",
					bucket: "news-images",
					storage_path: "img1.jpg",
				}),
				makeFile({
					id: "f2",
					title: "Image Two",
					bucket: "news-images",
					storage_path: "img2.jpg",
				}),
			];
			stubMediaFiles.files = files;
			const fetchMock = createFetchMock(files);
			vi.stubGlobal("fetch", fetchMock);

			render(
				<MediaPicker
					bucket="news-images"
					open={true}
					onSelect={vi.fn()}
					onClose={vi.fn()}
				/>,
			);

			await navigateToFolder();

			await waitFor(() => {
				expect(screen.getByText("Image One")).toBeDefined();
				expect(screen.getByText("Image Two")).toBeDefined();
			});
		});

		it('shows "Usar este archivo" button on each file card', async () => {
			const files = [
				makeFile({ id: "f1", title: "", storage_path: "img1.jpg" }),
			];
			stubMediaFiles.files = files;
			const fetchMock = createFetchMock(files);
			vi.stubGlobal("fetch", fetchMock);

			render(
				<MediaPicker
					bucket="news-images"
					open={true}
					onSelect={vi.fn()}
					onClose={vi.fn()}
				/>,
			);

			await navigateToFolder();

			await waitFor(() => {
				expect(screen.getByText("img1.jpg")).toBeDefined();
			});

			expect(screen.getByText("Usar este archivo")).toBeDefined();
		});

		it("calls onSelect with the file when 'Usar este archivo' is clicked", async () => {
			const file = makeFile({ id: "f1", title: "", storage_path: "img1.jpg" });
			stubMediaFiles.files = [file];
			const fetchMock = createFetchMock([file]);
			vi.stubGlobal("fetch", fetchMock);
			const onSelect = vi.fn();

			render(
				<MediaPicker
					bucket="news-images"
					open={true}
					onSelect={onSelect}
					onClose={vi.fn()}
				/>,
			);

			await navigateToFolder();

			await waitFor(() => {
				expect(screen.getByText("img1.jpg")).toBeDefined();
			});

			fireEvent.click(screen.getByText("Usar este archivo"));

			expect(onSelect).toHaveBeenCalledWith(file);
		});

		it("calls onSelect when clicking on the file card (click-to-select)", async () => {
			const file = makeFile({ id: "f1", title: "", storage_path: "img1.jpg" });
			stubMediaFiles.files = [file];
			const fetchMock = createFetchMock([file]);
			vi.stubGlobal("fetch", fetchMock);
			const onSelect = vi.fn();

			render(
				<MediaPicker
					bucket="news-images"
					open={true}
					onSelect={onSelect}
					onClose={vi.fn()}
				/>,
			);

			await navigateToFolder();

			await waitFor(() => {
				expect(screen.getByText("img1.jpg")).toBeDefined();
			});

			// Click the card (not the button) - the card itself should trigger selection
			const card = screen.getByTestId("picker-file-card-f1");
			fireEvent.click(card);

			expect(onSelect).toHaveBeenCalledWith(file);
		});
	});

	describe("upload integration", () => {
		it("shows UploadZone when showUpload is true", async () => {
			stubMediaFiles.files = [makeFile({ id: "f1" })];
			const fetchMock = createFetchMock([]);
			vi.stubGlobal("fetch", fetchMock);

			render(
				<MediaPicker
					bucket="news-images"
					open={true}
					onSelect={vi.fn()}
					onClose={vi.fn()}
					showUpload={true}
				/>,
			);

			await navigateToFolder();

			await waitFor(() => {
				expect(screen.getByTestId("upload-zone")).toBeDefined();
			});
		});

		it("hides UploadZone when showUpload is false", async () => {
			const fetchMock = createFetchMock([]);
			vi.stubGlobal("fetch", fetchMock);

			render(
				<MediaPicker
					bucket="news-images"
					open={true}
					onSelect={vi.fn()}
					onClose={vi.fn()}
					showUpload={false}
				/>,
			);

			await waitFor(() => {
				// Wait for initial fetch
			});

			expect(screen.queryByTestId("upload-zone")).toBeNull();
		});

		it("hides UploadZone by default when showUpload not specified", async () => {
			const fetchMock = createFetchMock([]);
			vi.stubGlobal("fetch", fetchMock);

			render(
				<MediaPicker
					bucket="news-images"
					open={true}
					onSelect={vi.fn()}
					onClose={vi.fn()}
				/>,
			);

			await waitFor(() => {
				// Wait for initial fetch
			});

			expect(screen.queryByTestId("upload-zone")).toBeNull();
		});
	});

	describe("dialog behavior", () => {
		it("does not render content when open is false", () => {
			const fetchMock = createFetchMock([]);
			vi.stubGlobal("fetch", fetchMock);

			render(
				<MediaPicker
					bucket="news-images"
					open={false}
					onSelect={vi.fn()}
					onClose={vi.fn()}
				/>,
			);

			expect(screen.queryByText("Biblioteca Multimedia")).toBeNull();
		});

		it("calls onClose when close button is clicked", async () => {
			const fetchMock = createFetchMock([]);
			vi.stubGlobal("fetch", fetchMock);
			const onClose = vi.fn();

			render(
				<MediaPicker
					bucket="news-images"
					open={true}
					onSelect={vi.fn()}
					onClose={onClose}
				/>,
			);

			await waitFor(() => {
				expect(screen.getByText("Biblioteca Multimedia")).toBeDefined();
			});

			// Find close/cancel button
			const cancelBtn = screen.getByText("Cancelar");
			fireEvent.click(cancelBtn);

			expect(onClose).toHaveBeenCalled();
		});
	});

	describe("loading state", () => {
		it("shows loading skeleton while fetching files", () => {
			// Use a never-resolving fetch to keep loading state
			const fetchMock = vi.fn(() => new Promise(() => {}));
			vi.stubGlobal("fetch", fetchMock);

			render(
				<MediaPicker
					bucket="news-images"
					open={true}
					onSelect={vi.fn()}
					onClose={vi.fn()}
				/>,
			);

			// Folder loading state shows skeleton placeholders
			const skeletons = document.querySelectorAll(".animate-pulse");
			expect(skeletons.length).toBeGreaterThan(0);
		});
	});

	describe("empty state", () => {
		it("shows empty message when bucket has no files", async () => {
			stubMediaFiles.files = [];
			stubMediaFiles.isLoading = false;
			const fetchMock = createFetchMock([]);
			vi.stubGlobal("fetch", fetchMock);

			render(
				<MediaPicker
					bucket="news-images"
					open={true}
					onSelect={vi.fn()}
					onClose={vi.fn()}
				/>,
			);

			await navigateToFolder();

			await waitFor(() => {
				expect(screen.getByText(/esta carpeta está vacía/i)).toBeDefined();
			});
		});
	});

	describe("allowedTypes filtering", () => {
		it("passes allowedTypes hint to the fetch context (placeholder)", async () => {
			const files = [
				makeFile({ id: "f1", title: "PNG File", mime_type: "image/png" }),
			];
			stubMediaFiles.files = files;
			const fetchMock = createFetchMock(files);
			vi.stubGlobal("fetch", fetchMock);

			render(
				<MediaPicker
					bucket="news-images"
					open={true}
					onSelect={vi.fn()}
					onClose={vi.fn()}
					allowedTypes={["image/png", "image/jpeg"]}
				/>,
			);

			await navigateToFolder();

			await waitFor(() => {
				expect(screen.getByText("PNG File")).toBeDefined();
			});
		});
	});
});
