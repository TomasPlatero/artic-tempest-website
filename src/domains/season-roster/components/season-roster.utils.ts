import type { RosterEntry, ClassSpecsMap } from "../lib/constants";
import { CLASS_ID_TO_KEY, CLASS_COLORS } from "../lib/constants";
import type { SpecOption } from "../lib/constants";
import type { EditableFields, RosterStats } from "./season-roster.types";

const ROLE_PRIORITY: Record<string, number> = {
	tank: 4,
	heal: 3,
	melee_dps: 2,
	ranged_dps: 1,
};

const ROLE_LABEL: Record<string, string> = {
	tank: "Tanque",
	heal: "Healer",
	melee_dps: "Melee",
	ranged_dps: "Ranged",
};

export function getRoleLabel(role: string | null): string {
	return role ? (ROLE_LABEL[role] ?? role) : "—";
}

export function getRolePriority(role: string | null): number {
	return role ? (ROLE_PRIORITY[role] ?? 0) : 0;
}

export function getSpecsForClassId(
	classId: number,
	specsByClass: ClassSpecsMap,
): SpecOption[] {
	const classKey = CLASS_ID_TO_KEY[classId];
	if (!classKey) return [];
	return specsByClass[classKey] ?? [];
}

export function hasChanges(
	entry: RosterEntry,
	fields: EditableFields,
): boolean {
	return (
		entry.main_spec !== fields.main_spec ||
		(entry.off_spec ?? "") !== fields.off_spec ||
		(entry.profession_1 ?? "") !== fields.profession_1 ||
		(entry.profession_2 ?? "") !== fields.profession_2
	);
}

export function getSpecRole(
	classId: number,
	specName: string,
	specsByClass: ClassSpecsMap,
): string | null {
	const specs = getSpecsForClassId(classId, specsByClass);
	return specs.find((s) => s.spec_name === specName)?.role ?? null;
}

export function computeStats(
	entries: RosterEntry[],
	classNames: Record<number, string>,
	specsByClass: ClassSpecsMap,
): RosterStats {
	const roleCounts = { tanks: 0, healers: 0, melee: 0, ranged: 0 };
	const classCountMap = new Map<number, ClassCount>();

	for (const e of entries) {
		const role = getSpecRole(e.class_id, e.main_spec, specsByClass);
		if (role === "tank") roleCounts.tanks++;
		else if (role === "heal") roleCounts.healers++;
		else if (role === "melee_dps") roleCounts.melee++;
		else if (role === "ranged_dps") roleCounts.ranged++;

		const existing = classCountMap.get(e.class_id) ?? {
			classId: e.class_id,
			label: classNames[e.class_id] ?? `Clase ${e.class_id}`,
			color: CLASS_COLORS[e.class_id] ?? `hsl(${e.class_id * 60}, 70%, 50%)`,
			count: 0,
		};
		existing.count++;
		classCountMap.set(e.class_id, existing);
	}

	const total =
		roleCounts.tanks +
		roleCounts.healers +
		roleCounts.melee +
		roleCounts.ranged;

	return {
		roles: { ...roleCounts, total },
		classes: Array.from(classCountMap.values()).sort(
			(a, b) => b.count - a.count,
		),
	};
}

type ClassCount = {
	classId: number;
	label: string;
	color: string;
	count: number;
};
