import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { redirect, notFound } from "next/navigation"
import { RecruitmentDetailClient } from "@/components/recruitment/recruitment-detail-client"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/common/sidebar"
import React from "react"

export default async function RecruitmentDetailPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.roleLevel !== 'gm' && session.user.roleLevel !== 'officer')) {
        redirect("/dashboard")
    }

    const { id } = params

    // Fetch application details
    const { data: application } = await sb
        .from("recruitment_applications")
        .select("*")
        .eq("id", id)
        .single()

    if (!application) notFound()

    // Fetch answers and questions
    const { data: answers } = await sb
        .from("application_answers")
        .select(`
            answer_text,
            recruitment_questions (
                label,
                order_index
            )
        `)
        .eq("application_id", id)

    // Fetch class constants
    const { data: classConstants } = await sb
        .from("game_constants")
        .select("key, value, metadata")
        .eq("category", "wow_class")

    const style = {
        "--sidebar-width": "calc(var(--spacing) * 64)",
        "--header-height": "calc(var(--spacing) * 12)",
    } as React.CSSProperties

    return (
        <SidebarProvider style={style}>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col py-6 gap-6 px-4 lg:px-6">
                    <RecruitmentDetailClient
                        application={application}
                        answers={answers || []}
                        classConstants={classConstants || []}
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
