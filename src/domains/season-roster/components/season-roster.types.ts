export type SortColumn =
	| "character_name"
	| "class_name"
	| "main_spec"
	| "role"
	| "off_spec"
	| "profession_1"
	| "profession_2"
	| null;

export type EditableFields = {
	main_spec: string;
	off_spec: string;
	profession_1: string;
	profession_2: string;
};

export type RoleStats = {
	tanks: number;
	healers: number;
	melee: number;
	ranged: number;
	total: number;
};

export type ClassCount = {
	classId: number;
	label: string;
	color: string;
	count: number;
};

export type RosterStats = {
	roles: RoleStats;
	classes: ClassCount[];
};

import type {
	RosterEntry,
	BnetCharacter,
	ClassSpecsMap,
} from "../lib/constants";

export type PageProps = {
	entries: RosterEntry[];
	classNames: Record<number, string>;
	specsByClass: ClassSpecsMap;
	currentUserId: string | null;
	canEditAll: boolean;
	canManageAll: boolean;
	myBnetCharacters: BnetCharacter[];
};
