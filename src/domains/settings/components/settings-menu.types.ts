"use client";
export type NavigationItem = {
	id: string;
	name: string;
	url: string | null;
	icon_name: string;
	order_index: number;
	parent_id: string | null;
	is_active: boolean;
	app_id?: string | null;
	css_class?: string | null;
	element_id?: string | null;
	visibility?: string | null;
	description?: string | null;
	roles?: string[];
};
export type MenuUiState = {
	mounted: boolean;
	searchQuery: string;
};
export type MenuUiAction =
	| { type: "mounted" }
	| { type: "setSearchQuery"; value: string };
export const initialMenuUiState: MenuUiState = {
	mounted: false,
	searchQuery: "",
};
export function menuUiReducer(
	state: MenuUiState,
	action: MenuUiAction,
): MenuUiState {
	switch (action.type) {
		case "mounted":
			return { ...state, mounted: true };
		case "setSearchQuery":
			return { ...state, searchQuery: action.value };
		default:
			return state;
	}
}
