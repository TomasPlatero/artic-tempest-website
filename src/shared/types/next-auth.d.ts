import "next-auth";
import "next-auth/jwt";
import type { AuthzScope, RoleFlags, RoleLevel } from "@/shared/types/auth";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			discordId: string;
			username: string | null;
			avatarUrl: string | null;
			roleLevel: RoleLevel;
			roleSlug?: RoleLevel;
			roleLabel?: string | null;
			roleColor?: string | null;
			authzScope?: AuthzScope;
			roleFlags: RoleFlags;
			email?: string | null;
			isBanned: boolean;
			banReason: string | null;
			banExpiresAt: string | null;
		};
		checkedAt: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		userId?: string;
		discordId?: string;
		roleLevel?: RoleLevel;
		roleSlug?: RoleLevel;
		roleLabel?: string | null;
		roleColor?: string | null;
		authzScope?: AuthzScope;
		username?: string | null;
		avatarUrl?: string | null;
		checkedAt?: string;
		isBanned?: boolean;
		banReason?: string | null;
		banExpiresAt?: string | null;
		roleFlags?: RoleFlags;
	}
}

export {};
