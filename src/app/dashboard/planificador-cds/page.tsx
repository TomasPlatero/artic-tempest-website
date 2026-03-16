import { Suspense } from "react"
import { PlanificadorCdsClient } from "@/domains/cd-planner/components/planificador-cds-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/shared/auth/auth-options"
import { getAppPermission } from "@/shared/auth/permissions"
import { redirect } from "next/navigation"
import * as flags from "@/flags"

export default async function PlanificadorCdsPage({ searchParams }: { searchParams: Promise<{ event_id?: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session) redirect("/")

    const roleLevel = session.user?.roleLevel ?? "member"
    const { canView } = await getAppPermission(roleLevel, 'planificador-cds')

    if (!canView || !(await flags.enablePlanner())) {
        redirect("/dashboard")
    }

    const params = await searchParams
    const hasEventId = !!params.event_id

    return (
        <div className="flex flex-1 flex-col py-6 mx-auto w-full px-4 gap-6 min-w-0 overflow-hidden lg:px-8">
            <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Cargando planificador...</div>}>
                <PlanificadorCdsClient />
            </Suspense>
        </div>
    )
}
