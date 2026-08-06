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

beforeEach(() => {
	vi.clearAllMocks();
});

// ═══════════════════════════════════════════
// Import components
// ═══════════════════════════════════════════
import { CreateFolderDialog } from "../create-folder-dialog";
import { DeleteConfirmDialog } from "../delete-confirm-dialog";

// ═══════════════════════════════════════════
// CreateFolderDialog Tests
// ═══════════════════════════════════════════
describe("CreateFolderDialog", () => {
	it("does not render when open is false", () => {
		render(
			<CreateFolderDialog
				open={false}
				onOpenChange={vi.fn()}
				onCreate={vi.fn()}
			/>,
		);

		expect(screen.queryByText("Nueva Carpeta")).toBeNull();
	});

	it("renders dialog with form when open is true", () => {
		render(
			<CreateFolderDialog
				open={true}
				onOpenChange={vi.fn()}
				onCreate={vi.fn()}
			/>,
		);

		expect(screen.getByText("Nueva Carpeta")).toBeDefined();
		expect(screen.getByLabelText("Nombre de la carpeta")).toBeDefined();
		expect(screen.getByLabelText("Descripción")).toBeDefined();
	});

	it("has a submit button", () => {
		render(
			<CreateFolderDialog
				open={true}
				onOpenChange={vi.fn()}
				onCreate={vi.fn()}
			/>,
		);

		expect(screen.getByText("Crear")).toBeDefined();
	});

	it("has a cancel button", () => {
		render(
			<CreateFolderDialog
				open={true}
				onOpenChange={vi.fn()}
				onCreate={vi.fn()}
			/>,
		);

		expect(screen.getByText("Cancelar")).toBeDefined();
	});

	it("calls onOpenChange(false) when cancel is clicked", () => {
		const onOpenChange = vi.fn();

		render(
			<CreateFolderDialog
				open={true}
				onOpenChange={onOpenChange}
				onCreate={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByText("Cancelar"));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("calls onCreate with form values on submit", async () => {
		const onCreate = vi.fn().mockResolvedValue(undefined);

		render(
			<CreateFolderDialog
				open={true}
				onOpenChange={vi.fn()}
				onCreate={onCreate}
			/>,
		);

		const nameInput = screen.getByLabelText("Nombre de la carpeta");
		const descInput = screen.getByLabelText("Descripción");

		fireEvent.change(nameInput, { target: { value: "Mi Carpeta" } });
		fireEvent.change(descInput, {
			target: { value: "Una descripción" },
		});

		fireEvent.click(screen.getByText("Crear"));

		await waitFor(() => {
			expect(onCreate).toHaveBeenCalledWith({
				display_name: "Mi Carpeta",
				description: "Una descripción",
			});
		});
	});

	it("disables submit button while creating", async () => {
		const onCreate = vi
			.fn()
			.mockImplementation(() => new Promise((r) => setTimeout(r, 100)));

		render(
			<CreateFolderDialog
				open={true}
				onOpenChange={vi.fn()}
				onCreate={onCreate}
			/>,
		);

		const nameInput = screen.getByLabelText("Nombre de la carpeta");
		fireEvent.change(nameInput, { target: { value: "Test" } });

		const createBtn = screen.getByText("Crear");
		fireEvent.click(createBtn);

		// Button should be disabled during creation
		expect(createBtn.closest("button")?.disabled).toBe(true);
	});

	// ── TRIANGULATE: Rapid double-submit ──
	it("prevents double-submit", async () => {
		const onCreate = vi
			.fn()
			.mockImplementation(() => new Promise((r) => setTimeout(r, 100)));

		render(
			<CreateFolderDialog
				open={true}
				onOpenChange={vi.fn()}
				onCreate={onCreate}
			/>,
		);

		const nameInput = screen.getByLabelText("Nombre de la carpeta");
		fireEvent.change(nameInput, { target: { value: "Test" } });

		const createBtn = screen.getByText("Crear");
		fireEvent.click(createBtn);
		fireEvent.click(createBtn); // Double click

		await waitFor(() => {
			expect(onCreate).toHaveBeenCalledTimes(1);
		});
	});
});

// ═══════════════════════════════════════════
// DeleteConfirmDialog Tests
// ═══════════════════════════════════════════
describe("DeleteConfirmDialog", () => {
	it("does not render when open is false", () => {
		render(
			<DeleteConfirmDialog
				open={false}
				onOpenChange={vi.fn()}
				onConfirm={vi.fn()}
				folderName="Test Folder"
			/>,
		);

		expect(screen.queryByText(/eliminar carpeta/i)).toBeNull();
	});

	it("renders confirmation with folder name", () => {
		render(
			<DeleteConfirmDialog
				open={true}
				onOpenChange={vi.fn()}
				onConfirm={vi.fn()}
				folderName="Recursos Importantes"
			/>,
		);

		expect(screen.getByText(/eliminar carpeta/i)).toBeDefined();
		// Folder name appears both in <strong> and <code> — verify it's present
		const matches = screen.getAllByText(/Recursos Importantes/);
		expect(matches.length).toBeGreaterThanOrEqual(1);
	});

	it("has a text input for re-typing the folder name", () => {
		render(
			<DeleteConfirmDialog
				open={true}
				onOpenChange={vi.fn()}
				onConfirm={vi.fn()}
				folderName="Test"
			/>,
		);

		const input = screen.getByPlaceholderText(/escribe.*eliminar/i);
		expect(input).toBeDefined();
	});

	it("disables confirm button when name does not match", () => {
		render(
			<DeleteConfirmDialog
				open={true}
				onOpenChange={vi.fn()}
				onConfirm={vi.fn()}
				folderName="Mi Carpeta"
			/>,
		);

		const confirmBtn = screen.getByRole("button", { name: /eliminar/i });
		expect((confirmBtn as HTMLButtonElement).disabled).toBe(true);
	});

	it("enables confirm button when name matches exactly", () => {
		render(
			<DeleteConfirmDialog
				open={true}
				onOpenChange={vi.fn()}
				onConfirm={vi.fn()}
				folderName="Mi Carpeta"
			/>,
		);

		const input = screen.getByPlaceholderText(/escribe.*eliminar/i);
		fireEvent.change(input, { target: { value: "Mi Carpeta" } });

		const confirmBtn = screen.getByRole("button", { name: /eliminar/i });
		expect((confirmBtn as HTMLButtonElement).disabled).toBe(false);
	});

	it("calls onConfirm when delete button is clicked with matching name", () => {
		const onConfirm = vi.fn();

		render(
			<DeleteConfirmDialog
				open={true}
				onOpenChange={vi.fn()}
				onConfirm={onConfirm}
				folderName="Temp"
			/>,
		);

		const input = screen.getByPlaceholderText(/escribe.*eliminar/i);
		fireEvent.change(input, { target: { value: "Temp" } });

		const confirmBtn = screen.getByRole("button", { name: /eliminar/i });
		fireEvent.click(confirmBtn);

		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it("has a cancel button", () => {
		const onOpenChange = vi.fn();

		render(
			<DeleteConfirmDialog
				open={true}
				onOpenChange={onOpenChange}
				onConfirm={vi.fn()}
				folderName="Test"
			/>,
		);

		const cancelBtn = screen.getByText("Cancelar");
		fireEvent.click(cancelBtn);
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	// ── TRIANGULATE: Mismatched name ──
	it("keeps confirm disabled when name partially matches", () => {
		render(
			<DeleteConfirmDialog
				open={true}
				onOpenChange={vi.fn()}
				onConfirm={vi.fn()}
				folderName="Mi Carpeta"
			/>,
		);

		const input = screen.getByPlaceholderText(/escribe.*eliminar/i);
		fireEvent.change(input, { target: { value: "Mi Carpet" } }); // Missing 'a'

		const confirmBtn = screen.getByRole("button", { name: /eliminar/i });
		expect((confirmBtn as HTMLButtonElement).disabled).toBe(true);
	});

	// ── TRIANGULATE: Whitespace handling ──
	it("requires exact match including whitespace", () => {
		render(
			<DeleteConfirmDialog
				open={true}
				onOpenChange={vi.fn()}
				onConfirm={vi.fn()}
				folderName="  Mi Carpeta  "
			/>,
		);

		const input = screen.getByPlaceholderText(/escribe.*eliminar/i);
		fireEvent.change(input, { target: { value: "Mi Carpeta" } }); // No surrounding spaces

		const confirmBtn = screen.getByRole("button", { name: /eliminar/i });
		// Should not match because of whitespace
		expect((confirmBtn as HTMLButtonElement).disabled).toBe(true);
	});
});
