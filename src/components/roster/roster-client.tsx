"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { IconSearch, IconShield, IconHeart, IconSword, IconBow } from "@tabler/icons-react";
import { RosterTable } from "@/components/common/roster-table";

export function RosterClient({
  members,
  roleLevel,
  rankNames,
  rankColors,
  classNames = {},
  classColors = {},
  classRoleMapping = {},
}: {
  members: any[];
  roleLevel?: string;
  rankNames?: string[];
  rankColors?: (string | null)[];
  classNames?: Record<number, string>;
  classColors?: Record<number, string>;
  classRoleMapping?: Record<number, string>;
}) {
  const [search, setSearch] = useState("");

  const handleSort = () => {
    // Legacy sort prop for RosterTable, no longer active but required by typing
  };

  const filteredMembers = useMemo(() => {
    const baseFiltered = members.filter((m) => {
      if (search && !m.character_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    // Default static sort: Rank First, then Name
    return baseFiltered.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.character_name.localeCompare(b.character_name);
    });
  }, [members, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {
      tank: [],
      heal: [],
      melee: [],
      ranged: []
    };

    filteredMembers.forEach(m => {
      let role = m.role?.toLowerCase();

      // Fallback to class mapping if explicit role isn't set
      if (!role || (role !== "tank" && role !== "heal" && role !== "melee" && role !== "ranged")) {
        role = classRoleMapping[m.class_id ?? 0] ?? "ranged";
      }

      if (groups[role]) {
        groups[role].push(m);
      } else {
        groups["ranged"].push(m);
      }
    });

    return groups;
  }, [filteredMembers, classRoleMapping]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="relative w-full md:max-w-md">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            className="pl-8 bg-background border-border/50 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="px-4 lg:px-6 grid gap-6 grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 xl:grid-cols-3">
        {/* Tanques */}
        <div className="flex flex-col gap-2">
          <div className="py-2 flex items-center gap-2 text-base font-semibold text-sky-400 border-b border-border/40">
            <IconShield className="size-5" />
            Tanques ({grouped.tank.length})
          </div>
          <div className="flex-1">
            <RosterTable
              members={grouped.tank}
              roleLevel={roleLevel}
              rankNames={rankNames}
              rankColors={rankColors}
              classNames={classNames}
              classColors={classColors}
              classRoleMapping={classRoleMapping}
              sortColumn="rank"
              sortDirection="asc"
              onSort={handleSort}
            />
          </div>
        </div>

        {/* Sanadores */}
        <div className="flex flex-col gap-2">
          <div className="py-2 flex items-center gap-2 text-base font-semibold text-emerald-400 border-b border-border/40">
            <IconHeart className="size-5" />
            Sanadores ({grouped.heal.length})
          </div>
          <div className="flex-1">
            <RosterTable
              members={grouped.heal}
              roleLevel={roleLevel}
              rankNames={rankNames}
              rankColors={rankColors}
              classNames={classNames}
              classColors={classColors}
              classRoleMapping={classRoleMapping}
              sortColumn="rank"
              sortDirection="asc"
              onSort={handleSort}
            />
          </div>
        </div>

        {/* Melee */}
        <div className="flex flex-col gap-2">
          <div className="py-2 flex items-center gap-2 text-base font-semibold text-rose-400 border-b border-border/40">
            <IconSword className="size-5" />
            Melee DPS ({grouped.melee.length})
          </div>
          <div className="flex-1">
            <RosterTable
              members={grouped.melee}
              roleLevel={roleLevel}
              rankNames={rankNames}
              rankColors={rankColors}
              classNames={classNames}
              classColors={classColors}
              classRoleMapping={classRoleMapping}
              sortColumn="rank"
              sortDirection="asc"
              onSort={handleSort}
            />
          </div>
        </div>

        {/* Ranged */}
        <div className="flex flex-col gap-2">
          <div className="py-2 flex items-center gap-2 text-base font-semibold text-blue-400 border-b border-border/40">
            <IconBow className="size-5" />
            Ranged DPS ({grouped.ranged.length})
          </div>
          <div className="flex-1">
            <RosterTable
              members={grouped.ranged}
              roleLevel={roleLevel}
              rankNames={rankNames}
              rankColors={rankColors}
              classNames={classNames}
              classColors={classColors}
              classRoleMapping={classRoleMapping}
              sortColumn="rank"
              sortDirection="asc"
              onSort={handleSort}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
