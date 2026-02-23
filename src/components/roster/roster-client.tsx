"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { IconSearch, IconShield, IconHeart, IconSword, IconBow } from "@tabler/icons-react";
import { RosterTable } from "@/components/common/roster-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RosterClient({
  members,
  roleLevel,
  rankNames,
}: {
  members: any[];
  roleLevel?: string;
  rankNames?: string[];
}) {
  const [search, setSearch] = useState("");

  const handleSort = () => {
    // Legacy sort prop for RosterTable, no longer active but required by typing
  };

  // Exact same WOW_CLASSES mapping from roster-table to populate the select
  const WOW_CLASSES: Record<number, string> = {
    1: "Guerrero",
    2: "Paladín",
    3: "Cazador",
    4: "Pícaro",
    5: "Sacerdote",
    6: "DK",
    7: "Chamán",
    8: "Mago",
    9: "Brujo",
    10: "Monje",
    11: "Druida",
    12: "DH",
    13: "Evocador",
  };

  const CLASS_ROLE_MAPPING: Record<number, string> = {
    1: "Tank",
    2: "Heal",
    3: "Ranged",
    4: "Melee",
    5: "Heal",
    6: "Tank",
    7: "Heal",
    8: "Ranged",
    9: "Ranged",
    10: "Melee",
    11: "Heal",
    12: "Melee",
    13: "Heal",
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
      Tank: [],
      Heal: [],
      Melee: [],
      Ranged: []
    };

    filteredMembers.forEach(m => {
      let role = m.role;

      // Fallback to class mapping if explicit role isn't set
      if (!role || (role !== "Tank" && role !== "Heal" && role !== "Melee" && role !== "Ranged")) {
        role = CLASS_ROLE_MAPPING[m.class_id ?? 0] ?? "Ranged";
      }

      if (groups[role]) {
        groups[role].push(m);
      } else {
        groups["Ranged"].push(m);
      }
    });

    return groups;
  }, [filteredMembers]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="relative max-w-md w-full">
          <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            className="pl-8 bg-background border-border/50"
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
            Tanques ({grouped.Tank.length})
          </div>
          <div className="flex-1">
            <RosterTable
              members={grouped.Tank}
              roleLevel={roleLevel}
              rankNames={rankNames}
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
            Sanadores ({grouped.Heal.length})
          </div>
          <div className="flex-1">
            <RosterTable
              members={grouped.Heal}
              roleLevel={roleLevel}
              rankNames={rankNames}
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
            Melee DPS ({grouped.Melee.length})
          </div>
          <div className="flex-1">
            <RosterTable
              members={grouped.Melee}
              roleLevel={roleLevel}
              rankNames={rankNames}
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
            Ranged DPS ({grouped.Ranged.length})
          </div>
          <div className="flex-1">
            <RosterTable
              members={grouped.Ranged}
              roleLevel={roleLevel}
              rankNames={rankNames}
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
