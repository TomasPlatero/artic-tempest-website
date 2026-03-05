import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"
import { redirect } from "next/navigation"
import { RecruitmentSettingsClient } from "@/components/settings/recruitment/recruitment-settings-client"
import { Suspense } from "react"
import { IconLoader2 } from "@tabler/icons-react"

export default async function RecruitmentSettingsPage() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        redirect("/dashboard")
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
            <div>
                <h1 className="text-2xl font-bold font-black tracking-tight uppercase italic">Ajustes de Reclutamiento</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Gestiona las vacantes de la hermandad, las preguntas y revisa las nuevas solicitudes.
                </p>
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
