import { getServerSession } from "next-auth"
import { authOptions, supabaseAdmin } from "@/infrastructure/auth/auth-options"
import { notFound, redirect } from "next/navigation"
import { ApplicationChat } from "@/components/recruitment/application-chat"
import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import Link from "next/link"

export default async function ApplicationChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        redirect("/dashboard")
    }

    const { data: application } = await supabaseAdmin
        .from("recruitment_applications")
        .select("*")
        .eq("id", id)
        .single()

    if (!application) notFound()

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] p-4 md:p-6 lg:p-8 w-full">
            <div className="flex items-center gap-4 mb-6 shrink-0">
                <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-white/5">
                    <Link href={`/dashboard/settings/recruitment/${id}`}>
                        <IconArrowLeft className="size-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-xl font-black uppercase tracking-tight text-white">Chat de Reclutamiento</h1>
                    <p className="text-xs text-zinc-400 font-medium tracking-wide">
                        Coordina con <span className="text-blue-400 font-bold">{application.character_name}</span> los detalles de su ingreso.
                    </p>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <ApplicationChat
                    applicationId={id}
                    otherPartyName={application.character_name}
                />
            </div>
        </div>
    )
}
