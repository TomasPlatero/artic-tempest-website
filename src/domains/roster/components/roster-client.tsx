"use client";

import { useState, useEffect } from "react";
import { Input } from "@/shared/ui/input";
import { IconSearch, IconShield, IconHeart, IconSword, IconBow, IconUsers } from "@tabler/icons-react";
import { RosterTable } from "@/shared/components/roster-table";
import { useRoster } from "@/domains/roster/lib/use-roster";

export function RosterClient({
  members,
  canEdit = false,
  roleLevel,
  rankNames,
  rankColors,
  classNames = {},
  classColors = {},
  classRoleMapping = {},
}: {
  members: any[];
  canEdit?: boolean;
  roleLevel?: string;
  rankNames?: string[];
  rankColors?: (string | null)[];
  classNames?: Record<number, string>;
  classColors?: Record<number, string>;
  classRoleMapping?: Record<number, string>;
}) {
  const { search, setSearch, grouped } = useRoster(members, classRoleMapping);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground animate-pulse font-medium uppercase tracking-widest text-[10px]">Preparando Roster...</p>
      </div>
    );
  }

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
              canEdit={canEdit}
              roleLevel={roleLevel}
              rankNames={rankNames}
              rankColors={rankColors}
              classNames={classNames}
              classColors={classColors}
              classRoleMapping={classRoleMapping}
              sortColumn="rank"
              sortDirection="asc"
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
              canEdit={canEdit}
              roleLevel={roleLevel}
              rankNames={rankNames}
              rankColors={rankColors}
              classNames={classNames}
              classColors={classColors}
              classRoleMapping={classRoleMapping}
              sortColumn="rank"
              sortDirection="asc"
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
              canEdit={canEdit}
              roleLevel={roleLevel}
              rankNames={rankNames}
              rankColors={rankColors}
              classNames={classNames}
              classColors={classColors}
              classRoleMapping={classRoleMapping}
              sortColumn="rank"
              sortDirection="asc"
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
              canEdit={canEdit}
              roleLevel={roleLevel}
              rankNames={rankNames}
              rankColors={rankColors}
              classNames={classNames}
              classColors={classColors}
              classRoleMapping={classRoleMapping}
              sortColumn="rank"
              sortDirection="asc"
            />
          </div>
        </div>
      </div>

      {grouped.alters_total.length > 0 && (
        <div className="px-4 lg:px-6 pt-10 border-t border-border/20">
          <div className="flex flex-col gap-4">
            <div className="py-2 flex items-center gap-2 text-base font-black italic uppercase tracking-tighter text-slate-400 border-b border-border/40">
              <IconUsers className="size-6" />
              {rankNames?.[7] || "Alters"} ({grouped.alters_total.length})
            </div>

            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 xl:grid-cols-3">
              {/* Tanques Alter */}
              <div className="flex flex-col gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <div className="py-2 flex items-center gap-2 text-xs font-bold text-sky-400/70 border-b border-border/20">
                  <IconShield className="size-4" />
                  Tanques ({grouped.alter_tank.length})
                </div>
                <RosterTable
                  members={grouped.alter_tank}
                  canEdit={canEdit}
                  roleLevel={roleLevel}
                  rankNames={rankNames}
                  rankColors={rankColors}
                  classNames={classNames}
                  classColors={classColors}
                  classRoleMapping={classRoleMapping}
                  sortColumn="rank"
                  sortDirection="asc"
                />
              </div>

              {/* Sanadores Alter */}
              <div className="flex flex-col gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <div className="py-2 flex items-center gap-2 text-xs font-bold text-emerald-400/70 border-b border-border/20">
                  <IconHeart className="size-4" />
                  Sanadores ({grouped.alter_heal.length})
                </div>
                <RosterTable
                  members={grouped.alter_heal}
                  canEdit={canEdit}
                  roleLevel={roleLevel}
                  rankNames={rankNames}
                  rankColors={rankColors}
                  classNames={classNames}
                  classColors={classColors}
                  classRoleMapping={classRoleMapping}
                  sortColumn="rank"
                  sortDirection="asc"
                />
              </div>

              {/* Melee Alter */}
              <div className="flex flex-col gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <div className="py-2 flex items-center gap-2 text-xs font-bold text-rose-400/70 border-b border-border/20">
                  <IconSword className="size-4" />
                  Melee ({grouped.alter_melee.length})
                </div>
                <RosterTable
                  members={grouped.alter_melee}
                  canEdit={canEdit}
                  roleLevel={roleLevel}
                  rankNames={rankNames}
                  rankColors={rankColors}
                  classNames={classNames}
                  classColors={classColors}
                  classRoleMapping={classRoleMapping}
                  sortColumn="rank"
                  sortDirection="asc"
                />
              </div>

              {/* Ranged Alter */}
              <div className="flex flex-col gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <div className="py-2 flex items-center gap-2 text-xs font-bold text-blue-400/70 border-b border-border/20">
                  <IconBow className="size-4" />
                  Ranged ({grouped.alter_ranged.length})
                </div>
                <RosterTable
                  members={grouped.alter_ranged}
                  canEdit={canEdit}
                  roleLevel={roleLevel}
                  rankNames={rankNames}
                  rankColors={rankColors}
                  classNames={classNames}
                  classColors={classColors}
                  classRoleMapping={classRoleMapping}
                  sortColumn="rank"
                  sortDirection="asc"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
