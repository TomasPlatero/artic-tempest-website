import { describe, it, expect } from "vitest";
import {
	buildNavigationTree,
	buildParentBreadcrumb,
	filterTreeByQuery,
} from "../settings-menu.utils";
import type { NavigationItem } from "../settings-menu.types";

function item(overrides: Partial<NavigationItem>): NavigationItem {
	return {
		id: overrides.id ?? "id",
		name: overrides.name ?? "Elemento",
		url: overrides.url ?? "/zona-raider/ruta",
		icon_name: "IconLink",
		order_index: overrides.order_index ?? 0,
		parent_id: overrides.parent_id ?? null,
		is_active: true,
		...overrides,
	};
}

const menu: NavigationItem[] = [
	item({ id: "raiz", name: "Zona Raider", url: null, order_index: 20 }),
	item({ id: "inicio", name: "Inicio", url: "/", order_index: 10 }),
	item({
		id: "roster",
		name: "Roster",
		url: "/zona-raider/roster",
		parent_id: "raiz",
		order_index: 20,
	}),
	item({
		id: "stats",
		name: "Stats",
		url: "/zona-raider/stats",
		parent_id: "raiz",
		order_index: 10,
	}),
];

describe("buildNavigationTree", () => {
	it("nests children under their parent and keeps order_index order", () => {
		const tree = buildNavigationTree(menu);

		expect(tree.map((node) => node.id)).toEqual(["inicio", "raiz"]);
		const raiz = tree.find((node) => node.id === "raiz");
		expect(raiz?.children.map((child: NavigationItem) => child.id)).toEqual([
			"stats",
			"roster",
		]);
	});

	it("treats items with a missing parent as roots", () => {
		const tree = buildNavigationTree([
			item({ id: "huerfano", parent_id: "inexistente" }),
		]);

		expect(tree.map((node) => node.id)).toEqual(["huerfano"]);
	});
});

describe("filterTreeByQuery", () => {
	it("returns everything when the query is empty", () => {
		const tree = buildNavigationTree(menu);

		expect(filterTreeByQuery(tree, "   ")).toHaveLength(2);
	});

	it("keeps the parents of a matching child", () => {
		const tree = buildNavigationTree(menu);
		const filtered = filterTreeByQuery(tree, "stats");

		expect(filtered.map((node) => node.id)).toEqual(["raiz"]);
		expect(filtered[0].children.map((child: NavigationItem) => child.id)).toEqual(
			["stats"],
		);
	});

	it("matches by route too", () => {
		const tree = buildNavigationTree(menu);
		const filtered = filterTreeByQuery(tree, "/zona-raider/roster");

		expect(filtered[0].children.map((child: NavigationItem) => child.id)).toEqual(
			["roster"],
		);
	});
});

describe("buildParentBreadcrumb", () => {
	it("returns the parent name for a first level item", () => {
		expect(buildParentBreadcrumb(menu, "raiz")).toBe("Zona Raider");
	});

	it("returns the full path for a deeper item", () => {
		const deep = [
			...menu,
			item({ id: "s2", name: "Season 2", url: null, parent_id: "raiz" }),
		];

		expect(buildParentBreadcrumb(deep, "s2")).toBe("Zona Raider → Season 2");
	});

	it("returns null without a parent", () => {
		expect(buildParentBreadcrumb(menu, null)).toBeNull();
		expect(buildParentBreadcrumb(menu, "desconocido")).toBeNull();
	});
});
