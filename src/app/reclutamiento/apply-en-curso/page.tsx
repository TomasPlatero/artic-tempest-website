import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { redirect } from "next/navigation"
import { LandingNavigation } from "@/components/landing/navigation"
import { ApplicationStatusClient } from "@/components/recruitment/application-status-client"

export default async function ApplicationStatusPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/")
    }

    // 1. Obtener la solicitud del usuario
    const { data: application, error } = await sb
        .from("recruitment_applications")
        .select(`
            *,
            answers:application_answers(
                id,
                question_id,
                answer_text,
                question:recruitment_questions(
                    label,
                    type
                )
            )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) {
        console.error("Error fetching application:", error)
    }

    if (!application) {
        // Si no tiene aplicación, que vaya a aplicar
        redirect("/reclutamiento/apply")
    }

    return (
        <main className="min-h-screen bg-black">
            <LandingNavigation />
            <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight">Tu Aplicación</h1>
                    <p className="text-white/50 mt-2">Gestiona tu solicitud de ingreso a Artic Tempest.</p>
                </div>

                <ApplicationStatusClient application={application} />
            </div>
        </main>
    )
}
