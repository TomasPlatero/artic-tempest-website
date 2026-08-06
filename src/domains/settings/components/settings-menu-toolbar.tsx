"use client";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { IconPlus, IconFolderPlus, IconLinkPlus, IconSearch, IconChevronsDown, IconChevronsUp } from "@/shared/ui/tabler-icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";

export function AddMenuDropdown({
  onCreate,
}: {
  onCreate: (type: "category" | "link", parentId?: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2 h-10 font-semibold text-sm shadow-lg shadow-primary/10">
          <IconPlus className="size-4" /> Añadir
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuItem onClick={() => onCreate("category")}>
          <IconFolderPlus className="size-4 mr-2 text-primary" />
          Nueva Categoría (raíz)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCreate("link")}>
          <IconLinkPlus className="size-4 mr-2 text-emerald-500" />
          Nuevo Enlace (raíz)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MenuSearchToolbar({
  searchQuery,
  onSearchChange,
  onExpand,
  onCollapse,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onExpand: () => void;
  onCollapse: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o ruta…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExpand} className="h-10 gap-1.5">
          <IconChevronsDown className="size-4" />
          Expandir
        </Button>
        <Button variant="outline" size="sm" onClick={onCollapse} className="h-10 gap-1.5">
          <IconChevronsUp className="size-4" />
          Colapsar
        </Button>
      </div>
    </div>
  );
}
