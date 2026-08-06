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
		id: "uploaded-1",
		bucket: "news-images",
		storage_path: "new-file.jpg",
		title: "",
		alt_text: "",
		caption: "",
		description: "",
		file_size: 102400,
		mime_type: "image/jpeg",
		dimensions: "",
		url: "https://example.com/storage/v1/object/public/news-images/new-file.jpg",
		uploaded_by: null,
		created_at: "2024-06-15T10:30:00Z",
		updated_at: "2024-06-15T10:30:00Z",
		...overrides,
	};
}

function createMockFile(name: string, size: number, type: string): File {
	const file = new File(["x".repeat(Math.min(size, 1024))], name, { type });
	// Override size to simulate large files for boundary tests
	Object.defineProperty(file, "size", { value: size, writable: false });
	return file;
}

// Mock fetch for signed URL, confirm, and convertible image upload
function mockFetchSuccess() {
	return vi
		.fn()
		.mockImplementation(async (_url: string, init?: RequestInit) => {
			const urlStr = String(_url);
			const method = init?.method || "GET";

			// Convertible image upload (sharp WebP conversion server-side)
			if (urlStr === "/api/media/upload-image" && method === "POST") {
				return new Response(JSON.stringify({ file: makeFile() }), {
					status: 200,
				});
			}

			if (urlStr === "/api/media" && method === "POST") {
				return new Response(
					JSON.stringify({
						path: "new-file.jpg",
						token: "mock-token",
						signedUrl: "https://supabase.co/upload/signed",
						publicUrl:
							"https://example.com/storage/v1/object/public/news-images/new-file.jpg",
					}),
					{ status: 200 },
				);
			}

			if (urlStr === "/api/media/confirm" && method === "POST") {
				return new Response(JSON.stringify({ file: makeFile() }), {
					status: 200,
				});
			}

			return new Response("Not found", { status: 404 });
		});
}

// Mock XMLHttpRequest for the signed URL upload step
function mockXHRSuccess() {
	const xhrMocks: Array<{
		upload: { addEventListener: ReturnType<typeof vi.fn> };
		addEventListener: ReturnType<typeof vi.fn>;
		send: ReturnType<typeof vi.fn>;
		open: ReturnType<typeof vi.fn>;
	}> = [];

	const origXHR = globalThis.XMLHttpRequest;

	const MockXHR = vi.fn(function (this: Record<string, unknown>) {
		const uploadListeners: Record<
			string,
			Array<(...args: unknown[]) => void>
		> = {};
		const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};

		const mock = {
			upload: {
				addEventListener: vi.fn(
					(event: string, handler: (...args: unknown[]) => void) => {
						if (!uploadListeners[event]) uploadListeners[event] = [];
						uploadListeners[event].push(handler);
					},
				),
			},
			addEventListener: vi.fn(
				(event: string, handler: (...args: unknown[]) => void) => {
					if (!listeners[event]) listeners[event] = [];
					listeners[event].push(handler);
				},
			),
			open: vi.fn(),
			send: vi.fn(function (this: Record<string, unknown>) {
				// Simulate progress
				const progressHandlers = uploadListeners["progress"] || [];
				if (progressHandlers.length > 0) {
					progressHandlers[0]({
						lengthComputable: true,
						loaded: 500,
						total: 500,
					});
				}
				// Simulate successful load
				const loadHandlers = listeners["load"] || [];
				if (loadHandlers.length > 0) {
					this.status = 200;
					loadHandlers[0]({});
				}
			}),
			status: 0,
		};

		Object.assign(this, mock);
		xhrMocks.push(mock);
	});

	globalThis.XMLHttpRequest = MockXHR as unknown as typeof XMLHttpRequest;

	return {
		xhrMocks,
		restore: () => {
			globalThis.XMLHttpRequest = origXHR;
		},
	};
}

// ═══════════════════════════════════════════
// Import AFTER mocks
// ═══════════════════════════════════════════
import { UploadZone } from "../upload-zone";

beforeEach(() => {
	vi.clearAllMocks();
});

// ═══════════════════════════════════════════
// UploadZone Tests
// ═══════════════════════════════════════════
describe("UploadZone", () => {
	it("renders drop zone with instructions", () => {
		render(<UploadZone bucket="news-images" onUploadComplete={vi.fn()} />);

		expect(screen.getByText(/arrastra/i)).toBeDefined();
		expect(screen.getByText(/seleccionar archivos/i)).toBeDefined();
	});

	it("shows drag-over visual feedback when dragging files over", () => {
		render(<UploadZone bucket="news-images" onUploadComplete={vi.fn()} />);

		const zone = screen.getByTestId("upload-zone");
		fireEvent.dragEnter(zone, {
			dataTransfer: { types: ["Files"] },
		});

		// Check for the primary color class used in drag-over state
		expect(zone.className).toContain("border-primary/60");
	});

	it("removes drag-over visual feedback when drag leaves", () => {
		render(<UploadZone bucket="news-images" onUploadComplete={vi.fn()} />);

		const zone = screen.getByTestId("upload-zone");
		fireEvent.dragEnter(zone, {
			dataTransfer: { types: ["Files"] },
		});
		expect(zone.className).toContain("border-primary/60");

		fireEvent.dragLeave(zone);
		// After one leave, counter goes to 0 — primary class should be gone
		expect(zone.className).not.toMatch(/border-primary\/60/);
	});

	it("has a hidden file input for click-to-select", () => {
		render(<UploadZone bucket="news-images" onUploadComplete={vi.fn()} />);

		const input = document.querySelector('input[type="file"]');
		expect(input).not.toBeNull();
	});

	it("allows clicking the zone to open file picker", () => {
		render(<UploadZone bucket="news-images" onUploadComplete={vi.fn()} />);

		const zone = screen.getByTestId("upload-zone");
		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;
		const clickSpy = vi.fn();
		if (input) input.click = clickSpy;

		fireEvent.click(zone);
		expect(clickSpy).toHaveBeenCalled();
	});

	it("shows progress bars when files are being uploaded", async () => {
		vi.stubGlobal("fetch", mockFetchSuccess());
		const xhr = mockXHRSuccess();

		const onComplete = vi.fn();
		render(<UploadZone bucket="news-images" onUploadComplete={onComplete} />);

		const file = createMockFile("test.jpg", 500, "image/jpeg");
		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;

		fireEvent.change(input, { target: { files: [file] } });

		await waitFor(() => {
			expect(screen.getByText("test.jpg")).toBeDefined();
		});

		xhr.restore();
	});

	it("calls onUploadComplete after successful upload", async () => {
		vi.stubGlobal("fetch", mockFetchSuccess());
		const xhr = mockXHRSuccess();

		const onComplete = vi.fn();
		render(<UploadZone bucket="news-images" onUploadComplete={onComplete} />);

		const file = createMockFile("test.jpg", 500, "image/jpeg");
		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;

		fireEvent.change(input, { target: { files: [file] } });

		await waitFor(
			() => {
				expect(onComplete).toHaveBeenCalledTimes(1);
			},
			{ timeout: 3000 },
		);

		xhr.restore();
	});

	it("shows error message when upload fails", async () => {
		const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));
		vi.stubGlobal("fetch", mockFetch);

		render(<UploadZone bucket="news-images" onUploadComplete={vi.fn()} />);

		const file = createMockFile("bad.jpg", 500, "image/jpeg");
		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;

		fireEvent.change(input, { target: { files: [file] } });

		await waitFor(() => {
			expect(screen.getByText(/error|falló/i)).toBeDefined();
		});
	});

	it("handles multiple file uploads", async () => {
		vi.stubGlobal("fetch", mockFetchSuccess());
		const xhr = mockXHRSuccess();

		const onComplete = vi.fn();
		render(<UploadZone bucket="news-images" onUploadComplete={onComplete} />);

		const file1 = createMockFile("a.jpg", 100, "image/jpeg");
		const file2 = createMockFile("b.png", 200, "image/png");
		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;

		fireEvent.change(input, { target: { files: [file1, file2] } });

		await waitFor(
			() => {
				expect(onComplete).toHaveBeenCalledTimes(2);
			},
			{ timeout: 3000 },
		);

		xhr.restore();
	});

	it("rejects files larger than 50 MB", async () => {
		render(<UploadZone bucket="news-images" onUploadComplete={vi.fn()} />);

		const bigFile = createMockFile("big.jpg", 51 * 1024 * 1024, "image/jpeg");
		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;

		fireEvent.change(input, { target: { files: [bigFile] } });

		await waitFor(() => {
			expect(screen.getByText(/50 MB|excede/i)).toBeDefined();
		});
	});

	it("does not show file input when canEdit is false", () => {
		render(
			<UploadZone
				bucket="news-images"
				onUploadComplete={vi.fn()}
				canEdit={false}
			/>,
		);

		const input = document.querySelector('input[type="file"]');
		expect(input).toBeNull();
	});

	it("shows disabled message when canEdit is false", () => {
		render(
			<UploadZone
				bucket="news-images"
				onUploadComplete={vi.fn()}
				canEdit={false}
			/>,
		);

		expect(screen.getByText(/no tienes permisos|permiso/i)).toBeDefined();
	});

	// ── TRIANGULATE: Concurrent uploads (3+) ──
	it("handles 3 concurrent uploads", async () => {
		vi.stubGlobal("fetch", mockFetchSuccess());
		const xhr = mockXHRSuccess();

		const onComplete = vi.fn();
		render(<UploadZone bucket="news-images" onUploadComplete={onComplete} />);

		const files = [
			createMockFile("1.jpg", 100, "image/jpeg"),
			createMockFile("2.jpg", 200, "image/jpeg"),
			createMockFile("3.jpg", 300, "image/jpeg"),
		];
		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;

		fireEvent.change(input, { target: { files } });

		await waitFor(
			() => {
				expect(onComplete).toHaveBeenCalledTimes(3);
			},
			{ timeout: 3000 },
		);

		xhr.restore();
	});

	// ── TRIANGULATE: Edge case — file exactly at 50 MB boundary ──
	it("accepts file exactly at 50 MB boundary", async () => {
		vi.stubGlobal("fetch", mockFetchSuccess());
		const xhr = mockXHRSuccess();

		const onComplete = vi.fn();
		render(<UploadZone bucket="news-images" onUploadComplete={onComplete} />);

		const exactFile = createMockFile(
			"exact.jpg",
			50 * 1024 * 1024,
			"image/jpeg",
		);
		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;

		fireEvent.change(input, { target: { files: [exactFile] } });

		await waitFor(
			() => {
				expect(onComplete).toHaveBeenCalledTimes(1);
			},
			{ timeout: 3000 },
		);

		xhr.restore();
	});

	// ── TRIANGULATE: Special filename characters ──
	it("handles filenames with special characters", async () => {
		vi.stubGlobal("fetch", mockFetchSuccess());
		const xhr = mockXHRSuccess();

		const onComplete = vi.fn();
		render(<UploadZone bucket="news-images" onUploadComplete={onComplete} />);

		const file = createMockFile(
			"imagen con espacios & símbolos (1).jpg",
			500,
			"image/jpeg",
		);
		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement;

		fireEvent.change(input, { target: { files: [file] } });

		await waitFor(
			() => {
				expect(onComplete).toHaveBeenCalledTimes(1);
			},
			{ timeout: 3000 },
		);

		xhr.restore();
	});
});
