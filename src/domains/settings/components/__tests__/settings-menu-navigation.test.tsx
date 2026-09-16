/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	render,
	screen,
	within,
	fireEvent,
	cleanup,
	waitFor,
	configure,
} from "@testing-library/react";

// El árbol carga en diferido los hijos de cada categoría.
configure({ asyncUtilTimeout: 5000 });

const { state, pushMock, refreshMock } = vi.hoisted(() => ({
	state: { items: [] as Record<string, unknown>[] },
	pushMock: vi.fn(),
	refreshMock: vi.fn(),
}));

vi.mock("@/shared/hooks/use-api-query", () => ({
	useApiQuery: () => ({
		data: state.items,
		isLoading: false,
		mutate: vi.fn(),
	}),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

import { SettingsMenuClient } from "../settings-menu";

function menuItem(overrides: Record<string, unknown>) {
	return {
		id: "id",
		name: "Elemento",
		url: "/zona-raider/ruta",
		icon_name: "IconLink",
		order_index: 10,
		parent_id: null,
		is_active: true,
		navigation_item_roles: [],
		...overrides,
	};
}

beforeEach(() => {
	state.items = [
		menuItem({
			id: "raiz",
			name: "Zona Raider",
			url: null,
			icon_name: "IconFolder",
			order_index: 10,
		}),
		menuItem({ id: "roster", name: "Roster", parent_id: "raiz", order_index: 10 }),
		menuItem({ id: "stats", name: "Stats", parent_id: "raiz", order_index: 20 }),
	];
	pushMock.mockReset();
	refreshMock.mockReset();
});

afterEach(() => {
	cleanup();
});

describe("gestión del menú", () => {
	it("lleva al formulario de edición al abrir un elemento", async () => {
		render(<SettingsMenuClient />);

		const rosterRow = (
			await screen.findByText("Roster")
		).closest('[role="treeitem"]') as HTMLElement;
		fireEvent.pointerDown(
			within(rosterRow).getByRole("button", { name: "Abrir menú de opciones" }),
			{ button: 0, ctrlKey: false },
		);
		fireEvent.click(await screen.findByRole("menuitem", { name: /Editar/ }));

		expect(pushMock).toHaveBeenCalledWith(
			"/zona-raider/configuracion/menu/roster",
		);
	});

	it("abre el formulario de alta con el contexto de la fila pulsada", async () => {
		render(<SettingsMenuClient />);

		fireEvent.click(
			await screen.findByRole("button", {
				name: "Añadir enlace debajo de Roster",
			}),
		);

		expect(pushMock).toHaveBeenCalledWith(
			"/zona-raider/configuracion/menu/nuevo?tipo=enlace&padre=raiz&despues=roster",
		);
	});

	it("abre el formulario de alta dentro de una categoría", async () => {
		render(<SettingsMenuClient />);

		fireEvent.click(
			await screen.findByRole("button", {
				name: "Añadir enlace dentro de Zona Raider",
			}),
		);

		expect(pushMock).toHaveBeenCalledWith(
			"/zona-raider/configuracion/menu/nuevo?tipo=enlace&padre=raiz",
		);
	});

	it("expande y colapsa las categorías", async () => {
		render(<SettingsMenuClient />);

		await screen.findByText("Roster");
		const toolbar = screen.getByRole("toolbar", { name: "Vista del menú" });
		fireEvent.click(within(toolbar).getByRole("button", { name: "Colapsar" }));

		await waitFor(() => expect(screen.queryByText("Roster")).toBeNull());
		fireEvent.click(within(toolbar).getByRole("button", { name: "Expandir" }));

		expect(await screen.findByText("Roster")).toBeTruthy();
	});
});
