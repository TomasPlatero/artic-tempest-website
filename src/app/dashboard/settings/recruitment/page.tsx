import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"
import { redirect } from "next/navigation"
import { RecruitmentSettingsClient } from "@/components/settings/recruitment/recruitment-settings-client"
import { Suspense } from "react"
import { IconLoader2, IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

import { Forbidden } from "@/components/common/forbidden"
import { getAppPermission } from "@/infrastructure/auth/permissions"

export default async function RecruitmentSettingsPage() {
    const session = await getServerSession(authOptions)
    const roleLevel = session?.user?.roleLevel ?? "member"
    const { canView } = await getAppPermission(roleLevel, "settings-recruitment")

    if (!canView) {
        return (
            <div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8">
                <Forbidden />
            </div>
        )
    }


    // Fetch data for the client component
    const { data: spots } = await supabaseAdmin.from("recruitment_spots").select("*")
    const { data: questions } = await supabaseAdmin.from("recruitment_questions").select("*").order("order_index", { ascending: true })
    const { data: constants } = await supabaseAdmin.from("game_constants").select("*").in("category", ["wow_class", "spec_role"])
    const { data: applications } = await supabaseAdmin
        .from("recruitment_applications")
        .select("*")
        .order("created_at", { ascending: false })

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings">
                    <Button variant="outline" size="icon" className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 transition-all shadow-xl">
                        <IconArrowLeft className="size-6" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black font-heading italic tracking-tight uppercase flex items-center gap-3">
                        AJUSTES DE RECLUTAMIENTO
                    </h1>
                    <p className="text-sm font-medium text-white/40 mt-2 uppercase tracking-widest leading-tight">
                        Gestiona las vacantes de la hermandad, las preguntas y revisa las nuevas solicitudes.
                    </p>
                </div>
            </div>

            <Suspense fallback={
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                    <IconLoader2 className="size-8 animate-spin" />
                    <p className="text-sm font-medium">Cargando gestión de reclutamiento...</p>
                </div>
            }>
                <RecruitmentSettingsClient
                    initialSpots={spots || []}
                    initialQuestions={questions || []}
                    constants={constants || []}
                    applications={applications || []}
                />
            </Suspense>
        </div>
    )
}
