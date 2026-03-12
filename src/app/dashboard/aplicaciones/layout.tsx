import type React from "react";
import { redirect } from "next/navigation";

import { ensureAuthenticatedSession } from "@/shared/auth/permissions";
import { AppSidebar } from "@/shared/layout/app-sidebar";
import { SiteHeader } from "@/shared/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/shared/components/sidebar";
import { SessionProvider } from "@/shared/layout/session-provider";

export const runtime = "nodejs";

export default async function ApplicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await ensureAuthenticatedSession().catch(() => null);

  if (!session) {
    redirect("/");
  }

  const style = {
    "--sidebar-width": "calc(var(--spacing) * 64)",
    "--header-height": "calc(var(--spacing) * 12)",
  } as React.CSSProperties;

  return (
    <SessionProvider session={session}>
      <SidebarProvider style={style}>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
