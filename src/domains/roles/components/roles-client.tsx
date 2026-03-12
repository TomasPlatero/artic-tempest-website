"use client";

import { useState } from "react";
import { IconTrash, IconPlus, IconShield } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

export type DiscordRoleMapping = {
  id: string;
  discord_role_id: string;
  role_name: string;
  app_role: string;
};

export function RolesClient({
  initialMappings,
}: {
  initialMappings: DiscordRoleMapping[];
}) {
  const [mappings, setMappings] = useState(initialMappings);
  const [loading, setLoading] = useState(false);

  const [newRoleId, setNewRoleId] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newAppRole, setNewAppRole] = useState("raider");

  const handleCreate = async () => {
    if (!newRoleId || !newRoleName) {
      toast.error("Campos incompletos", {
        description: "El ID del rol y el nombre son obligatorios.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/guild/roles/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discord_role_id: newRoleId,
          role_name: newRoleName,
          app_role: newAppRole,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMappings([data.mapping, ...mappings]);
      setNewRoleId("");
      setNewRoleName("");
      setNewAppRole("raider");
      toast.success("Mapeo guardado", {
        description: "El rol se ha añadido correctamente.",
      });
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/guild/roles/discord?roleId=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setMappings(mappings.filter((m) => m.id !== id));
      toast.success("Mapeo eliminado");
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    }
  };

  const roleColors: Record<string, string> = {
    gm: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    officer: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    raider: "bg-green-500/10 text-green-500 border-green-500/20",
    member: "bg-muted text-muted-foreground",
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-4 items-end bg-card p-4 rounded-lg border shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium">Discord Role ID</label>
          <Input
            placeholder="Ej. 112233445566778899"
            value={newRoleId}
            onChange={(e) => setNewRoleId(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Nombre (Informativo)</label>
          <Input
            placeholder="Ej. Oficiales"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Permiso en la App</label>
          <Select value={newAppRole} onValueChange={setNewAppRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gm">Guild Master (Máximo)</SelectItem>
              <SelectItem value="officer">Officer (Ver Roster)</SelectItem>
              <SelectItem value="raider">Raider (Estándar)</SelectItem>
              <SelectItem value="member">Member (Básico)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate} disabled={loading} className="w-full">
          <IconPlus className="mr-2 size-4" />
          Añadir Mapeo
        </Button>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Nombre del Rol</TableHead>
              <TableHead>Discord ID</TableHead>
              <TableHead>Permiso App</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappings.length > 0 ? (
              mappings.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <IconShield className="size-4 text-muted-foreground" />
                      {m.role_name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {m.discord_role_id}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={roleColors[m.app_role]}>
                      {m.app_role.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(m.id)}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay roles mapeados. Añade uno arriba.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
