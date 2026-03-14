import type React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/auth/auth-options";
import { getAppPermission } from "@/shared/auth/permissions";


interface BisLayoutProps {
  children: React.ReactNode;
}

export default async function BisLayout({ children }: BisLayoutProps) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/");
  }

  const roleLevel = session.user?.roleLevel ?? "member";
  const { canView: canViewBis } = await getAppPermission(roleLevel, "bis");
  const { canView: canViewBisAdmin } = await getAppPermission(
    roleLevel,
    "bis-admin",
  );

  if (!canViewBis && !canViewBisAdmin) {
    redirect("/dashboard");
  }

  return (
    <>
      {children}
    </>
  );
}
