import type { Metadata } from "next"
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { redirect } from "next/navigation"
import { LandingNavigation } from "@/domains/landing/components/navigation"
import { ApplicationStatusClient } from "@/domains/recruitment/components/application-status-client"

export const metadata: Metadata = {
    title: "Estado de la solicitud | Artic Tempest",
    description: "Consulta el estado de tu proceso de reclutamiento.",
}

export default async function ApplicationStatusPage() {
    const session = await auth()

    if (!session) {
        redirect("/")
    }

    // 1. Obtener la solicitud del usuario
    const { data: application, error } = await supabaseAdmin
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

    const { data: classConstants } = await supabaseAdmin
        .from("game_constants")
        .select("key, value, metadata")
        .eq("category", "wow_class")

    return (
        <div className="min-h-dvh bg-zinc-950 animate-fade-in animate-duration-slow motion-reduce:animate-none">
            <LandingNavigation />
            <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
                <div className="mb-10 text-center md:text-left">
                    <h1 className="text-3xl font-semibold text-white uppercase tracking-tight">Tu Aplicación</h1>
                    <p className="text-white/50 mt-2">Gestiona tu solicitud de ingreso a Artic Tempest.</p>
                </div>

                <ApplicationStatusClient
                    application={application}
                    classConstants={classConstants || []}
                />
            </div>
        </div>
    )
}
