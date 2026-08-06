"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconRefresh } from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";

export function SyncRosterButton({ canEdit }: { canEdit: boolean }) {
	const [syncing, setSyncing] = useState(false);

	if (!canEdit) return null;

	const handleSync = async () => {
		setSyncing(true);
		await fetch("/api/guild/sync", {
			method: "POST",
			credentials: "include",
		})
			.then(async (res) => {
				if (!res.ok) {
					const errData = await res.json().catch(() => ({}));
					toast.error("Error al sincronizar", {
						description: errData.error ?? "Error desconocido",
					});
					return;
				}

				const data = await res.json();

				toast.success("Roster sincronizado", {
					description: `${data.imported} personajes importados de ${data.guild}`,
				});

				// Reload to show updated data
				window.location.reload();
			})
			.catch(() => {
				toast.error("Error de conexión", {
					description: "No se pudo contactar con el servidor",
				});
			})
			.finally(() => {
				setSyncing(false);
			});
	};

	return (
		<Button variant="outline" size="sm" onClick={() => void handleSync()} disabled={syncing}>
			<IconRefresh className={syncing ? "animate-spin" : ""} />
			{syncing ? "Sincronizando..." : "Sincronizar Roster"}
		</Button>
	);
}
