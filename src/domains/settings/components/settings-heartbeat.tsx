"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import {
	IconActivity,
	IconLoader2,
	IconPlus,
	IconTrash,
} from "@/shared/ui/tabler-icons";

type ComponentEntry = {
	key: string;
	component_id: string;
};

export function SettingsHeartbeatClient({ canEdit }: { canEdit: boolean }) {
	const [entries, setEntries] = useState<ComponentEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		void loadComponents();
	}, []);

	async function loadComponents() {
		setLoading(true);
		try {
			const res = await fetch("/api/guild/settings/statuspage", {
				cache: "no-store",
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			const map = (json.components ?? {}) as Record<string, string>;
			setEntries(
				Object.entries(map).map(([key, component_id]) => ({
					key,
					component_id,
				})),
			);
		} catch {
			toast.error("No se pudieron cargar los componentes");
		} finally {
			setLoading(false);
		}
	}

	async function handleSave() {
		setSaving(true);
		const map: Record<string, string> = {};
		for (const e of entries) {
			const k = e.key.trim();
			const id = e.component_id.trim();
			if (k && id) map[k] = id;
		}

		try {
			const res = await fetch("/api/guild/settings/statuspage", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ components: map }),
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
			toast.success("Componentes guardados");
			setEntries(
				Object.entries(map).map(([key, component_id]) => ({
					key,
					component_id,
				})),
			);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Error al guardar");
		} finally {
			setSaving(false);
		}
	}

	function addEntry() {
		setEntries((prev) => [...prev, { key: "", component_id: "" }]);
	}

	function updateEntry(index: number, patch: Partial<ComponentEntry>) {
		setEntries((prev) =>
			prev.map((e, i) => (i === index ? { ...e, ...patch } : e)),
		);
	}

	function removeEntry(index: number) {
		setEntries((prev) => prev.filter((_, i) => i !== index));
	}

	if (loading) {
		return (
			<Card className="bg-white/5 border-white/10">
				<CardContent className="py-8 flex items-center justify-center gap-2 text-zinc-400 text-sm">
					<IconLoader2 className="size-4 animate-spin" />
					Cargando componentes...
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="bg-white/5 border-white/10">
			<CardHeader>
				<CardTitle className="text-xl font-semibold flex items-center gap-2">
					<IconActivity className="size-5 text-emerald-400" />
					Componentes de Statuspage
				</CardTitle>
				<CardDescription>
					Mapa de componentes que los crons enlazan a Statuspage. La clave (ej.
					&quot;web&quot;, &quot;recruitment&quot;) es la que usa el cron; el id
					es el Component API ID de Statuspage.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{entries.length === 0 ? (
					<p className="text-sm text-zinc-400">
						Todavía no hay componentes configurados.
					</p>
				) : (
					<div className="space-y-2">
						{entries.map((e, i) => (
							<div key={i} className="flex flex-col sm:flex-row gap-2">
								<Input
									value={e.key}
									onChange={(ev) => updateEntry(i, { key: ev.target.value })}
									placeholder="clave (ej. web)"
									disabled={!canEdit}
									className="bg-white/5 border-white/10 rounded-xl font-mono sm:w-48"
								/>
								<Input
									value={e.component_id}
									onChange={(ev) =>
										updateEntry(i, { component_id: ev.target.value })
									}
									placeholder="component API id"
									disabled={!canEdit}
									className="bg-white/5 border-white/10 rounded-xl font-mono flex-1"
								/>
								<Button
									variant="outline"
									size="icon"
									onClick={() => removeEntry(i)}
									disabled={!canEdit}
									aria-label="Eliminar componente"
									className="border-white/10 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl shrink-0"
								>
									<IconTrash className="size-4" />
								</Button>
							</div>
						))}
					</div>
				)}

				<div className="flex items-center gap-3 pt-1">
					<Button
						variant="outline"
						onClick={addEntry}
						disabled={!canEdit}
						className="border-white/10 hover:bg-white/10 rounded-xl font-semibold"
					>
						<IconPlus className="size-4 mr-2" />
						Añadir componente
					</Button>
					<Button
						onClick={() => void handleSave()}
						disabled={!canEdit || saving}
						className="bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold italic uppercase tracking-tighter"
					>
						{saving ? "Guardando..." : "Guardar"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
