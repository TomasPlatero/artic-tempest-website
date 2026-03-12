import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/shared/auth/auth-options"
import { notFound, redirect } from "next/navigation"
import { LandingNavigation } from "@/domains/landing/components/navigation"
import { ApplicationChat } from "@/domains/recruitment/components/application-chat"
import { Button } from "@/shared/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"

export default async function ApplicantChatPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect("/")
    }

    // Get the latest application
    const { data: application } = await supabaseAdmin
        .from("recruitment_applications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!application) {
        redirect("/reclutamiento/apply")
    }

    // Only allow chat if status is interview/charla pendiente
    if (application.status !== 'interview') {
        redirect("/reclutamiento/apply-en-curso")
    }

    return (
        <main className="min-h-screen bg-black flex flex-col">
            <LandingNavigation />
            <div className="flex-1 flex flex-col pt-24 pb-6 px-4 md:px-8 lg:px-12 w-full h-[calc(100vh-1px)]">
                <div className="flex items-center gap-4 mb-6 shrink-0">
                    <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-white/5 text-white">
                        <Link href="/reclutamiento/apply-en-curso">
                            <IconArrowLeft className="size-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-tight">Tu Chat con Oficiales</h1>
                        <p className="text-xs text-white/50 font-medium tracking-wide">
                            Habla directamente con los encargados de reclutamiento de la hermandad.
                        </p>
                    </div>
                </div>

                <div className="flex-1 min-h-0">
                    <ApplicationChat
                        applicationId={application.id}
                        otherPartyName="Artic Tempest Staff"
                    />
                </div>
            </div>
        </main>
    )
}
