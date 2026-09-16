import { describe, it, expect } from "vitest";
import {
	buildRoleOptions,
	normalizeItemRoles,
	normalizeNavigationItem,
	createEditDraft,
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
