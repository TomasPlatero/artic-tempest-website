import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { notFound, redirect } from "next/navigation"
import { RecruitmentDetailClient } from "@/components/recruitment/recruitment-detail-client"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"
import { fetchCharacterRIO } from "@/infrastructure/raiderio/raiderio-client"

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        redirect("/dashboard")
    }

    // Fetch the application
    const { data: application } = await sb
        .from("recruitment_applications")
        .select("*")
        .eq("id", id)
        .single()

    if (!application) notFound()

    // Fetch answers
    const { data: answers } = await sb
        .from("application_answers")
        .select("*, recruitment_questions(*)")
        .eq("application_id", id)

    // Fetch class constants
    const { data: classConstants } = await sb
        .from("game_constants")
        .select("*")
        .eq("category", "wow_class")

    // Fetch Raider.io data on the server to avoid CORS
    const charName = application.character_name.trim()
    const charRealm = application.character_realm.trim()

    console.log(`[Server] Fetching RIO for ${charName} - ${charRealm}`)
    const rioData = await fetchCharacterRIO(charName, charRealm)
    console.log(`[Server] RIO Data ${rioData ? 'FOUND' : 'NOT FOUND (404/Error)'}`)

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href="/dashboard/settings/recruitment?tab=inbox">
                        <IconArrowLeft className="size-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Detalle de Solicitud</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Revisa la información del aplicante y gestiona su estado.
                    </p>
                </div>
            </div>

            <RecruitmentDetailClient
                application={application}
                answers={answers || []}
                classConstants={classConstants || []}
                initialRioData={rioData}
            />
        </div>
    )
}
