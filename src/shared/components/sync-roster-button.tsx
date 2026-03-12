"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconRefresh } from "@tabler/icons-react";
import { Button } from "@/shared/ui/button";

export function SyncRosterButton({ canEdit }: { canEdit: boolean }) {
  const [syncing, setSyncing] = useState(false);

  if (!canEdit) return null;

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/guild/sync", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error("Error al sincronizar", {
          description: data.error ?? "Error desconocido",
        });
        return;
      }

      toast.success("Roster sincronizado", {
        description: `${data.imported} personajes importados de ${data.guild}`,
      });

      // Reload to show updated data
      window.location.reload();
    } catch {
      toast.error("Error de conexión", {
        description: "No se pudo contactar con el servidor",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
      <IconRefresh className={syncing ? "animate-spin" : ""} />
      {syncing ? "Sincronizando..." : "Sincronizar Roster"}
    </Button>
  );
}
