import { SettingsNotificationsClient } from "@/domains/settings/components/settings-notifications";
import React from "react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/shared/auth/auth-options";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

export const metadata = {
  title: "Notificaciones de Sistema | GuildBoard Settings",
};

export default async function SettingsNotificationsPage() {
  const session = await getServerSession(authOptions);
  const roleLevel = session?.user?.roleLevel ?? "invitado";
  const { canEdit } = await getAppPermission(
    roleLevel,
    "settings-notifications",
  );

  if (!canEdit) {
    return <Forbidden />;
  }

  return <SettingsNotificationsClient />;
}
