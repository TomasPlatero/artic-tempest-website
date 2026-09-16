/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
	render,
	screen,
	fireEvent,
	cleanup,
	waitFor,
} from "@testing-library/react";

const { pushMock, refreshMock, mutateMock, toastSuccess, toastError } =
	vi.hoisted(() => ({
		pushMock: vi.fn(),
		refreshMock: vi.fn(),
		mutateMock: vi.fn(async () => undefined),
		toastSuccess: vi.fn(),
		toastError: vi.fn(),
	}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("swr", () => ({
	useSWRConfig: () => ({ mutate: mutateMock }),
}));

vi.mock("sonner", () => ({
	toast: { success: toastSuccess, error: toastError },
}));

vi.mock("@/shared/hooks/use-api-query", () => ({
	useApiQuery: () => ({ data: [] }),
}));

import { SettingsMenuForm } from "../settings-menu-form";
import { createNewItemDraft } from "@/domains/settings/lib/menu-editor";
import type { NavigationItem } from "../settings-menu.types";

const fetchMock = vi.fn();

function menuItem(overrides: Partial<NavigationItem>): NavigationItem {
	return {
		id: overrides.id ?? "id",
		name: overrides.name ?? "Elemento",
		url: overrides.url ?? "/zona-raider/ruta",
		icon_name: overrides.icon_name ?? "IconLink",
		order_index: overrides.order_index ?? 0,
		parent_id: overrides.parent_id ?? null,
		is_active: overrides.is_active ?? true,
		...overrides,
	};
}

const items: NavigationItem[] = [
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

const roleOptions = [
	{ value: "gm", label: "Guild Master" },
	{ value: "officer", label: "Oficial" },
];

beforeEach(() => {
	fetchMock.mockReset();
	fetchMock.mockImplementation(async () => ({
		ok: true,
		json: async () => ({ id: "nuevo-1" }),
	}));
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	pushMock.mockReset();
	refreshMock.mockReset();
	mutateMock.mockClear();
	toastSuccess.mockReset();
	toastError.mockReset();
});

afterEach(() => {
	cleanup();
});

describe("alta de un elemento del menú", () => {
	it("muestra todos los datos del elemento en la página", () => {
		render(
			<SettingsMenuForm
				mode="create"
				item={createNewItemDraft("link", items, { parentId: "raiz" })}
				items={items}
				roleOptions={roleOptions}
			/>,
		);

		for (const label of [
			"Nombre",
			"URL / Ruta",
			"Icono",
			"Padre (Nivel superior)",
			"App ID",
			"Visibilidad",
			"Activo",
			"Descripción (Mega Menú)",
			"Clase CSS",
			"ID Elemento",
			"Permisos de visualización",
		]) {
			expect(screen.getAllByText(label).length).toBeGreaterThan(0);
		}
		expect(screen.getByRole("button", { name: /Crear elemento/ })).toBeTruthy();
		expect(screen.getByRole("button", { name: "Cancelar" })).toBeTruthy();
	});

	it("crea el elemento con sus permisos y vuelve al listado", async () => {
		render(
			<SettingsMenuForm
				mode="create"
				item={createNewItemDraft("link", items, { parentId: "raiz" })}
				items={items}
				roleOptions={roleOptions}
				insertAfterId="roster"
			/>,
		);

		fireEvent.change(screen.getByDisplayValue("Nuevo Enlace"), {
			target: { value: "Progreso" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Guild Master" }));
		fireEvent.click(screen.getByRole("button", { name: /Crear elemento/ }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

		const [postUrl, postInit] = fetchMock.mock.calls[0];
		expect(postUrl).toBe("/api/admin/navigation");
		expect(postInit.method).toBe("POST");
		const body = JSON.parse(postInit.body);
		expect(body).toMatchObject({
			name: "Progreso",
			url: "/zona-raider/cambiame",
			parent_id: "raiz",
			order_index: 30,
			roles: ["gm"],
		});

		const [reorderUrl, reorderInit] = fetchMock.mock.calls[1];
		expect(reorderUrl).toBe("/api/admin/navigation/reorder");
		expect(JSON.parse(reorderInit.body).items).toEqual([
			{ id: "roster", order_index: 10, parent_id: "raiz" },
			{ id: "nuevo-1", order_index: 20, parent_id: "raiz" },
			{ id: "stats", order_index: 30, parent_id: "raiz" },
		]);

		expect(mutateMock).toHaveBeenCalledWith("/api/admin/navigation");
		expect(pushMock).toHaveBeenCalledWith("/zona-raider/configuracion/menu");
		expect(toastSuccess).toHaveBeenCalledWith("Enlace creado");
	});

	it("no guarda nada si se cancela", async () => {
		render(
			<SettingsMenuForm
				mode="create"
				item={createNewItemDraft("category", items)}
				items={items}
				roleOptions={roleOptions}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

		await waitFor(() =>
			expect(pushMock).toHaveBeenCalledWith("/zona-raider/configuracion/menu"),
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("avisa del error y no sale de la página si el alta falla", async () => {
		fetchMock.mockImplementation(async () => ({
			ok: false,
			json: async () => ({ error: "permission denied" }),
		}));

		render(
			<SettingsMenuForm
				mode="create"
				item={createNewItemDraft("link", items)}
				items={items}
				roleOptions={roleOptions}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /Crear elemento/ }));

		await waitFor(() =>
			expect(toastError).toHaveBeenCalledWith("permission denied"),
		);
		expect(pushMock).not.toHaveBeenCalled();
		expect(toastSuccess).not.toHaveBeenCalled();
	});
});

describe("edición de un elemento del menú", () => {
	const stored = menuItem({
		id: "roster",
		name: "Roster",
		parent_id: "raiz",
		order_index: 10,
		roles: ["gm"],
	});

	it("abre el formulario con los permisos ya marcados", () => {
		render(
			<SettingsMenuForm
				mode="edit"
				item={stored}
				items={items}
				roleOptions={roleOptions}
			/>,
		);

		expect(screen.getByDisplayValue("Roster")).toBeTruthy();
		expect(
			screen
				.getByRole("button", { name: "Guild Master" })
				.getAttribute("aria-pressed"),
		).toBe("true");
		expect(
			screen.getByRole("button", { name: "Oficial" }).getAttribute("aria-pressed"),
		).toBe("false");
	});

	it("guarda los cambios del elemento existente", async () => {
		render(
			<SettingsMenuForm
				mode="edit"
				item={stored}
				items={items}
				roleOptions={roleOptions}
			/>,
		);

		fireEvent.change(screen.getByDisplayValue("Roster"), {
			target: { value: "Roster S2" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Oficial" }));
		fireEvent.click(screen.getByRole("button", { name: /Guardar cambios/ }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe("/api/admin/navigation");
		expect(init.method).toBe("PATCH");
		const body = JSON.parse(init.body);
		expect(body).toMatchObject({
			id: "roster",
			name: "Roster S2",
			roles: ["gm", "officer"],
		});
		expect(toastSuccess).toHaveBeenCalledWith("Cambios guardados");
	});
});
