"use client";

import type { NavigationItem } from "./settings-menu.types";

export function collectCategoryIds(items: NavigationItem[]): Set<string> {
	const ids = new Set<string>();
	for (const item of items) {
		if (!item.url) ids.add(item.id);
	}
	return ids;
}

export function buildNavigationTree(items: NavigationItem[]): any[] {
	const map = new Map<
		string,
		NavigationItem & { children: NavigationItem[] }
	>();
	const roots: (NavigationItem & { children: NavigationItem[] })[] = [];

	for (const item of items) {
		map.set(item.id, { ...item, children: [] });
	}

	for (const item of map.values()) {
		if (item.parent_id && map.has(item.parent_id)) {
			map.get(item.parent_id)!.children.push(item);
		} else {
			roots.push(item);
		}
	}

	const sortFn = (a: NavigationItem, b: NavigationItem) =>
		a.order_index - b.order_index;
	roots.sort(sortFn);
	for (const item of map.values()) {
		item.children.sort(sortFn);
	}

	return roots;
}

export function filterTreeByQuery(nodes: any[], rawQuery: string): any[] {
	const q = rawQuery.trim().toLowerCase();
	if (!q) return nodes;

	return nodes.flatMap((node) => {
		const match =
			node.name.toLowerCase().includes(q) ||
			(node.url || "").toLowerCase().includes(q);
		const children = filterTreeByQuery(node.children || [], rawQuery);

		if (match || children.length > 0) {
			return [{ ...node, children }];
		}
		return [];
	}) as NavigationItem[];
}

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
export function buildRoleOptions(rolesData: RoleRecord[] | undefined) {
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

export function isDescendant(
	items: NavigationItem[],
	parentId: string | null,
	targetId: string,
): boolean {
	if (!parentId) return false;
	if (parentId === targetId) return true;
	const children = items.filter((i) => i.parent_id === parentId);
	return children.some((child) => isDescendant(items, child.id, targetId));
}

export function createEditDraft(item: NavigationItem): NavigationItem {
	return {
		...item,
		icon_name: item.icon_name || "IconFolder",
		roles: normalizeItemRoles(item),
	};
}

export function flattenTreeIds(nodes: any[]): string[] {
	const ids: string[] = [];
	for (const node of nodes) {
		ids.push(node.id);
		if (node.children?.length) {
			ids.push(...flattenTreeIds(node.children));
		}
	}
	return ids;
}

export function buildParentBreadcrumb(
	items: NavigationItem[],
	parentId?: string | null,
): string | null {
	if (!parentId) return null;
	const parent = items.find((i) => i.id === parentId);
	if (!parent) return null;
	const grandparent = parent.parent_id
		? items.find((i) => i.id === parent.parent_id)
		: null;
	return grandparent ? `${grandparent.name} → ${parent.name}` : parent.name;
}
