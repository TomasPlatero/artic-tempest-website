import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/auth/auth-options";
import { StreamersSettings } from "@/domains/settings/components/settings-streamers";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

export const metadata = {
  title: "Ajustes de Streamers",
};

export default async function StreamersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { canEdit } = await getAppPermission(
    session.user.roleLevel ?? "invitado",
    "settings",
  );

  if (!canEdit) {
    return <Forbidden />;
  }

  return <StreamersSettings />;
}
