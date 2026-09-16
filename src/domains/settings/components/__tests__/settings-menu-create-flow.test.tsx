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

// El contenido del editor se carga en diferido: damos margen en máquinas cargadas.
configure({ asyncUtilTimeout: 5000 });

const { state, routerRefresh, toastSuccess, toastError } = vi.hoisted(() => ({
	state: {
		items: [] as Record<string, unknown>[],
		roles: [] as Record<string, unknown>[],
	},
	routerRefresh: vi.fn(),
	toastSuccess: vi.fn(),
	toastError: vi.fn(),
}));

vi.mock("@/shared/hooks/use-api-query", () => ({
	useApiQuery: (key: string) =>
		key === "/api/guild/roles"
			? { data: state.roles }
			: { data: state.items, isLoading: false, mutate: vi.fn() },
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: routerRefresh }),
}));

vi.mock("sonner", () => ({
	toast: { success: toastSuccess, error: toastError },
}));

import { SettingsMenuClient } from "../settings-menu";

const fetchMock = vi.fn();

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
		menuItem({
			id: "roster",
			name: "Roster",
			parent_id: "raiz",
			order_index: 10,
			navigation_item_roles: [{ role_level: "gm" }],
		}),
		menuItem({
			id: "stats",
			name: "Stats",
			url: "/zona-raider/stats",
			parent_id: "raiz",
			order_index: 20,
		}),
	];
	state.roles = [
		{ level: "gm", label: "Guild Master" },
		{ level: "officer", label: "Oficial" },
		{ level: "invitado", label: "Invitado" },
	];

	fetchMock.mockReset();
	fetchMock.mockImplementation(async () => ({
		ok: true,
		json: async () => ({ id: "nuevo-1", success: true }),
	}));
	globalThis.fetch = fetchMock as unknown as typeof fetch;

	routerRefresh.mockReset();
	toastSuccess.mockReset();
	toastError.mockReset();
});

afterEach(() => {
	cleanup();
});

function clickCreate() {
	fireEvent.click(screen.getByRole("button", { name: /Crear/ }));
}

describe("alta de elementos del menú", () => {
	it("abre el editor en borrador y no escribe nada hasta pulsar Crear", async () => {
		render(<SettingsMenuClient />);

		fireEvent.click(
			await screen.findByRole("button", {
				name: "Añadir enlace debajo de Roster",
			}),
		);

		expect(
			await screen.findByRole("heading", { name: "Nuevo Enlace" }),
		).toBeTruthy();
		expect(screen.getByRole("button", { name: /Crear/ })).toBeTruthy();
		expect(await screen.findByDisplayValue("Nuevo Enlace")).toBeTruthy();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("crea el enlace justo debajo de la fila pulsada, con sus permisos", async () => {
		render(<SettingsMenuClient />);

		fireEvent.click(
			await screen.findByRole("button", {
				name: "Añadir enlace debajo de Roster",
			}),
		);
		await screen.findByRole("heading", { name: "Nuevo Enlace" });

		fireEvent.change(await screen.findByDisplayValue("Nuevo Enlace"), {
			target: { value: "Progreso" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Guild Master" }));
		clickCreate();

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

		const [postUrl, postInit] = fetchMock.mock.calls[0];
		expect(postUrl).toBe("/api/admin/navigation");
		expect(postInit.method).toBe("POST");
		const body = JSON.parse(postInit.body);
		expect(body).toMatchObject({
			name: "Progreso",
			url: "/zona-raider/cambiame",
			icon_name: "IconLink",
			order_index: 30,
			parent_id: "raiz",
			roles: ["gm"],
		});
		expect(body).not.toHaveProperty("isDraft");
		expect(body).not.toHaveProperty("insertAfterId");

		const [reorderUrl, reorderInit] = fetchMock.mock.calls[1];
		expect(reorderUrl).toBe("/api/admin/navigation/reorder");
		const reorderBody = JSON.parse(reorderInit.body);
		expect(reorderBody.items).toEqual([
			{ id: "roster", order_index: 10, parent_id: "raiz" },
			{ id: "nuevo-1", order_index: 20, parent_id: "raiz" },
			{ id: "stats", order_index: 30, parent_id: "raiz" },
		]);
		expect(toastSuccess).toHaveBeenCalledWith("Enlace creado");
	});

	it("añade un enlace dentro de la categoría sin reordenar el nivel", async () => {
		render(<SettingsMenuClient />);

		fireEvent.click(
			await screen.findByRole("button", {
				name: "Añadir enlace dentro de Zona Raider",
			}),
		);
		await screen.findByRole("heading", { name: "Nuevo Enlace" });
		clickCreate();

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const body = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(body.parent_id).toBe("raiz");
		expect(body.roles).toEqual([]);
	});

	it("no crea nada si se cancela el borrador", async () => {
		render(<SettingsMenuClient />);

		fireEvent.click(
			await screen.findByRole("button", {
				name: "Añadir enlace debajo de Roster",
			}),
		);
		await screen.findByRole("heading", { name: "Nuevo Enlace" });

		fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

		await waitFor(() =>
			expect(screen.queryByRole("heading", { name: "Nuevo Enlace" })).toBeNull(),
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("avisa del error y no cierra el editor si el alta falla", async () => {
		fetchMock.mockImplementation(async () => ({
			ok: false,
			json: async () => ({ error: "permission denied" }),
		}));
		render(<SettingsMenuClient />);

		fireEvent.click(
			await screen.findByRole("button", {
				name: "Añadir enlace debajo de Roster",
			}),
		);
		await screen.findByRole("heading", { name: "Nuevo Enlace" });
		clickCreate();

		await waitFor(() =>
			expect(toastError).toHaveBeenCalledWith("permission denied"),
		);
		expect(toastSuccess).not.toHaveBeenCalled();
		expect(screen.getByRole("heading", { name: "Nuevo Enlace" })).toBeTruthy();
	});
});

describe("edición de elementos existentes", () => {
	it("abre el editor con los permisos guardados ya marcados", async () => {
		render(<SettingsMenuClient />);

		const rosterRow = (
			await screen.findByText("Roster")
		).closest('[role="treeitem"]') as HTMLElement;
		fireEvent.pointerDown(
			within(rosterRow).getByRole("button", { name: "Abrir menú de opciones" }),
			{ button: 0, ctrlKey: false },
		);
		fireEvent.click(await screen.findByRole("menuitem", { name: /Editar/ }));

		expect(
			await screen.findByRole("heading", { name: "Editar Elemento" }),
		).toBeTruthy();
		expect(await screen.findByDisplayValue("Roster")).toBeTruthy();
		expect(
			screen.getByRole("button", { name: "Guild Master" }).getAttribute(
				"aria-pressed",
			),
		).toBe("true");
		expect(
			screen.getByRole("button", { name: "Oficial" }).getAttribute(
				"aria-pressed",
			),
		).toBe("false");
		expect(screen.getByRole("button", { name: /Guardar/ })).toBeTruthy();
	});
});
