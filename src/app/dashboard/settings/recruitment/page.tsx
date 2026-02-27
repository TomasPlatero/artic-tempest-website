import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { redirect } from "next/navigation"
import { RecruitmentSettingsClient } from "@/components/settings/recruitment/recruitment-settings-client"

export default async function RecruitmentSettingsPage() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        redirect("/dashboard")
    }

    // Fetch data for the client component
    const { data: spots } = await sb.from("recruitment_spots").select("*")
    const { data: questions } = await sb.from("recruitment_questions").select("*").order("order_index", { ascending: true })
    const { data: constants } = await sb.from("game_constants").select("*").in("category", ["wow_class", "spec_role"])

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8">
            <div>
                <h1 className="text-2xl font-bold">Ajustes de Reclutamiento</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Gestiona las vacantes de la hermandad y las preguntas del formulario público.
                </p>
            </div>

            <RecruitmentSettingsClient
                initialSpots={spots || []}
                initialQuestions={questions || []}
                constants={constants || []}
            />
        </div>
    )
}
