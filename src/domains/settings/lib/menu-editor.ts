import type { NavigationItem } from "@/domains/settings/components/settings-menu.types";

/** Shape returned by `GET /api/guild/roles` (`app_roles` + legacy aliases). */
export type RoleRecord = {
	level?: string | null;
	label?: string | null;
	roleSlug?: string | null;
	roleLabel?: string | null;
};

/** Shape returned by `GET /api/admin/navigation` (item + nested role rows). */
export type NavigationItemRecord = NavigationItem & {
	navigation_item_roles?: { role_level?: string | null }[] | null;
};

export type NewItemKind = "category" | "link";

export type RoleOption = { value: string; label: string };

const MENU_BASE_PATH = "/zona-raider/configuracion/menu";

/** Editor URL: an existing item, or the "new item" form with its context. */
export function buildMenuEditorHref(
	options: {
		id?: string | null;
		kind?: NewItemKind;
		parentId?: string | null;
		insertAfterId?: string | null;
	} = {},
): string {
	if (options.id) return `${MENU_BASE_PATH}/${options.id}`;
	const params = new URLSearchParams();
	params.set("tipo", options.kind === "category" ? "categoria" : "enlace");
	if (options.parentId) params.set("padre", options.parentId);
	if (options.insertAfterId) params.set("despues", options.insertAfterId);
	return `${MENU_BASE_PATH}/nuevo?${params.toString()}`;
}

/** Reads the editor URL into the values the form needs. */
export function parseMenuNewItemSearch(search: {
	tipo?: string;
	padre?: string;
	despues?: string;
}) {
	return {
		kind: (search.tipo === "categoria" ? "category" : "link") as NewItemKind,
		parentId: search.padre ?? null,
		insertAfterId: search.despues ?? null,
	};
}

function toRoleSlug(value: string | null | undefined): string | null {
	const slug = value?.trim();
	return slug ? slug : null;
}

function toRoleLabel(value: string | null | undefined, fallback: string): string {
	const label = value?.trim();
	return label ? label : fallback;
}

/**
 * `/api/guild/roles` serves `app_roles` rows, whose columns are `level` / `label`.
 * Both that shape and the legacy `roleSlug` / `roleLabel` aliases are accepted.
 */
export function buildRoleOptions(
	rolesData: RoleRecord[] | undefined,
): RoleOption[] {
	if (!Array.isArray(rolesData)) return [];
	return rolesData
		.flatMap((role) => {
			const value = toRoleSlug(role?.level ?? role?.roleSlug);
			if (!value) return [];
			return [
				{
					value,
					label: toRoleLabel(role?.label ?? role?.roleLabel, value),
				},
			];
		})
		.filter((option) => option.value !== "invitado");
}

/**
 * The admin API nests roles as `navigation_item_roles: [{ role_level }]`, while the
 * rest of the UI reads a flat `roles: string[]`. Half-written values are dropped so
 * they cannot hide an item from every role in the public tree.
 */
export function normalizeItemRoles(item: NavigationItemRecord): string[] {
	const nested = item?.navigation_item_roles ?? [];
	const flat = item?.roles ?? [];
	const slugs = [...flat, ...nested.map((row) => toRoleSlug(row?.role_level))];
	return Array.from(
		new Set(slugs.filter((slug): slug is string => Boolean(slug))),
	).sort((a, b) => a.localeCompare(b));
}

export function normalizeNavigationItem(
	item: NavigationItemRecord,
): NavigationItem {
	return { ...item, roles: normalizeItemRoles(item) };
}

/** Position for a brand-new item: right after the last sibling of `parentId`. */
export function computeSiblingOrderIndex(
	items: NavigationItem[],
	parentId: string | null,
): number {
	const siblings = items.filter(
		(item) => (item.parent_id ?? null) === (parentId ?? null),
	);
	const maxOrder = siblings.reduce(
		(max, item) => Math.max(max, item.order_index),
		0,
	);
	return maxOrder + 10;
}

/**
 * Values for a brand-new item. Nothing is written to the database until the form
 * is submitted, so leaving the page creates nothing.
 */
export function createNewItemDraft(
	kind: NewItemKind,
	items: NavigationItem[],
	options: { parentId?: string | null } = {},
): NavigationItem {
	const parentId = options.parentId ?? null;
	const isCategory = kind === "category";
	return {
		id: "",
		name: isCategory ? "Nueva Categoría" : "Nuevo Enlace",
		url: isCategory ? null : "/zona-raider/cambiame",
		icon_name: isCategory ? "IconFolder" : "IconLink",
		order_index: computeSiblingOrderIndex(items, parentId),
		parent_id: parentId,
		is_active: true,
		roles: [],
	};
}

/**
 * Re-index payload that leaves `newItemId` right below `afterId` inside its level;
 * steps of 10 keep `order_index` integral.
 */
export function buildInsertAfterPayload(
	items: NavigationItem[],
	parentId: string | null,
	afterId: string,
	newItemId: string,
) {
	const level = items
		.filter((item) => (item.parent_id ?? null) === (parentId ?? null))
		.sort((a, b) => a.order_index - b.order_index)
		.map((item) => item.id);
	const position = level.indexOf(afterId);
	if (position === -1) return [];
	level.splice(position + 1, 0, newItemId);
	return level.map((id, index) => ({
		id,
		order_index: (index + 1) * 10,
		parent_id: parentId,
	}));
}
