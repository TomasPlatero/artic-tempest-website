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

export function buildRoleOptions(rolesData: any[] | undefined) {
	if (!Array.isArray(rolesData)) return [];
	return rolesData.flatMap((r: any) =>
		r.role_level !== "invitado"
			? [{ value: r.role_level, label: r.display_name || r.role_level }]
			: [],
	);
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
		roles: item.roles || [],
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
