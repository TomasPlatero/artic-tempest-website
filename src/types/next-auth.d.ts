// src/types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

export type RoleLevel = "gm" | "officer" | "core" | "raider" | "trial";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      discordId: string;
      username: string | null;
      avatarUrl: string | null;
      roleLevel: RoleLevel;
    };
    checkedAt: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    discordId: string;
    username: string | null;
    avatarUrl: string | null;
    roleLevel: RoleLevel;
    checkedAt: string;
  }
}
