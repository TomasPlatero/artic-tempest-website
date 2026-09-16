import { describe, it, expect } from "vitest";
import {
	buildInsertAfterPayload,
	buildRoleOptions,
	computeSiblingOrderIndex,
	createEditDraft,
	createNewItemDraft,
	normalizeItemRoles,
	normalizeNavigationItem,
} from "../settings-menu.utils";
import type { NavigationItemRecord } from "../settings-menu.utils";
import type { NavigationItem } from "../settings-menu.types";

// ═══════════════════════════════════════════
// buildRoleOptions
// ═══════════════════════════════════════════
describe("buildRoleOptions", () => {
	it("maps app_roles rows (level/label) coming from GET /api/guild/roles", () => {
		const options = buildRoleOptions([
			{ level: "gm", label: "Guild Master" },
			{ level: "officer", label: "Oficial" },
		]);

		expect(options).toEqual([
			{ value: "gm", label: "Guild Master" },
			{ value: "officer", label: "Oficial" },
		]);
	});

	it("accepts the legacy roleSlug/roleLabel aliases", () => {
		const options = buildRoleOptions([
			{ roleSlug: "raider", roleLabel: "Raider" },
		]);

		expect(options).toEqual([{ value: "raider", label: "Raider" }]);
	});

	it("falls back to the slug when the role has no label", () => {
		expect(buildRoleOptions([{ level: "trial" }])).toEqual([
			{ value: "trial", label: "trial" },
		]);
	});

	it("drops invitado, blank slugs and unusable rows", () => {
		const options = buildRoleOptions([
			{ level: "invitado", label: "Invitado" },
			{ level: "   ", label: "Sin slug" },
			{ label: "Sin slug" },
			{ level: "member", label: "Miembro" },
		]);

		expect(options).toEqual([{ value: "member", label: "Miembro" }]);
	});

	it("returns an empty list when the roles request has not resolved", () => {
		expect(buildRoleOptions(undefined)).toEqual([]);
	});
});

// ═══════════════════════════════════════════
// normalizeItemRoles
// ═══════════════════════════════════════════
describe("normalizeItemRoles", () => {
	it("flattens the nested navigation_item_roles shape from the admin API", () => {
		const item = {
			id: "1",
			name: "Roster",
			url: "/zona-raider/roster",
			icon_name: "IconUsers",
			order_index: 0,
			parent_id: null,
			is_active: true,
			navigation_item_roles: [
				{ role_level: "officer" },
				{ role_level: "gm" },
			],
		} as unknown as NavigationItemRecord;

		expect(normalizeItemRoles(item)).toEqual(["gm", "officer"]);
	});

	it("deduplicates slugs and drops half-written values", () => {
		const item = {
			id: "1",
			name: "Roster",
			url: "/zona-raider/roster",
			icon_name: "IconUsers",
			order_index: 0,
			parent_id: null,
			is_active: true,
			roles: ["gm", "gm", ""],
			navigation_item_roles: [{ role_level: null }, { role_level: " gm " }],
		} as unknown as NavigationItemRecord;

		expect(normalizeItemRoles(item)).toEqual(["gm"]);
	});

	it("returns an empty list when the item has no roles", () => {
		const item = {
			id: "1",
			name: "Roster",
			url: "/zona-raider/roster",
			icon_name: "IconUsers",
			order_index: 0,
			parent_id: null,
			is_active: true,
		} as unknown as NavigationItemRecord;

		expect(normalizeItemRoles(item)).toEqual([]);
	});
});

// ═══════════════════════════════════════════
// normalizeNavigationItem / createEditDraft
// ═══════════════════════════════════════════
describe("normalizeNavigationItem", () => {
	it("exposes the nested roles as a flat roles array", () => {
		const item = {
			id: "1",
			name: "Roster",
			url: "/zona-raider/roster",
			icon_name: "IconUsers",
			order_index: 0,
			parent_id: null,
			is_active: true,
			navigation_item_roles: [{ role_level: "member" }],
		} as unknown as NavigationItemRecord;

		expect(normalizeNavigationItem(item).roles).toEqual(["member"]);
	});
});

describe("createEditDraft", () => {
	it("pre-selects the stored roles so saving does not wipe them", () => {
		const item = {
			id: "1",
			name: "Roster",
			url: "/zona-raider/roster",
			icon_name: "IconUsers",
			order_index: 0,
			parent_id: null,
			is_active: true,
			navigation_item_roles: [{ role_level: "officer" }],
		} as unknown as NavigationItemRecord;

		expect(createEditDraft(item).roles).toEqual(["officer"]);
	});

	it("keeps the role list when the draft is built twice", () => {
		const item = {
			id: "1",
			name: "Roster",
			url: "/zona-raider/roster",
			icon_name: "IconUsers",
			order_index: 0,
			parent_id: null,
			is_active: true,
			roles: ["gm"],
		} as unknown as NavigationItem;

		expect(createEditDraft(createEditDraft(item)).roles).toEqual(["gm"]);
	});
});

// ═══════════════════════════════════════════
// computeSiblingOrderIndex
// ═══════════════════════════════════════════
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

describe("computeSiblingOrderIndex", () => {
	it("starts at 10 when the level is empty", () => {
		expect(computeSiblingOrderIndex([], null)).toBe(10);
	});

	it("goes after the last sibling of the same parent", () => {
		const items = [
			navigationItem({ id: "a", order_index: 10 }),
			navigationItem({ id: "b", order_index: 30 }),
			navigationItem({ id: "c", order_index: 99, parent_id: "a" }),
		];

		expect(computeSiblingOrderIndex(items, null)).toBe(40);
		expect(computeSiblingOrderIndex(items, "a")).toBe(109);
	});
});

// ═══════════════════════════════════════════
// createNewItemDraft
// ═══════════════════════════════════════════
const existingMenu = [
	navigationItem({ id: "raiz", name: "Zona Raider", url: null, order_index: 10 }),
	navigationItem({ id: "roster", name: "Roster", parent_id: "raiz", order_index: 10 }),
	navigationItem({ id: "stats", name: "Stats", parent_id: "raiz", order_index: 20 }),
];

describe("createNewItemDraft", () => {
	it("marks the item as a draft so nothing is created before saving", () => {
		const draft = createNewItemDraft("link", existingMenu);

		expect(draft.isDraft).toBe(true);
		expect(draft.roles).toEqual([]);
		expect(draft.url).toBe("/zona-raider/cambiame");
		expect(draft.is_active).toBe(true);
	});

	it("creates a category without url and with the folder icon", () => {
		const draft = createNewItemDraft("category", existingMenu);

		expect(draft.url).toBeNull();
		expect(draft.icon_name).toBe("IconFolder");
		expect(draft.name).toBe("Nueva Categoría");
	});

	it("places the draft at the end of the level it belongs to", () => {
		const draft = createNewItemDraft("link", existingMenu, { parentId: "raiz" });

		expect(draft.parent_id).toBe("raiz");
		expect(draft.order_index).toBe(30);
	});

	it("remembers the row it has to sit below", () => {
		const draft = createNewItemDraft("link", existingMenu, {
			parentId: "raiz",
			insertAfterId: "roster",
		});

		expect(draft.insertAfterId).toBe("roster");
		const plain = createNewItemDraft("link", existingMenu);
		expect(plain.insertAfterId).toBeNull();
	});
});

// ═══════════════════════════════════════════
// buildInsertAfterPayload
// ═══════════════════════════════════════════
describe("buildInsertAfterPayload", () => {
	it("re-indexes the level with the new item right below the clicked row", () => {
		const payload = buildInsertAfterPayload(
			existingMenu,
			"raiz",
			"roster",
			"nuevo",
		);

		expect(payload).toEqual([
			{ id: "roster", order_index: 10, parent_id: "raiz" },
			{ id: "nuevo", order_index: 20, parent_id: "raiz" },
			{ id: "stats", order_index: 30, parent_id: "raiz" },
		]);
	});

	it("works on the root level too", () => {
		const payload = buildInsertAfterPayload(existingMenu, null, "raiz", "nuevo");

		expect(payload).toEqual([
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
