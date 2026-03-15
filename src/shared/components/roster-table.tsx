"use client";

import { useState } from "react";
import Image from "next/image";
import {
  IconSettings,
  IconTrash,
  IconCheck,
  IconX,
  IconPencil,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconCircleLetterG,
  IconCircleLetterO,
  IconCircleLetterA,
  IconCircleLetterR,
  IconCircleLetterT,
  IconCircleLetterS,
  IconCircleLetterI,
  IconCircleLetterM,
  IconCircleLetterL,
  IconCircleLetterB,
  IconUser
} from "@tabler/icons-react";
import { cn } from "@/shared/tailwind/tailwind-utils"
import { toast } from "sonner";
import {
  updateMemberRole,
  updateMemberRank,
  updateMemberNote,
  deleteMember
} from "@/domains/roster/lib/server-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";

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

const RANK_NAMES: Record<number, string> = {
  0: "Guild Master",
  1: "Oficial",
  2: "Alter Oficial",
  3: "Raid Leader",
  4: "Artic Raider",
  5: "Raider",
  6: "Trial",
  7: "Alter Raider",
  8: "Backup",
  9: "Miembro/familia",
};

const RANK_IMAGES: Record<number, string> = {
  0: "/assets/images/ranks/GM.webp",
  1: "/assets/images/ranks/OFICIAL.webp",
  2: "/assets/images/ranks/OFICIAL.webp",
  3: "/assets/images/ranks/RAID_LEADER.webp",
  4: "/assets/images/ranks/ARTIC_RAIDER.webp",
  5: "/assets/images/ranks/RAIDER.webp",
  6: "/assets/images/ranks/TRIAL.webp",
  7: "/assets/images/ranks/ALTER_RAIDER.webp",
}

export const RANK_STYLES: Record<number, { icon: any, color: string }> = {
  0: { icon: IconCircleLetterG, color: "text-white bg-holo rounded-full p-[0.5px]" }, // Guild Master
  1: { icon: IconCircleLetterO, color: "text-[#33937F]" }, // Officer (Evoker Green)
  2: { icon: IconCircleLetterA, color: "text-slate-400" },  // Officer Alt (Slate)
  3: { icon: IconCircleLetterL, color: "text-[#808000]" }, // Raid Leader (Olive)
  4: { icon: IconCircleLetterA, color: "text-[#FFD700]" }, // Artic Raider (Gold)
  5: { icon: IconCircleLetterR, color: "text-[#EF4444]" }, // Raider (Red)
  6: { icon: IconCircleLetterT, color: "text-[#3B82F6]" }, // Trial (Blue)
  7: { icon: IconCircleLetterS, color: "text-[#22C55E]" }, // Social (Green)
  8: { icon: IconCircleLetterA, color: "text-slate-500" }, // Alt (Dark Slate)
  9: { icon: IconCircleLetterM, color: "text-zinc-500" },   // Member (Zinc)
}

export function RankBadge({ rank, name, rankColors, className: extraClassName }: { rank: number, name?: string, rankColors?: (string | null)[], className?: string }) {
  const rankImageUrl = RANK_IMAGES[rank];
  const dbColor = rankColors?.[rank];
  const displayName = name || RANK_NAMES[rank] || `Rank ${rank}`;

  if (rankImageUrl) {
    return (
      <div 
        className={cn("shrink-0 leading-none flex items-center justify-center rounded-lg overflow-hidden border border-border/20 shadow-sm bg-muted/5", extraClassName)}
        title={displayName}
      >
        <Image
          src={rankImageUrl}
          alt={displayName}
          width={32}
          height={32}
          className="size-8 object-cover"
        />
      </div>
    );
  }

  const style = RANK_STYLES[rank] || { icon: IconUser, color: "text-zinc-500" };
  const Icon = style.icon;

  // Separate color classes from other utility classes (like bg-holo, rounded, etc)
  const classes = style.color.split(" ");
  // We check for text- color if no db color is provided
  const iconStyle = dbColor ? { color: dbColor } : {};
  const className = dbColor ? classes.filter(c => !c.startsWith("text-")).join(" ") : style.color;

  return (
    <div 
      className={cn("shrink-0 leading-none flex items-center justify-center", className, extraClassName)} 
      style={iconStyle}
      title={displayName}
    >
      <Icon className="size-8" stroke={2.5} alt={displayName} />
    </div>
  );
}

type SortColumn = "name" | "realm" | "class" | "rank";

const SortIcon = ({ column, sortColumn, sortDirection }: { column: SortColumn, sortColumn: SortColumn, sortDirection: "asc" | "desc" }) => {
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

export function RosterTable({
  members,
  roleLevel,
  rankNames,
  rankColors,
  classNames = {},
  classColors,
  classRoleMapping,
  raceNames = {},
  sortColumn,
  sortDirection,
  onSort,
  canEdit = false,
}: {
  members: GuildMember[];
  sortColumn: SortColumn;
  sortDirection: "asc" | "desc";
  onSort?: (column: SortColumn) => void;
  canEdit?: boolean;
  roleLevel?: string;
  rankNames?: string[];
  rankColors?: (string | null)[];
  classNames?: Record<number, string>;
  classColors: Record<number, string>;
  classRoleMapping: Record<number, string>;
  raceNames?: Record<number, string>;
}) {
  const canViewNote = canEdit || roleLevel === "gm" || roleLevel === "officer";

  const handleRoleChange = async (
    memberId: string,
    name: string,
    role: string,
  ) => {
    try {
      await updateMemberRole(memberId, role);
      toast.success(`Rol de ${name} actualizado`);
    } catch (e) {
      toast.error("Error al actualizar el rol");
      console.error(e);
    }
  };

  const handleRankChange = async (
    memberId: string,
    name: string,
    rankId: string,
  ) => {
    try {
      await updateMemberRank(memberId, rankId);
      toast.success(`Rango de ${name} actualizado`);
    } catch (e) {
      toast.error("Error al actualizar el rango");
      console.error(e);
    }
  };


  return (
    <div className="w-full">
      <Table>
        <TableHeader className="border-b border-border/40 bg-muted/20">
          <TableRow className="hover:bg-transparent border-0">
            <TableHead
              className="w-[45%] text-muted-foreground font-bold uppercase tracking-widest text-[10px] py-3 pl-4 cursor-pointer hover:bg-muted transition-colors select-none group"
              onClick={() => onSort?.("name")}
            >
              <div className="flex items-center gap-2">
                Nombre <SortIcon column="name" sortColumn={sortColumn} sortDirection={sortDirection} />
              </div>
            </TableHead>
            <TableHead
              className="w-[15%] text-muted-foreground font-bold uppercase tracking-widest text-[10px] py-3 cursor-pointer hover:bg-muted transition-colors select-none group"
              onClick={() => onSort?.("class")}
            >
              <div className="flex items-center justify-center lg:justify-start gap-2">
                Clase <SortIcon column="class" sortColumn={sortColumn} sortDirection={sortDirection} />
              </div>
            </TableHead>
            <TableHead
              className="w-[20%] text-muted-foreground font-bold uppercase tracking-widest text-[10px] py-3 cursor-pointer hover:bg-muted transition-colors select-none group"
              onClick={() => onSort?.("rank")}
            >
              <div className="flex items-center justify-center lg:justify-start gap-2">
                Rango <SortIcon column="rank" sortColumn={sortColumn} sortDirection={sortDirection} />
              </div>
            </TableHead>
            <TableHead className="w-[20%] text-muted-foreground font-bold uppercase tracking-widest text-[10px] text-right pr-4">
              Enlaces / Ajustes
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length > 0 ? (
            members.map((m) => {
              const dbClassColor = classColors[m.class_id ?? 0];
              const currentClass = classRoleMapping[m.class_id ?? 0] || "Desconocido";
              const rankName = rankNames?.[m.rank] || RANK_NAMES[m.rank];

              const classIconStyle = dbClassColor ? { color: dbClassColor } : {};
              const classColorClass = dbClassColor ? "" : "text-white";

              return (
                <TableRow
                  key={m.id}
                  className="border-b border-border/10 hover:bg-[#333340] transition-colors group"
                >
                  {/* Name Column */}
                  <TableCell className="font-medium pl-4 py-2">
                    <span
                      className={cn(classColorClass, "font-bold drop-shadow-sm truncate text-sm")}
                      style={classIconStyle}
                    >
                      {m.character_name}
                    </span>
                  </TableCell>

                  {/* Class Column */}
                  <TableCell className="py-2">
                    <div className="flex items-center justify-center lg:justify-start gap-2">
                      {m.class_id ? (
                        <Image
                          src={`/assets/images/classes/${m.class_id}.jpg`}
                          alt={currentClass}
                          width={24}
                          height={24}
                          className="size-5 lg:size-6 rounded shadow-inner border object-cover shrink-0"
                          style={{ borderColor: dbClassColor || 'rgba(255,255,255,0.1)' }}
                        />
                      ) : (
                        <div className="size-5 lg:size-6 rounded bg-[#1e1e24] border border-border/30 shadow-inner shrink-0"></div>
                      )}
                      <span 
                        className="hidden lg:inline text-[10px] font-black uppercase tracking-tighter bg-muted/40 px-2 py-0.5 rounded border border-border/10 truncate max-w-[80px]"
                        style={classIconStyle}
                      >
                        {currentClass}
                      </span>
                    </div>
                  </TableCell>

                  {/* Rank Column */}
                  <TableCell className="py-2">
                    <div className="flex items-center justify-center lg:justify-start gap-2">
                      <RankBadge rank={m.rank} name={rankName} rankColors={rankColors} className="size-5 lg:size-6 shrink-0" />
                      <span className="hidden lg:inline text-[10px] font-bold text-muted-foreground truncate uppercase tracking-tight">
                        {rankName}
                      </span>
                    </div>
                  </TableCell>

                  {/* Links & Actions Column */}
                  <TableCell className="text-right py-2 pr-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <a
                          href={`https://worldofwarcraft.blizzard.com/es-es/character/eu/${m.realm_slug}/${m.character_name.toLowerCase()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-muted rounded transition-colors"
                          title="Armería de WoW"
                        >
                          <Image src="/assets/images/icons/armory.webp" width={16} height={16} className="size-4 grayscale hover:grayscale-0 transition-all object-contain" alt="Armería" />
                        </a>
                        <a
                          href={`https://www.warcraftlogs.com/character/eu/${m.realm_slug}/${m.character_name.toLowerCase()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-muted rounded transition-colors"
                          title="WarcraftLogs"
                        >
                          <Image src="/assets/images/icons/wcl.webp" width={16} height={16} className="size-4 grayscale hover:grayscale-0 transition-all object-contain" alt="WCL" />
                        </a>
                        <a
                          href={`https://raider.io/characters/eu/${m.realm_slug}/${m.character_name.toLowerCase()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-muted rounded transition-colors"
                          title="Raider.io"
                        >
                          <Image src="/assets/images/icons/raiderio.webp" width={16} height={16} className="size-4 grayscale hover:grayscale-0 transition-all object-contain" alt="RIO" />
                        </a>
                      </div>

                      {canViewNote && (
                        <>
                          <div className="w-px h-3 bg-border/20 mx-0.5" />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-white hover:bg-muted"
                              >
                                <IconSettings className="size-3.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-card border-border/40 p-0 overflow-hidden shadow-2xl">
                              <DialogHeader className="p-6 pb-2">
                                <DialogTitle className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                                  <IconUser className="size-5 text-primary" /> Ficha de Personaje
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground/70 uppercase font-bold tracking-widest mt-1">
                                  Configuración técnica y notas internas
                                </DialogDescription>
                              </DialogHeader>
                              <div className="px-6 py-4 space-y-6">
                                <div className="flex flex-col gap-4">
                                  <div className="flex items-center gap-4 bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 shadow-inner">
                                    {m.class_id ? (
                                      <div className="relative">
                                          <Image
                                            src={`/assets/images/classes/${m.class_id}.jpg`}
                                            alt={currentClass}
                                            width={48}
                                            height={48}
                                          className="size-12 rounded-xl shadow-2xl border-2 object-cover"
                                          style={{ borderColor: dbClassColor ? `${dbClassColor}4D` : 'rgba(59,130,246,0.2)' }}
                                        />
                                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border border-border/50">
                                          <RankBadge rank={m.rank} name={rankName} rankColors={rankColors} className="size-6" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center border-2 border-blue-500/20 shadow-inner">
                                        <IconUser className="size-6 text-blue-400/50" />
                                      </div>
                                    )}
                                    <div className="flex flex-col">
                                      <h2
                                        className={cn("text-xl font-black uppercase tracking-tighter leading-none m-0", classColorClass)}
                                        style={classIconStyle}
                                      >
                                        {m.character_name}
                                      </h2>
                                      <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                        <span>{m.realm_name ?? m.realm_slug}</span>
                                        <span className="size-1 bg-muted-foreground/30 rounded-full" />
                                        <span className="text-blue-400/80">{rankName}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Extended Info Section */}
                                  <div className="grid grid-cols-3 gap-2 px-1">
                                    <div className="bg-muted/30 rounded-lg p-2 border border-border/10 flex flex-col items-center">
                                      <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Nivel</span>
                                      <span className="text-sm font-black text-white">{m.level}</span>
                                    </div>
                                    <div className="bg-muted/30 rounded-lg p-2 border border-border/10 flex flex-col items-center">
                                      <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Raza</span>
                                      <span className="text-[10px] font-black text-white uppercase truncate w-full text-center">
                                        {raceNames[m.race_id ?? 0] || "Desconocida"}
                                      </span>
                                    </div>
                                    <div className="bg-muted/30 rounded-lg p-2 border border-border/10 flex flex-col items-center">
                                      <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Clase</span>
                                      <span className="text-[10px] font-black uppercase truncate w-full text-center" style={classIconStyle}>
                                        {currentClass}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rol</label>
                                    <Select
                                      defaultValue={(m.role || classRoleMapping[m.class_id ?? 0] || "ranged").toLowerCase()}
                                      onValueChange={(val) =>
                                        handleRoleChange(m.id, m.character_name, val)
                                      }
                                    >
                                      <SelectTrigger className="w-full bg-muted/20 border-border/40 hover:bg-muted/30 focus:ring-1 focus:ring-blue-500/30 transition-all font-black uppercase text-[10px] tracking-widest h-10">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="tank">Tanque</SelectItem>
                                        <SelectItem value="heal">Sanador</SelectItem>
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
                                      <SelectTrigger className="w-full bg-muted/20 border-border/40 hover:bg-muted/30 focus:ring-1 focus:ring-blue-500/30 transition-all font-black uppercase text-[10px] tracking-widest h-10">
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
                                  <div className="space-y-1.5 pt-2 border-t border-border/10">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas Internas</label>
                                    <NoteCell memberId={m.id} initialNote={m.note} />
                                  </div>
                                )}

                                  <div className="pt-2 border-t border-border/10 flex items-center justify-between">
                                    <span className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-widest">
                                      Sincronizado: {new Date(m.synced_at).toLocaleDateString()}
                                    </span>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="text-[10px] uppercase font-black tracking-widest gap-2 h-8"
                                    onClick={async () => {
                                      if (
                                        confirm(
                                          `¿Estás seguro de que quieres borrar a ${m.character_name}?`,
                                        )
                                      ) {
                                        try {
                                          await deleteMember(m.id);
                                          toast.success(`${m.character_name} eliminado`);
                                        } catch (e) {
                                          toast.error("Error al eliminar");
                                          console.error(e);
                                        }
                                      }
                                    }}
                                  >
                                    <IconTrash className="size-3.5" /> Remover personaje
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
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
    </div >
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
      await updateMemberNote(memberId, note);
      if (!note || note.trim() === "") {
        toast.success("Nota borrada");
      } else {
        toast.success("Nota editada");
      }
      setIsEditing(false);
    } catch (e) {
      toast.error("Error al guardar la nota");
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
        {note || <span className="opacity-50 italic">Añadir nota...</span>}
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
