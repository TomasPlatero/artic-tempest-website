import type React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/shared/auth/auth-options";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

export default async function BisSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const { canView } = await getAppPermission(
    session.user?.roleLevel ?? "invitado",
    "bis-admin",
  );

  if (!canView) {
    return <Forbidden />;
  }

  return children;
}
