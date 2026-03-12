import { Forbidden } from "@/shared/components/forbidden";
import { getAppPermission } from "@/shared/auth/permissions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/auth/auth-options";
import { SettingsCategories } from "@/domains/settings/components/settings-categories";
import { createAdminClient } from "@/shared/supabase/server";

export default async function CategoriesSettingsPage() {
  const session = await getServerSession(authOptions);
  const roleLevel = session?.user?.roleLevel ?? "invitado";
  const { canEdit } = await getAppPermission(roleLevel, "settings");

  if (!canEdit) {
    return <Forbidden />;
  }

  const supabase = await createAdminClient();
  const { data: categories } = await supabase
    .from("news_categories")
    .select("*")
    .order("name");

  return <SettingsCategories initialCategories={categories || []} />;
}
