import { useState } from "react";
import { normalizeRosterRole } from "@/shared/lib/roster-role";

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

export type SortColumn = "name" | "realm" | "class" | "rank";

const EMPTY_CLASS_ROLE_MAPPING: Record<number, string> = {};

function normalizeString(str: string) {
	return str
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

export function useRoster(
	members: RosterMember[],
	classRoleMapping: Record<number, string> = EMPTY_CLASS_ROLE_MAPPING,
	rankSections: Array<"main" | "alters" | null | undefined> = [],
) {
	const [search, setSearch] = useState("");
	const [sortColumn, setSortColumn] = useState<SortColumn>("rank");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

	const handleSort = (column: SortColumn) => {
		if (sortColumn === column) {
			setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortColumn(column);
			setSortDirection("asc");
		}
	};

	const filteredMembers = (() => {
		const normalizedSearch = normalizeString(search);

		const baseFiltered = members.filter((m) => {
			if (!search) return true;
			return normalizeString(m.character_name).includes(normalizedSearch);
		});

		// Dynamic Sort
		return baseFiltered.toSorted((a, b) => {
			let result = 0;
			if (sortColumn === "name") {
				result = a.character_name.localeCompare(b.character_name);
			} else if (sortColumn === "realm") {
				result = (a.realm_name || a.realm_slug).localeCompare(
					b.realm_name || b.realm_slug,
				);
			} else if (sortColumn === "class") {
				const classA =
					normalizeRosterRole(classRoleMapping[a.class_id ?? 0]) || "";
				const classB =
					normalizeRosterRole(classRoleMapping[b.class_id ?? 0]) || "";
				result = classA.localeCompare(classB);
			} else if (sortColumn === "rank") {
				result = a.rank - b.rank;
			}

			// Secondary sort by name if primary is same
			if (result === 0 && sortColumn !== "name") {
				result = a.character_name.localeCompare(b.character_name);
			}

			return sortDirection === "asc" ? result : -result;
		});
	})();

	const grouped = (() => {
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
			let role =
				normalizeRosterRole(m.role) ||
				normalizeRosterRole(classRoleMapping[m.class_id ?? 0]) ||
				"ranged";
			const rankSection =
				rankSections[m.rank] ?? (m.rank >= 7 ? "alters" : "main");

			if (rankSection === "alters") {
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
	})();

	return {
		search,
		setSearch,
		sortColumn,
		sortDirection,
		handleSort,
		filteredMembers,
		grouped,
	};
}
