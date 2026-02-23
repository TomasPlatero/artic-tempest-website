import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { getAppPermission } from "@/infrastructure/auth/permissions"
import { redirect } from "next/navigation"
import { RaidEditorClient } from "@/components/calendar/raid-editor-client"

export const dynamic = "force-dynamic"

export default async function RaidEditorPage({
    params,
    searchParams
}: {
    params: Promise<{ id?: string }>,
    searchParams: Promise<{ date?: string }>
}) {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect("/")
    }

    const roleLevel = session.user.roleLevel ?? "member"
    const { canEdit } = await getAppPermission(roleLevel, 'calendar')

    if (!canEdit) {
        redirect("/dashboard/calendario")
    }

    const { id } = await params
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

    // Step 1: Fetch visible ranks from settings
    const { data: visibleRanks, error: vrError } = await sb
        .from("guild_ranks")
        .select("rank")
        .eq("is_visible", true)

    if (vrError) console.error("RaidEditorPage - Error fetching visible ranks:", vrError)

    const visibleRankIds = (visibleRanks || []).map(r => r.rank)
    console.log("RaidEditorPage - Visible Rank IDs:", visibleRankIds)

    // Step 2: Fetch all members belonging to visible ranks to show in the "Available" pool
    // FALLBACK: If no visible ranks specified, try fetching all to debug
    let query = sb.from("guild_members").select("*")
    if (visibleRankIds.length > 0) {
        query = query.in("rank", visibleRankIds)
    } else {
        console.warn("RaidEditorPage - No visible ranks found, fetching ALL members as fallback debug")
    }

    const { data: members, error: mError } = await query.order("rank", { ascending: true })

    if (mError) console.error("RaidEditorPage - Error fetching members:", mError)
    console.log("RaidEditorPage - Plannable members found:", members?.length || 0)

    // Emergency RAW check
    const { data: rawCheck } = await sb.from("guild_members").select("id").limit(1)
    console.log("RaidEditorPage - RAW table check (1 row):", rawCheck?.length || 0)

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

