export type AppPermission = {
	role_level: string;
	role_slug?: string;
	role_label?: string;
	app_id: string;
	can_view: boolean;
	can_edit: boolean;
	can_manage: boolean;
};

export type AppPageInfo = {
	id: string;
	name: string;
	description: string | null;
	path: string;
	icon_name: string | null;
	is_admin: boolean;
	is_active: boolean;
	group_id: string | null;
	priority: number;
};

export type RoleEditorMode = "create" | "edit";
