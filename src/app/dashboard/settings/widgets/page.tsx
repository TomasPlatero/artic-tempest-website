import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"
import { redirect } from "next/navigation"
import { SettingsDashboardClient } from "@/components/settings/settings-dashboard"

export default async function DashboardSettingsPage() {
    const session = await getServerSession(authOptions)
    if (!session) redirect("/")

    const roleLevel = session.user?.roleLevel?.toLowerCase() ?? "raider"
    if (roleLevel !== "gm" && roleLevel !== "officer") {
        redirect("/dashboard")
    }

    const { data: blocks } = await supabaseAdmin
        .from("dashboard_blocks")
        .select("*")
        .order("order_index", { ascending: true })

    return (
        <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
            <SettingsDashboardClient initialBlocks={blocks || []} />
        </div>
    )
}
