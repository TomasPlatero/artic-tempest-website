import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { redirect } from "next/navigation"
import { RaidEditorClient } from "@/components/calendar/raid-editor-client"

export default async function RaidEditorPage({
    params,
    searchParams
}: {
    params: Promise<{ id?: string }>,
    searchParams: Promise<{ date?: string }>
}) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session || (session.user?.roleLevel !== 'gm' && session.user?.roleLevel !== 'officer')) {
        if (id) {
            redirect(`/dashboard/calendario/${id}`)
        }
        redirect("/dashboard/calendario")
    }

    const { date } = await searchParams

    let initialData = null
    let signups = []

    if (id) {
        const { data: raid } = await sb
            .from("guild_events")
            .select("*")
            .eq("id", id)
            .single()
        initialData = raid

        if (raid) {
            const { data: s } = await sb
                .from("event_signups")
                .select(`
                    *,
                    guild_members (*)
                `)
                .eq("event_id", id)
            signups = s || []
        }
    }

    // Fetch visible ranks from settings
    const { data: visibleRanks } = await sb
        .from("guild_rank_visibility")
        .select("rank_id")
        .eq("is_visible", true)

    const visibleRankIds = (visibleRanks || []).map(r => r.rank_id)

    // Fetch all members belonging to visible ranks to show in the "Available" pool
    let query = sb.from("guild_members").select("*")
    if (visibleRankIds.length > 0) {
        query = query.in("rank", visibleRankIds)
    }

    const { data: members } = await query.order("rank", { ascending: true })

    return (
        <div className="flex flex-1 flex-col py-6 max-w-full mx-auto w-full px-4 gap-6">
            <RaidEditorClient
                initialRaid={initialData}
                initialSignups={signups}
                plannableMembers={members || []}
                preselectedDate={date}
            />
        </div>
    )
}
