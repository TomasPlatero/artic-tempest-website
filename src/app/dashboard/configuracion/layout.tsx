// src/app/dashboard/configuracion/layout.tsx
import type React from "react";
import { redirect } from "next/navigation";
import { ensureAuthenticatedSession } from "@/shared/auth/permissions";

import { AppSidebar } from "@/shared/layout/app-sidebar";
import { SiteHeader } from "@/shared/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/shared/components/sidebar";
import { SessionProvider } from "@/shared/layout/session-provider";

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
