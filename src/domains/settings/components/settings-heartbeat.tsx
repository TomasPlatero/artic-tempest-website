"use client";

import { useState } from "react";
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
	IconPlus,
	IconTrash,
} from "@/shared/ui/tabler-icons";

type ComponentEntry = {
	id: string;
	key: string;
	component_id: string;
};

function toEntries(map: Record<string, string>): ComponentEntry[] {
	const result: ComponentEntry[] = [];
	for (const key of Object.keys(map)) {
		result.push({ id: key, key, component_id: map[key] });
	}
	return result;
}

function entriesToMap(entries: ComponentEntry[]): Record<string, string> {
	const map: Record<string, string> = {};
	for (const e of entries) {
		const key = e.key.trim();
		const componentId = e.component_id.trim();
		if (key && componentId) map[key] = componentId;
	}
	return map;
}

async function putComponents(
	map: Record<string, string>,
): Promise<{ ok: boolean; components: Record<string, string>; error: string }> {
	try {
		const res = await fetch("/api/guild/settings/statuspage", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ components: map }),
		});
		if (!res.ok) {
			const json = (await res.json().catch(() => ({}))) as { error?: string };
			return {
				ok: false,
				components: {},
				error: json.error || `HTTP ${res.status}`,
			};
		}
		const json = (await res.json().catch(() => ({}))) as {
			components?: Record<string, string>;
		};
		return { ok: true, components: json.components ?? {}, error: "" };
	} catch (e) {
		return {
			ok: false,
			components: {},
			error: e instanceof Error ? e.message : "Error al guardar",
		};
	}
}

export function SettingsHeartbeatClient({
	canEdit,
	initialComponents,
}: {
	canEdit: boolean;
	initialComponents: Record<string, string>;
}) {
	const [entries, setEntries] = useState<ComponentEntry[]>(() =>
		toEntries(initialComponents),
	);
	const [saving, setSaving] = useState(false);

	async function handleSave() {
		setSaving(true);
		const result = await putComponents(entriesToMap(entries));
		setSaving(false);

		if (result.ok) {
			toast.success("Componentes guardados");
			setEntries(toEntries(result.components));
		} else {
			toast.error(result.error);
		}
	}

	function addEntry() {
		setEntries((prev) => [
			...prev,
			{ id: `new-${Date.now()}`, key: "", component_id: "" },
		]);
	}

	function updateEntry(id: string, patch: Partial<ComponentEntry>) {
		setEntries((prev) =>
			prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
		);
	}

	function removeEntry(id: string) {
		setEntries((prev) => prev.filter((e) => e.id !== id));
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
						{entries.map((e) => (
							<div key={e.id} className="flex flex-col sm:flex-row gap-2">
								<Input
									value={e.key}
									onChange={(ev) => updateEntry(e.id, { key: ev.target.value })}
									placeholder="clave (ej. web)"
									disabled={!canEdit}
									className="bg-white/5 border-white/10 rounded-xl font-mono sm:w-48"
								/>
								<Input
									value={e.component_id}
									onChange={(ev) =>
										updateEntry(e.id, { component_id: ev.target.value })
									}
									placeholder="component API id"
									disabled={!canEdit}
									className="bg-white/5 border-white/10 rounded-xl font-mono flex-1"
								/>
								<Button
									variant="outline"
									size="icon"
									onClick={() => removeEntry(e.id)}
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
