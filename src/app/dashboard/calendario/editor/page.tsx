import { getServerSession } from "next-auth"
import { authOptions, sb } from "@/infrastructure/auth/auth-options"
import { getAppPermission } from "@/infrastructure/auth/permissions"
import { redirect } from "next/navigation"
import { RaidEditorClient } from "@/components/calendar/raid-editor-client"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

async function getEditorData() {
    // 1. Fetch Ranks and Members
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

    // 2. Fetch Game Constants
    const { data: constantRows } = await sb
        .from("game_constants")
        .select("category, key, value, metadata")

    const classRoles: Record<number, string> = {}
    const buffs: any[] = [
        { category: "Buffs / Debuffs", items: [] },
        { category: "Utilidad", items: [] }
    ]

    const uniqueRaids = new Map()
    constantRows?.forEach(c => {
        if (c.category === 'class_role') {
            classRoles[Number(c.key)] = c.value
        }
        if (c.category === 'wow_raid') {
            const name = c.value || "";
            const normalizedName = name.toLowerCase().trim();
            if (!uniqueRaids.has(normalizedName)) {
                uniqueRaids.set(normalizedName, {
                    id: c.key,
                    name: c.value,
                    background: c.metadata?.background,
                    bosses: c.metadata?.bosses || []
                })
            }
        }
        if (c.category === 'wow_buff') {
            const item = { id: c.key, name: c.value, classId: c.metadata?.classId }
            if (c.metadata?.type === 'buff') buffs[0].items.push(item)
            else buffs[1].items.push(item)
        }
    })

    const raids = Array.from(uniqueRaids.values())
    raids.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        const isATodas = nameA.includes("todas las raids");
        const isBTodas = nameB.includes("todas las raids");
        if (isATodas && !isBTodas) return -1;
        if (!isATodas && isBTodas) return 1;
        return nameA.localeCompare(nameB, 'es');
    });

    const rankColors: (string | null)[] = []
    for (let i = 0; i <= 9; i++) {
        const found = rawRanks?.find(v => v.rank === i)
        rankColors[i] = found?.color || null
    }

    return {
        filteredMembers,
        classRoles,
        raids,
        buffs,
        rankColors
    }
}

export default async function RaidEditorPage({
    searchParams
}: {
    searchParams: Promise<{ date?: string }>
}) {
    const session = await getServerSession(authOptions)
    if (!session) redirect("/")

    const { date } = await searchParams

    const roleLevel = session.user.roleLevel ?? "member"
    const { canEdit } = await getAppPermission(roleLevel, 'calendar')

    if (!canEdit) {
        redirect("/dashboard/calendario")
    }

    const { data: currentMember } = await sb
        .from("guild_members")
        .select("id")
        .eq("profile_id", session.user.id)
        .single()

    const data = await getEditorData()

    return (
        <div className="flex flex-1 flex-col py-6 max-w-full mx-auto w-full px-4 gap-6 relative">
            <RaidEditorClient
                initialRaid={null}
                initialSignups={[]}
                plannableMembers={data.filteredMembers}
                preselectedDate={date}
                currentMemberId={currentMember?.id}
                classRoles={data.classRoles}
                raids={data.raids}
                buffs={data.buffs}
                rankColors={data.rankColors}
            />
        </div>
    )
}
