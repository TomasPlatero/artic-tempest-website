import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { getAppPermission } from "@/shared/auth/permissions";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { Forbidden } from "@/shared/components/forbidden";
import { ApiTokensSettings } from "@/domains/settings/components/settings-api-tokens";

export default async function ApiTokenPage() {
  const session = await getCachedServerSession();

  if (!session) {
    redirect("/login");
  }

  const authz = await getAuthzSnapshot(session);
  const { canManage } = await getAppPermission(
    authz.roleSlug ?? session?.user?.roleLevel ?? "invitado",
    "settings-api",
  );

  if (!canManage) {
    return <Forbidden />;
  }

  return <ApiTokensSettings />;
}
