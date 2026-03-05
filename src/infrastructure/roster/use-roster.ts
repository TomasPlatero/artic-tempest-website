import { useMemo, useState } from "react";

export type RosterMember = {
    id: string;
    character_name: string;
    realm_slug: string;
    realm_name: string | null;
    class_id: number | null;
    race_id: number | null;
    level: number;
    rank: number;
    synced_at: string;
    note?: string | null;
    role?: string | null;
};

export type RosterGroups = {
    tank: RosterMember[];
    heal: RosterMember[];
    melee: RosterMember[];
    ranged: RosterMember[];
    alter_tank: RosterMember[];
    alter_heal: RosterMember[];
    alter_melee: RosterMember[];
    alter_ranged: RosterMember[];
    alters_total: RosterMember[];
};

export function useRoster(
    members: RosterMember[],
    classRoleMapping: Record<number, string> = {}
) {
    const [search, setSearch] = useState("");

    const filteredMembers = useMemo(() => {
        const baseFiltered = members.filter((m) => {
            if (search && !m.character_name.toLowerCase().includes(search.toLowerCase())) {
                return false;
            }
            return true;
        });

        // Sort: Rank First (asc), then Name (asc)
        return [...baseFiltered].sort((a, b) => {
            if (a.rank !== b.rank) return a.rank - b.rank;
            return a.character_name.localeCompare(b.character_name);
        });
    }, [members, search]);

    const grouped = useMemo(() => {
        const groups: RosterGroups = {
            tank: [],
            heal: [],
            melee: [],
            ranged: [],
            alter_tank: [],
            alter_heal: [],
            alter_melee: [],
            alter_ranged: [],
            alters_total: [],
        };

        filteredMembers.forEach((m) => {
            let role = m.role?.toLowerCase();

            // Fallback to class mapping if explicit role isn't set
            if (!role || !["tank", "heal", "melee", "ranged"].includes(role)) {
                role = classRoleMapping[m.class_id ?? 0] ?? "ranged";
            }

            // Ranks 7+ are considered 'Alters' in this guild's logic
            if (m.rank >= 7) {
                groups.alters_total.push(m);
                const alterKey = `alter_${role}` as keyof RosterGroups;
                if (Array.isArray(groups[alterKey])) {
                    (groups[alterKey] as RosterMember[]).push(m);
                }
                return;
            }

            const roleKey = role as keyof RosterGroups;
            if (Array.isArray(groups[roleKey])) {
                (groups[roleKey] as RosterMember[]).push(m);
            } else {
                groups.ranged.push(m);
            }
        });

        return groups;
    }, [filteredMembers, classRoleMapping]);

    return {
        search,
        setSearch,
        filteredMembers,
        grouped,
    };
}
