import { Forbidden } from "@/components/common/forbidden"
import { getAppPermission } from "@/infrastructure/auth/permissions"
import { getServerSession } from "next-auth"
import { authOptions } from "@/infrastructure/auth/auth-options"
import { SettingsCategories } from "@/components/settings/settings-categories"
import { createAdminClient } from "@/infrastructure/supabase/server"

export default async function CategoriesSettingsPage() {
    const session = await getServerSession(authOptions)
    const roleLevel = session?.user?.roleLevel ?? "invitado"
    const { canView } = await getAppPermission(roleLevel, "settings")

    if (!canView) {
        return <Forbidden />
    }

    const supabase = await createAdminClient()
    const { data: categories } = await supabase
        .from('news_categories')
        .select('*')
        .order('name')

    return <SettingsCategories initialCategories={categories || []} />
}
