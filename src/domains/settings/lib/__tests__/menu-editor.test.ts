import { describe, it, expect } from "vitest";
import {
	buildInsertAfterPayload,
	buildMenuEditorHref,
	buildRoleOptions,
	computeSiblingOrderIndex,
	createNewItemDraft,
	normalizeItemRoles,
	normalizeNavigationItem,
	parseMenuNewItemSearch,
} from "../menu-editor";
import type { NavigationItemRecord } from "../menu-editor";
import type { NavigationItem } from "../../components/settings-menu.types";

function navigationItem(overrides: Partial<NavigationItem>): NavigationItem {
	return {
		id: overrides.id ?? "id",
		name: overrides.name ?? "Elemento",
		url: overrides.url ?? "/zona-raider/ruta",
		icon_name: overrides.icon_name ?? "IconLink",
		order_index: overrides.order_index ?? 0,
		parent_id: overrides.parent_id ?? null,
		is_active: true,
		...overrides,
	} as NavigationItem;
}

const existingMenu = [
	navigationItem({
		id: "raiz",
		name: "Zona Raider",
		url: null,
		order_index: 10,
	}),
	navigationItem({
		id: "roster",
		name: "Roster",
		parent_id: "raiz",
		order_index: 10,
	}),
	navigationItem({
		id: "stats",
		name: "Stats",
		parent_id: "raiz",
		order_index: 20,
	}),
];

// ═══════════════════════════════════════════
// buildRoleOptions
// ═══════════════════════════════════════════
describe("buildRoleOptions", () => {
	it("maps app_roles rows (level/label) coming from GET /api/guild/roles", () => {
		expect(
			buildRoleOptions([
				{ level: "gm", label: "Guild Master" },
				{ level: "officer", label: "Oficial" },
			]),
		).toEqual([
			{ value: "gm", label: "Guild Master" },
			{ value: "officer", label: "Oficial" },
		]);
	});

	it("accepts the legacy roleSlug/roleLabel aliases", () => {
		expect(
			buildRoleOptions([{ roleSlug: "raider", roleLabel: "Raider" }]),
		).toEqual([{ value: "raider", label: "Raider" }]);
	});

	it("falls back to the slug when the role has no label", () => {
		expect(buildRoleOptions([{ level: "trial" }])).toEqual([
			{ value: "trial", label: "trial" },
		]);
	});

	it("drops invitado, blank slugs and unusable rows", () => {
		expect(
			buildRoleOptions([
				{ level: "invitado", label: "Invitado" },
				{ level: "   " },
				{ label: "Sin slug" },
				{ level: "member", label: "Miembro" },
			]),
		).toEqual([{ value: "member", label: "Miembro" }]);
	});

	it("returns an empty list when the roles request has not resolved", () => {
		expect(buildRoleOptions(undefined)).toEqual([]);
	});
});

// ═══════════════════════════════════════════
// Roles of a stored item
// ═══════════════════════════════════════════
describe("normalizeItemRoles", () => {
	it("flattens the nested navigation_item_roles shape from the admin API", () => {
		const item = {
			...navigationItem({}),
			navigation_item_roles: [{ role_level: "officer" }, { role_level: "gm" }],
		} as unknown as NavigationItemRecord;

		expect(normalizeItemRoles(item)).toEqual(["gm", "officer"]);
	});

	it("deduplicates slugs and drops half-written values", () => {
		const item = {
			...navigationItem({}),
			roles: ["gm", "gm", ""],
			navigation_item_roles: [{ role_level: null }, { role_level: " gm " }],
		} as unknown as NavigationItemRecord;

		expect(normalizeItemRoles(item)).toEqual(["gm"]);
	});

	it("exposes the nested roles as a flat roles array", () => {
		const item = {
			...navigationItem({}),
			navigation_item_roles: [{ role_level: "member" }],
		} as unknown as NavigationItemRecord;

		expect(normalizeNavigationItem(item).roles).toEqual(["member"]);
	});
});

// ═══════════════════════════════════════════
// Editor URLs
// ═══════════════════════════════════════════
describe("buildMenuEditorHref", () => {
	it("points at the item page when an id is given", () => {
		expect(buildMenuEditorHref({ id: "roster" })).toBe(
			"/zona-raider/configuracion/menu/roster",
		);
	});

	it("builds the create URL with its context", () => {
		expect(buildMenuEditorHref({ kind: "link" })).toBe(
			"/zona-raider/configuracion/menu/nuevo?tipo=enlace",
		);
		expect(
			buildMenuEditorHref({
				kind: "link",
				parentId: "raiz",
				insertAfterId: "roster",
			}),
		).toBe(
			"/zona-raider/configuracion/menu/nuevo?tipo=enlace&padre=raiz&despues=roster",
		);
	});

	it("marks categories in the create URL", () => {
		expect(buildMenuEditorHref({ kind: "category", parentId: "raiz" })).toBe(
			"/zona-raider/configuracion/menu/nuevo?tipo=categoria&padre=raiz",
		);
	});
});

describe("parseMenuNewItemSearch", () => {
	it("reads the create context from the URL", () => {
		expect(
			parseMenuNewItemSearch({
				tipo: "categoria",
				padre: "raiz",
				despues: "roster",
			}),
		).toEqual({ kind: "category", parentId: "raiz", insertAfterId: "roster" });
	});

	it("defaults to a root link when there is no context", () => {
		expect(parseMenuNewItemSearch({})).toEqual({
			kind: "link",
			parentId: null,
			insertAfterId: null,
		});
	});
});

// ═══════════════════════════════════════════
// createNewItemDraft
// ═══════════════════════════════════════════
describe("createNewItemDraft", () => {
	it("suggests a name, a route and an icon for a link", () => {
		const draft = createNewItemDraft("link", existingMenu);

		expect(draft.name).toBe("Nuevo Enlace");
		expect(draft.url).toBe("/zona-raider/cambiame");
		expect(draft.icon_name).toBe("IconLink");
		expect(draft.is_active).toBe(true);
		expect(draft.roles).toEqual([]);
	});

	it("creates a category without url and with the folder icon", () => {
		const draft = createNewItemDraft("category", existingMenu);

		expect(draft.url).toBeNull();
		expect(draft.icon_name).toBe("IconFolder");
		expect(draft.name).toBe("Nueva Categoría");
	});

	it("places the draft at the end of the level it belongs to", () => {
		expect(createNewItemDraft("link", existingMenu).order_index).toBe(20);
		expect(
			createNewItemDraft("link", existingMenu, { parentId: "raiz" }).parent_id,
		).toBe("raiz");
	});
});

// ═══════════════════════════════════════════
// Ordering
// ═══════════════════════════════════════════
describe("computeSiblingOrderIndex", () => {
	it("starts at 10 when the level is empty", () => {
		expect(computeSiblingOrderIndex([], null)).toBe(10);
	});

	it("goes after the last sibling of the same parent", () => {
		expect(computeSiblingOrderIndex(existingMenu, null)).toBe(20);
		expect(computeSiblingOrderIndex(existingMenu, "raiz")).toBe(30);
	});
});

describe("buildInsertAfterPayload", () => {
	it("re-indexes the level with the new item right below the clicked row", () => {
		expect(
			buildInsertAfterPayload(existingMenu, "raiz", "roster", "nuevo"),
		).toEqual([
			{ id: "roster", order_index: 10, parent_id: "raiz" },
			{ id: "nuevo", order_index: 20, parent_id: "raiz" },
			{ id: "stats", order_index: 30, parent_id: "raiz" },
		]);
	});

	it("works on the root level too", () => {
		expect(buildInsertAfterPayload(existingMenu, null, "raiz", "nuevo")).toEqual([
			{ id: "raiz", order_index: 10, parent_id: null },
			{ id: "nuevo", order_index: 20, parent_id: null },
		]);
	});

	it("does nothing when the reference row is no longer in that level", () => {
		expect(
			buildInsertAfterPayload(existingMenu, "raiz", "desconocido", "nuevo"),
		).toEqual([]);
	});
});
