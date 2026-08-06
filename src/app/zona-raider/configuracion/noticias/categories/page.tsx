import { Forbidden } from "@/shared/components/forbidden";
import { getAppPermission } from "@/shared/auth/permissions";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { SettingsCategories } from "@/domains/settings/components/settings-categories";
import { createAdminClient } from "@/shared/supabase/server";
import { Button } from "@/shared/ui/button";
import { IconArrowLeft } from "@/shared/ui/tabler-icons";
import Link from "next/link";

export default async function CategoriesSettingsPage() {
  const session = await getCachedServerSession();
  const roleLevel = session?.user?.roleLevel ?? "invitado";
  const { canEdit } = await getAppPermission(roleLevel, "settings-news");

  if (!canEdit) {
    return <Forbidden />;
  }

  const supabase = await createAdminClient();
  const { data: categories } = await supabase
    .from("news_categories")
    .select("*")
    .order("name");

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8">
      <div className="flex items-center gap-4">
        <Link href="/zona-raider/configuracion/noticias">
          <Button
            variant="outline"
            size="icon"
            className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10  shadow-xl"
          >
            <IconArrowLeft className="size-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold font-heading italic tracking-tight flex items-center gap-3">
            Categorías de Noticias
          </h1>
          <p className="text-sm font-medium text-white/40 mt-2 tracking-widest leading-relaxed">
            Gestiona las categorías disponibles para clasificar tus noticias.
          </p>
        </div>
      </div>

      <SettingsCategories initialCategories={categories || []} />
    </div>
  );
}
