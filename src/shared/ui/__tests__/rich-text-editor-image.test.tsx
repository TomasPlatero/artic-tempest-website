/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	render,
	screen,
	fireEvent,
	cleanup,
} from "@testing-library/react";

afterEach(() => {
	cleanup();
});

// ═══════════════════════════════════════════
// Mocks for Tiptap
// ═══════════════════════════════════════════
const mockChainFocusSetImageRun = vi.fn();
const mockChainFocusExtendMarkRangeSetLinkRun = vi.fn();
const mockChainFocusSetYoutubeVideoRun = vi.fn();

const mockEditor = {
	chain: () => ({
		focus: () => ({
			setImage: () => ({ run: mockChainFocusSetImageRun }),
			extendMarkRange: () => ({
				setLink: () => ({ run: mockChainFocusExtendMarkRangeSetLinkRun }),
			}),
			setYoutubeVideo: () => ({ run: mockChainFocusSetYoutubeVideoRun }),
			toggleBold: () => ({ run: vi.fn() }),
			toggleItalic: () => ({ run: vi.fn() }),
			toggleUnderline: () => ({ run: vi.fn() }),
			toggleBulletList: () => ({ run: vi.fn() }),
			toggleOrderedList: () => ({ run: vi.fn() }),
			toggleBlockquote: () => ({ run: vi.fn() }),
			toggleCode: () => ({ run: vi.fn() }),
			unsetAllMarks: () => ({ clearNodes: () => ({ run: vi.fn() }) }),
			undo: () => ({ run: vi.fn() }),
			redo: () => ({ run: vi.fn() }),
			insertContent: () => ({ run: vi.fn() }),
		}),
	}),
	isActive: () => false,
	getHTML: () => "<p></p>",
	commands: {
		clearContent: vi.fn(),
	},
	on: vi.fn(),
	off: vi.fn(),
	destroy: vi.fn(),
};

vi.mock("@tiptap/react", () => ({
	useEditor: () => mockEditor,
	EditorContent: ({ editor: _editor }: { editor: unknown }) => (
		<div data-testid="editor-content">Editor Content</div>
	),
	ReactRenderer: vi.fn(),
}));

// Mock window.prompt
const originalPrompt = window.prompt;

// ═══════════════════════════════════════════
// Import component AFTER mocks
// ═══════════════════════════════════════════
import { RichTextEditor } from "@/shared/ui/rich-text-editor";

beforeEach(() => {
	vi.clearAllMocks();
	window.prompt = originalPrompt;
});

describe("RichTextEditor image integration", () => {
	describe("when onRequestImage is NOT provided", () => {
		it("uses window.prompt for image URL (default behavior)", () => {
			const mockPrompt = vi.fn(() => "https://example.com/image.jpg");
			window.prompt = mockPrompt;

			render(<RichTextEditor value="" onChange={vi.fn()} />);

			// Click the image button
			const imageBtn = screen.getByTitle("Adjuntar Imagen");
			fireEvent.click(imageBtn);

			expect(mockPrompt).toHaveBeenCalledWith("URL de la imagen");
			expect(mockChainFocusSetImageRun).toHaveBeenCalled();
		});

		it("does nothing if prompt returns null", () => {
			const mockPrompt = vi.fn(() => null);
			window.prompt = mockPrompt;

			render(<RichTextEditor value="" onChange={vi.fn()} />);

			const imageBtn = screen.getByTitle("Adjuntar Imagen");
			fireEvent.click(imageBtn);

			expect(mockPrompt).toHaveBeenCalled();
			expect(mockChainFocusSetImageRun).not.toHaveBeenCalled();
		});
	});

	describe("when onRequestImage IS provided", () => {
		it("calls onRequestImage instead of window.prompt", () => {
			const mockPrompt = vi.fn();
			window.prompt = mockPrompt;
			const onRequestImage = vi.fn();

			render(
				<RichTextEditor
					value=""
					onChange={vi.fn()}
					onRequestImage={onRequestImage}
				/>,
			);

			const imageBtn = screen.getByTitle("Adjuntar Imagen");
			fireEvent.click(imageBtn);

			// Should NOT call prompt
			expect(mockPrompt).not.toHaveBeenCalled();
			// Should call onRequestImage
			expect(onRequestImage).toHaveBeenCalledTimes(1);
		});

		it("onRequestImage receives a callback that inserts an image URL", () => {
			const onRequestImage = vi.fn((insertUrl: (url: string) => void) => {
				// Simulate MediaPicker flow: user selects file → insert URL
				insertUrl("https://example.com/photos/cool.jpg");
			});

			render(
				<RichTextEditor
					value=""
					onChange={vi.fn()}
					onRequestImage={onRequestImage}
				/>,
			);

			const imageBtn = screen.getByTitle("Adjuntar Imagen");
			fireEvent.click(imageBtn);

			expect(onRequestImage).toHaveBeenCalled();
			// The callback should have triggered setImage with the URL
			expect(mockChainFocusSetImageRun).toHaveBeenCalled();
		});

		it("callback does nothing if called with empty string", () => {
			const onRequestImage = vi.fn((insertUrl: (url: string) => void) => {
				insertUrl("");
			});

			render(
				<RichTextEditor
					value=""
					onChange={vi.fn()}
					onRequestImage={onRequestImage}
				/>,
			);

			const imageBtn = screen.getByTitle("Adjuntar Imagen");
			fireEvent.click(imageBtn);

			expect(onRequestImage).toHaveBeenCalled();
			// Empty URL should NOT trigger setImage
			expect(mockChainFocusSetImageRun).not.toHaveBeenCalled();
		});
	});
});
