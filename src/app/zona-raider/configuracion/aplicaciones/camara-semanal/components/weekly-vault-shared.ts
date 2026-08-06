export function getWowColorClass(classId: number): string {
    const classColors: Record<number, string> = {
        1: "text-[#C79C6E]",
        2: "text-[#F58CBA]",
        3: "text-[#ABD473]",
        4: "text-[#FFF569]",
        5: "text-[#FFFFFF]",
        6: "text-[#C41E3A]",
        7: "text-[#0070DE]",
        8: "text-[#69CCF0]",
        9: "text-[#9482C9]",
        10: "text-[#00FF96]",
        11: "text-[#FF7D0A]",
        12: "text-[#A330C9]",
        13: "text-[#33937F]",
    }
    return classColors[classId] || "text-foreground"
}

export type Upload = {
    id: string
    created_at: string
    week_start: string
    image_url: string
    profile_id: string
    character_id: string
    profiles: { discord_username: string; discord_avatar: string } | null
    bnet_characters: { name: string; class_id: number; realm_slug: string } | null
}

export type SortConfig = {
    key: string
    direction: "asc" | "desc" | null
}
