import type { RoleFlags, RoleLevel } from "@/shared/types/auth";

export type AuthzScope =
	| "public"
	| "authenticated"
	| "zona_raider"
	| "internal_admin";

const AUTHZ_SCOPE_ORDER: AuthzScope[] = [
	"public",
	"authenticated",
	"zona_raider",
	"internal_admin",
];

export function hasAuthzScope(
	current: AuthzScope,
	required: AuthzScope,
): boolean {
	return (
		AUTHZ_SCOPE_ORDER.indexOf(current) >= AUTHZ_SCOPE_ORDER.indexOf(required)
	);
}

export function resolveAuthzScopeFromFlags(
	roleSlug: RoleLevel | null | undefined,
	roleFlags: Pick<RoleFlags, "canAccessZonaRaider" | "isSuperAdmin">,
	banned: boolean,
): AuthzScope {
	if (banned) return "authenticated";
	if (roleFlags.isSuperAdmin) {
		return "internal_admin";
	}
	if (roleFlags.canAccessZonaRaider) return "zona_raider";
	return "authenticated";
}
