import { getServerSession } from "next-auth";
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options";
import { redirect } from "next/navigation";
import { SettingsDashboardClient } from "@/domains/settings/components/settings-dashboard";
import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

export default async function DashboardSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const roleLevel = session.user?.roleLevel?.toLowerCase() ?? "invitado";
  const { canEdit } = await getAppPermission(roleLevel, "settings");

  if (!canEdit) {
    return <Forbidden />;
  }

  const { data: blocks } = await supabaseAdmin
    .from("dashboard_blocks")
    .select("*")
    .order("order_index", { ascending: true });

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
      <SettingsDashboardClient initialBlocks={blocks || []} />
    </div>
  );
}
