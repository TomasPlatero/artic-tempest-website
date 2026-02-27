import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { getAppPermission } from "@/infrastructure/auth/permissions"
import { redirect, notFound } from "next/navigation"
import { RaidEditorClient } from "@/components/calendar/raid-editor-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

async function getEditorData(eventId?: string) {
    // 1. Fetch Raid if ID provided
    let initialData = null
    let signups = []

    if (eventId) {
        const { data: raid } = await sb
            .from("guild_events")
            .select("*")
            .eq("id", eventId)
            .single()

        if (!raid) return null
        initialData = raid

        const { data: s } = await sb
            .from("event_signups")
            .select(`
                *,
                guild_members (*)
            `)
            .eq("event_id", eventId)
        signups = s || []
    }

    // 2. Fetch Ranks and Members
    const { data: rawRanks } = await sb
        .from("guild_ranks")
        .select("rank, name, is_visible, color")

    const visibilityMap: Record<number, boolean> = {}
    for (let i = 0; i <= 9; i++) {
        const found = rawRanks?.find(v => v.rank === i)
        visibilityMap[i] = found ? found.is_visible : true
    }

    const { data: members } = await sb
        .from("guild_members")
        .select("*")
        .order("rank", { ascending: true })

    const filteredMembers = (members ?? []).filter(m => visibilityMap[Number(m.rank)] ?? true)

    // 3. Fetch Game Constants
    const { data: constantRows } = await sb
        .from("game_constants")
        .select("category, key, value, metadata")

    const classRoles: Record<number, string> = {}
    const raids: any[] = []
    const buffs: any[] = [
        { category: "Buffs / Debuffs", items: [] },
        { category: "Utilidad", items: [] }
    ]

    constantRows?.forEach(c => {
        if (c.category === 'class_role') {
            classRoles[Number(c.key)] = c.value
        }
        if (c.category === 'wow_raid') {
            raids.push({
                id: c.key,
                name: c.value,
                background: c.metadata?.background,
                bosses: c.metadata?.bosses || []
            })
        }
        if (c.category === 'wow_buff') {
            const item = { id: c.key, name: c.value, classId: c.metadata?.classId }
            if (c.metadata?.type === 'buff') buffs[0].items.push(item)
            else buffs[1].items.push(item)
        }
    })

    const rankColors: (string | null)[] = []
    for (let i = 0; i <= 9; i++) {
        const found = rawRanks?.find(v => v.rank === i)
        rankColors[i] = found?.color || null
    }

    return {
        initialData,
        signups,
        filteredMembers,
        classRoles,
        raids,
        buffs,
        rankColors
    }
}

export default async function RaidEditorPage({
    params,
    searchParams
}: {
    params: Promise<{ id?: string }>,
    searchParams: Promise<{ date?: string }>
}) {
    const session = await getServerSession(authOptions)
    if (!session) redirect("/")

    const { id } = await params
    const { date } = await searchParams

    const roleLevel = session.user.roleLevel ?? "member"
    const { canEdit } = await getAppPermission(roleLevel, 'calendar')

    if (!canEdit) {
        if (id) redirect(`/dashboard/calendario/${id}`)
        redirect("/dashboard/calendario")
    }

    const { data: currentMember } = await sb
        .from("guild_members")
        .select("id")
        .eq("profile_id", session.user.id)
        .single()

    const data = await getEditorData(id)
    if (id && !data) notFound()

    return (
        <div className="flex flex-1 flex-col py-6 max-w-full mx-auto w-full px-4 gap-6 relative">
            <RaidEditorClient
                initialRaid={data?.initialData}
                initialSignups={data?.signups || []}
                plannableMembers={data?.filteredMembers || []}
                preselectedDate={date}
                currentMemberId={currentMember?.id}
                classRoles={data?.classRoles || {}}
                raids={data?.raids || []}
                buffs={data?.buffs || []}
                rankColors={data?.rankColors || []}
            />
        </div>
    )
}
