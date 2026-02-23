"use client";

import { useState } from "react";
import {
  IconSettings,
  IconTrash,
  IconCheck,
  IconX,
  IconPencil,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconCalendarEvent,
} from "@tabler/icons-react";
import { cn } from "@/infrastructure/tailwind/tailwind-utils"
import { sileo } from "sileo";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type GuildMember = {
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
  is_plannable?: boolean;
};

const WOW_CLASSES: Record<number, string> = {
  1: "Warrior",
  2: "Paladin",
  3: "Hunter",
  4: "Rogue",
  5: "Priest",
  6: "DK",
  7: "Shaman",
  8: "Mage",
  9: "Warlock",
  10: "Monk",
  11: "Druid",
  12: "DH",
  13: "Evoker",
};

const WOW_CLASS_COLORS: Record<number, string> = {
  1: "text-[#C69B6D]", // Warrior
  2: "text-[#F48CBA]", // Paladin
  3: "text-[#AAD372]", // Hunter
  4: "text-[#FFF468]", // Rogue
  5: "text-white", // Priest
  6: "text-[#C41E3A]", // DK
  7: "text-[#0070DD]", // Shaman
  8: "text-[#3FC7EB]", // Mage
  9: "text-[#8788EE]", // Warlock
  10: "text-[#00FF98]", // Monk
  11: "text-[#FF7C0A]", // Druid
  12: "text-[#A330C9]", // DH
  13: "text-[#33937F]", // Evoker
};

const RANK_NAMES: Record<number, string> = {
  0: "GM",
  1: "Officer",
  2: "Officer Alt",
  3: "Raider",
  4: "Trial",
  5: "Social",
  6: "Alt",
  7: "Initiate",
  8: "Recruit",
  9: "Member",
};

// Dummy mapping to guess role based on class for visual purposes
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
  10: "Monk",
  11: "Heal",
  12: "Melee",
  13: "Heal",
};

type SortColumn = "name" | "realm" | "role" | "rank";

export function RosterTable({
  members,
  roleLevel,
  rankNames,
  sortColumn,
  sortDirection,
  onSort,
}: {
  members: GuildMember[];
  roleLevel?: string;
  rankNames?: string[];
  sortColumn?: SortColumn;
  sortDirection?: "asc" | "desc";
  onSort?: (col: SortColumn) => void;
}) {
  const canViewNote = roleLevel === "gm" || roleLevel === "officer";

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column)
      return (
        <IconArrowsSort className="size-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      );
    return sortDirection === "asc" ? (
      <IconArrowUp className="size-3 text-primary" />
    ) : (
      <IconArrowDown className="size-3 text-primary" />
    );
  };

  const handleRoleChange = async (
    memberId: string,
    name: string,
    role: string,
  ) => {
    try {
      const res = await fetch(`/api/guild/members/${memberId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role.charAt(0).toUpperCase() + role.slice(1),
        }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      sileo.success({ title: `Rol de ${name} actualizado` });
      window.location.reload();
    } catch (e) {
      sileo.error({ title: "Error al actualizar el rol" });
      console.error(e);
    }
  };

  const handleRankChange = async (
    memberId: string,
    name: string,
    rankId: string,
  ) => {
    try {
      const res = await fetch(`/api/guild/members/${memberId}/rank`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rank: rankId }),
      });
      if (!res.ok) throw new Error("Failed to update rank");
      sileo.success({ title: `Rango de ${name} actualizado` });
      window.location.reload();
    } catch (e) {
      sileo.error({ title: "Error al actualizar el rango" });
      console.error(e);
    }
  };


  return (
    <div className="w-full">
      <Table>
        <TableHeader className="border-b border-border/40">
          <TableRow className="hover:bg-transparent border-0">
            <TableHead
              className="w-full text-muted-foreground font-semibold py-3 pl-4 cursor-pointer hover:bg-muted/80 transition-colors select-none group"
              onClick={() => onSort?.("name")}
            >
              <div className="flex items-center gap-2">
                Name <SortIcon column="name" />
              </div>
            </TableHead>
            <TableHead className="w-[100px] text-muted-foreground font-semibold text-right pr-4">
              Ajustes
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length > 0 ? (
            members.map((m) => {
              const classColor =
                WOW_CLASS_COLORS[m.class_id ?? 0] ?? "text-white";
              const classNameStr = WOW_CLASSES[m.class_id ?? 0] ?? "Unknown";
              const guessedRole =
                CLASS_ROLE_MAPPING[m.class_id ?? 0] ?? "Ranged";

              return (
                <TableRow
                  key={m.id}
                  className="border-b border-border/10 hover:bg-[#333340] transition-colors group"
                >
                  {/* Name with icon placeholder */}
                  <TableCell className="font-medium pl-4 py-2">
                    <div className="flex items-center gap-3">
                      {m.class_id ? (
                        <img
                          src={`/assets/images/classes/${m.class_id}.jpg`}
                          alt={classNameStr}
                          className="size-6 rounded-full shadow-inner border border-border/30 object-cover"
                        />
                      ) : (
                        <div className="size-6 rounded-full bg-[#1e1e24] flex items-center justify-center text-[10px] border border-border/30 shadow-inner overflow-hidden">
                          <div
                            className={`w-full h-full bg-current opacity-20 text-white`}
                          ></div>
                        </div>
                      )}

                      <span
                        className={`${classColor} font-semibold drop-shadow-sm`}
                      >
                        {m.character_name}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status & Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div className="flex items-end align-right justify-end">
                        <a
                          href={`https://worldofwarcraft.blizzard.com/es-es/character/eu/${m.realm_slug}/${m.character_name.toLowerCase()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-muted rounded transition-colors w-10"
                          title="Armería de WoW"
                        >
                          <img src="/assets/images/icons/armory.png" className="size-5 opacity-80 hover:opacity-100 transition-all object-contain" alt="Armería" />
                        </a>
                        <a
                          href={`https://www.warcraftlogs.com/character/eu/${m.realm_slug}/${m.character_name.toLowerCase()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-muted rounded transition-colors w-10"
                          title="WarcraftLogs"
                        >
                          <img src="/assets/images/icons/wcl.png" className="size-5 opacity-80 hover:opacity-100 transition-all object-contain" alt="WCL" />
                        </a>
                        <a
                          href={`https://raider.io/characters/eu/${m.realm_slug}/${m.character_name.toLowerCase()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-muted rounded transition-colors w-10"
                          title="Raider.io"
                        >
                          <img src="/assets/images/icons/raiderio.png" className="size-5 opacity-80 hover:opacity-100 transition-all object-contain" alt="RIO" />
                        </a>
                      </div>

                      <div className="w-px h-4 bg-border/20 mx-1" />

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-white hover:bg-muted"
                          >
                            <IconSettings className="size-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-[#1e1e24] border-border/20">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-lg">
                              Ficha de Personaje
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                              Realiza ajustes al rol, rango o notas internas exclusivas de la web.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-md border border-border/10">
                              {m.class_id ? (
                                <img
                                  src={`/assets/images/classes/${m.class_id}.jpg`}
                                  alt={classNameStr}
                                  className="size-9 rounded-full shadow-inner border border-border/30 object-cover"
                                />
                              ) : (
                                <div className="size-9 rounded-full bg-[#1e1e24] flex items-center justify-center border border-border/30 shadow-inner">
                                  <div className={`w-full h-full bg-current opacity-20 text-white`}></div>
                                </div>
                              )}
                              <div>
                                <div className={`${classColor} font-semibold text-lg drop-shadow-sm leading-none m-0`}>
                                  {m.character_name}
                                </div>
                                <div className="text-muted-foreground text-xs mt-1">
                                  {m.realm_name ?? m.realm_slug}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rol</label>
                                <Select
                                  defaultValue={(m.role || guessedRole).toLowerCase()}
                                  onValueChange={(val) =>
                                    handleRoleChange(m.id, m.character_name, val)
                                  }
                                >
                                  <SelectTrigger className="w-full bg-[#1e1e24]/50 border-border/30 hover:bg-[#1e1e24] focus:ring-0 transition-colors">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="tank">Tank</SelectItem>
                                    <SelectItem value="heal">Heal</SelectItem>
                                    <SelectItem value="melee">Melee</SelectItem>
                                    <SelectItem value="ranged">Ranged</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rango</label>
                                <Select
                                  defaultValue={m.rank.toString()}
                                  onValueChange={(val) =>
                                    handleRankChange(m.id, m.character_name, val)
                                  }
                                >
                                  <SelectTrigger className="w-full bg-[#1e1e24]/50 border-border/30 hover:bg-[#1e1e24] focus:ring-0 transition-colors">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((rankId) => (
                                      <SelectItem key={rankId} value={rankId.toString()}>
                                        {rankNames?.[rankId] || RANK_NAMES[rankId]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {canViewNote && (
                              <div className="space-y-1.5 pt-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas Internas</label>
                                <NoteCell memberId={m.id} initialNote={m.note} />
                              </div>
                            )}

                            <Separator className="my-2 opacity-50" />

                            <div className="flex justify-start">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 text-xs px-2 h-7"
                                onClick={async () => {
                                  if (
                                    confirm(
                                      `¿Estás seguro de que quieres borrar a ${m.character_name}?`,
                                    )
                                  ) {
                                    try {
                                      const res = await fetch(
                                        `/api/guild/members/${m.id}`,
                                        { method: "DELETE" },
                                      );
                                      if (res.ok) {
                                        window.location.reload();
                                      }
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }
                                }}
                              >
                                <IconTrash className="size-3.5 mr-1" /> Remover personaje
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                No hay personajes en el roster.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function NoteCell({
  memberId,
  initialNote,
}: {
  memberId: string;
  initialNote?: string | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(initialNote ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/guild/members/${memberId}/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error("Failed to save");

      if (!note || note.trim() === "") {
        sileo.success({ title: "Nota borrada" });
      } else {
        sileo.success({ title: "Nota editada" });
      }

      setIsEditing(false);
    } catch (e) {
      sileo.error({ title: "Error al guardar la nota" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 w-full min-w-[200px]">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="h-8 bg-[#1e1e24]/50 border-border/30 text-xs w-full focus-visible:ring-1 focus-visible:ring-emerald-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setIsEditing(false);
              setNote(initialNote ?? "");
            }
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10"
          onClick={handleSave}
          disabled={isSaving}
        >
          <IconCheck className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:bg-red-500/10"
          onClick={() => {
            setIsEditing(false);
            setNote(initialNote ?? "");
          }}
          disabled={isSaving}
        >
          <IconX className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group/note flex items-center justify-between w-full min-w-[200px] gap-2">
      <div className="text-xs text-muted-foreground truncate" title={note}>
        {note || <span className="opacity-50 italic">Add a note...</span>}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover/note:opacity-100 transition-opacity"
        onClick={() => setIsEditing(true)}
      >
        <IconPencil className="size-3 text-muted-foreground" />
      </Button>
    </div>
  );
}
