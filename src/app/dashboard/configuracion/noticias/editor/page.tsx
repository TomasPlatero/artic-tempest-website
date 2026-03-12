import { getServerSession } from "next-auth";
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options";
import { getAppPermission } from "@/shared/auth/permissions";
import { SettingsNewsClient } from "@/domains/settings/components/settings-news";
import { Forbidden } from "@/shared/components/forbidden";

export default async function SettingsNewsPage() {
  const session = await getServerSession(authOptions);
  const roleLevel = session?.user?.roleLevel ?? "member";
  const { canEdit } = await getAppPermission(roleLevel, "settings-news");

  if (!canEdit) {
    return <Forbidden />;
  }

  const { data: news, error } = await supabaseAdmin
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: categories } = await supabaseAdmin
    .from("news_categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("[NEWS_SETTINGS_FETCH]", error);
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
      <SettingsNewsClient
        initialNews={news || []}
        categories={categories || []}
        currentUser={session?.user?.username || ""}
      />
    </div>
  );
}
