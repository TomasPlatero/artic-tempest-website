import "next-auth";
import "next-auth/jwt";
import type { RoleLevel } from "@/shared/types/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      discordId: string;
      username: string | null;
      avatarUrl: string | null;
      roleLevel: RoleLevel;
      email?: string | null;
    };
    checkedAt: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    discordId?: string;
    roleLevel?: RoleLevel;
    username?: string | null;
    avatarUrl?: string | null;
    checkedAt?: string;
  }
}

export {};