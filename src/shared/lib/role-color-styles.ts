import type { CSSProperties } from "react";

type RoleColorSource = {
	meRoleColor?: string | null;
	sessionRoleColor?: string | null;
};

/**
 * /api/me is the source of truth for visible role color styling because it is
 * derived from WoWAudit role data. sessionRoleColor is intentionally ignored.
 */
export function resolveRoleColorFromMe({
	meRoleColor,
}: RoleColorSource): string | null {
	return meRoleColor ?? null;
}

export function getRoleRingStyle(
	roleColor?: string | null,
): CSSProperties | undefined {
	if (!roleColor) return undefined;

	return {
		boxShadow: `0 0 0 2px ${roleColor}, 0 0 10px ${roleColor}66`,
	};
}

export function getRoleBadgeStyle(
	roleColor?: string | null,
): CSSProperties | undefined {
	if (!roleColor) return undefined;

	return {
		color: roleColor,
		borderColor: `${roleColor}33`,
		backgroundColor: `${roleColor}1A`,
	};
}

export function getRoleAvatarBorderColor(
	roleColor?: string | null,
): string | undefined {
	return roleColor ?? undefined;
}
