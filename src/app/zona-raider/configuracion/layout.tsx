// src/app/zona-raider/configuracion/layout.tsx
import type React from "react";
import { redirect } from "next/navigation";
import { ensureAuthenticatedSession } from "@/shared/auth/permissions";

export const runtime = "nodejs";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await ensureAuthenticatedSession().catch(() => null);

  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col">
      {children}
    </div>
  );
}
