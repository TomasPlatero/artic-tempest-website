// src/types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

// Si ya tienes RoleLevel en un archivo de tipos, impórtalo:
// import type { RoleLevel } from "@/types/auth";
// O bien decláralo aquí:
export type RoleLevel = "gm" | "officer" | "raider";

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
    userId?: string;
    discordId?: string;
    roleLevel?: RoleLevel;
    username?: string | null;
    avatarUrl?: string | null;
    checkedAt?: string;
  }
}

export {};
