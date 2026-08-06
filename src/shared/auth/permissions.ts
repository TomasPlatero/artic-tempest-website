import { auth } from "@/auth";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import type { RoleLevel, AuthzSnapshot } from "@/shared/types/auth";
import { isRoleAtLeast, isSuperAdmin, getRoleFlags } from "@/shared/auth/roles";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { forbidden, unauthorized } from "@/shared/api/errors";

/** App ID conocido. Se resuelve contra app_pages en DB. */
export type AppId = string;
export type AppPermission = {
	canView: boolean;
	canEdit: boolean;
	canManage: boolean;
};

type PermissionRow = {
	can_view?: boolean | null;
	can_edit?: boolean | null;
	can_manage?: boolean | null;
};

export async function isAtLeast(current: string, required: RoleLevel) {
	return isRoleAtLeast(current, required);
}

function normalizePermission(permission?: PermissionRow | null): AppPermission {
	const canManage = Boolean(permission?.can_manage);
	const canEdit = canManage || Boolean(permission?.can_edit);
	const canView = canEdit || Boolean(permission?.can_view);

	return {
		canView,
		canEdit,
		canManage,
	};
}

function normalizeRoleLevel(roleLevel: string) {
	return roleLevel.trim().toLowerCase();
}

export async function getAppPermission(
	roleLevel: string,
	appId: AppId,
): Promise<AppPermission> {
	if (!roleLevel?.trim()) {
		return { canView: false, canEdit: false, canManage: false };
	}

	const normalizedRole = normalizeRoleLevel(roleLevel);

	// Super admin bypasses all permission checks
	if (await isSuperAdmin(normalizedRole)) {
		return { canView: true, canEdit: true, canManage: true };
	}

	const roleFlags = await getRoleFlags(normalizedRole as RoleLevel);
	const isAdmin = roleFlags.isAdmin;

	// Apps de administración: se resuelven desde app_pages en DB
	if (!isAdmin) {
		const { data: page } = await supabaseAdmin
			.from("app_pages")
			.select("is_admin")
			.eq("id", appId)
			.maybeSingle();

		if (page?.is_admin) {
			return { canView: false, canEdit: false, canManage: false };
		}
	}

	try {
		const { data } = await supabaseAdmin
			.from("app_permissions")
			.select("can_view, can_edit, can_manage")
			.eq("role_level", normalizedRole)
			.eq("app_id", appId)
			.maybeSingle();

		if (data) {
			const perm = normalizePermission(data);
			// Administrador global: puede editar en cualquier app
			if (isAdmin) {
				perm.canEdit = true;
			}
			return perm;
		}

		// Sin registro en app_permissions: si es admin, al menos puede editar
		if (isAdmin) {
			return { canView: true, canEdit: true, canManage: false };
		}
	} catch (e) {
		console.error(`Error checking permission for ${appId}:`, e);
	}

	return { canView: false, canEdit: false, canManage: false };
}

async function getSnapshotPermission(
	snapshot: AuthzSnapshot,
	appId: AppId,
): Promise<AppPermission> {
	if (snapshot.scope === "internal_admin") {
		return { canView: true, canEdit: true, canManage: true };
	}

	const roleLevel = snapshot.roleSlug ?? snapshot.sources.roleLevel ?? "";
	return getAppPermission(roleLevel, appId);
}

export async function ensureAuthenticatedSession() {
	const session = await auth();
	if (!session) throw unauthorized("No session", "NO_SESSION");
	if (session.user?.isBanned) {
		throw forbidden("Account banned", "ACCOUNT_BANNED");
	}

	return session;
}

export async function ensureAdmin() {
	const session = await auth();
	if (!session) throw unauthorized("No session", "NO_SESSION");

	const snapshot = await getAuthzSnapshot(session);
	if (snapshot.scope === "internal_admin") {
		return session;
	}

	if (
		!(await isAtLeast(snapshot.roleSlug ?? session.user.roleLevel, "officer"))
	) {
		throw forbidden("Administrative access required", "ADMIN_REQUIRED");
	}

	return session;
}

export async function ensureAppPermission(
	appId: AppId,
	action: "view" | "edit" | "manage" = "edit",
) {
	const session = await ensureAuthenticatedSession();

	const snapshot = await getAuthzSnapshot(session);
	const permissions = await getSnapshotPermission(snapshot, appId);

	let hasPermission = false;
	if (action === "view") hasPermission = permissions.canView;
	else if (action === "edit") hasPermission = permissions.canEdit;
	else if (action === "manage") hasPermission = permissions.canManage;

	if (!hasPermission) {
		const roleLevel = snapshot.roleSlug ?? session.user.roleLevel;
		console.error(
			`[AUTH] Permission denied for role: "${roleLevel}", appId: "${appId}", action: "${action}"`,
		);
		console.error(`[AUTH] Permissions object:`, permissions);
		throw forbidden(
			`Role ${roleLevel} cannot ${action} ${appId}`,
			"INSUFFICIENT_APP_PERMISSION",
		);
	}

	return session;
}
