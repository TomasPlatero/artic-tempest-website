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
	IconBrandDiscord,
	IconChecks,
	IconLoader2,
} from "@/shared/ui/tabler-icons";
import { SettingsHeartbeatClient } from "./settings-heartbeat";

type CharacterOption = {
	id: string;
	name: string;
	realm: string;
	level: number;
	class_id: number;
	spec: string;
};

type SelfTestStep = {
	step: string;
	ok: boolean;
	detail?: string;
};

async function doSaveTestChannel(
	channelId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/guild/settings/testing", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ recruitment_test_channel_id: channelId }),
		});

		if (!res.ok) {
			const json = await res.json().catch(() => ({}));
			return {
				success: false,
				error: json.error || "Error al guardar el canal",
			};
		}

		return { success: true };
	} catch (e) {
		return {
			success: false,
			error: e instanceof Error ? e.message : "Error al guardar el canal",
		};
	}
}

async function doRunSelfTest(
	characterId?: string,
): Promise<{ ok: boolean; steps: SelfTestStep[]; error?: string }> {
	try {
		const res = await fetch("/api/recruitment/self-test", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ character_id: characterId }),
		});

		if (!res.ok) {
			const json = await res.json().catch(() => ({}));
			return {
				ok: false,
				steps: [
					{
						step: "self-test",
						ok: false,
						detail: json.error || `HTTP ${res.status}`,
					},
				],
				error: json.error || `HTTP ${res.status}`,
			};
		}

		const json = await res.json().catch(() => ({}));
		return {
			ok: Boolean(json.ok),
			steps: json.steps ?? [],
		};
	} catch (e) {
		const message = e instanceof Error ? e.message : "Error desconocido";
		return {
			ok: false,
			steps: [{ step: "self-test", ok: false, detail: message }],
			error: message,
		};
	}
}

export function SettingsTestingClient({
	initialChannelId,
	characters,
	canEdit,
	canManage,
}: {
	initialChannelId: string;
	characters: CharacterOption[];
	canEdit: boolean;
	canManage: boolean;
}) {
	const [tab, setTab] = useState<"testing" | "heartbeat">("testing");
	const [channelId, setChannelId] = useState(initialChannelId);
	const [savingChannel, setSavingChannel] = useState(false);
	const [selectedCharId, setSelectedCharId] = useState(characters[0]?.id ?? "");
	const [running, setRunning] = useState(false);
	const [steps, setSteps] = useState<SelfTestStep[]>([]);
	const [overall, setOverall] = useState<"idle" | "ok" | "fail">("idle");

	const handleSaveChannel = async () => {
		setSavingChannel(true);
		const result = await doSaveTestChannel(channelId.trim());
		setSavingChannel(false);

		if (result.success) {
			toast.success("Canal de test guardado");
		} else {
			toast.error(result.error || "Error al guardar el canal");
		}
	};

	const handleRunSelfTest = async () => {
		setRunning(true);
		setSteps([]);
		setOverall("idle");

		const result = await doRunSelfTest(selectedCharId || undefined);

		setRunning(false);
		setSteps(result.steps);
		setOverall(result.ok ? "ok" : "fail");

		if (result.ok) {
			toast.success("Prueba completada correctamente");
		} else {
			toast.error(result.error || "La prueba encontró fallos");
		}
	};

	const tabClass = (active: boolean) =>
		`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold italic uppercase tracking-tighter transition-colors ${
			active
				? "bg-blue-600 text-white"
				: "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
		}`;

	return (
		<div className="flex flex-col gap-6">
			{/* Tabs */}
			<div className="flex gap-2">
				<button
					type="button"
					className={tabClass(tab === "testing")}
					onClick={() => setTab("testing")}
				>
					<IconChecks className="size-4" />
					Testing
				</button>
				<button
					type="button"
					className={tabClass(tab === "heartbeat")}
					onClick={() => setTab("heartbeat")}
				>
					<IconActivity className="size-4" />
					Heartbeating
				</button>
			</div>

			{tab === "testing" ? (
				<>
					{/* Canal de test */}
					<Card className="bg-white/5 border-white/10">
						<CardHeader>
							<CardTitle className="text-xl font-semibold flex items-center gap-2">
								<IconBrandDiscord className="size-5 text-[#5865F2]" />
								Canal de Discord de test
							</CardTitle>
							<CardDescription>
								ID del canal donde la prueba publica el mensaje de prueba. No
								toca el canal real de reclutamiento.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col sm:flex-row gap-3">
								<Input
									value={channelId}
									onChange={(e) => setChannelId(e.target.value)}
									placeholder="Ej: 123456789012345678"
									disabled={!canEdit}
									className="bg-white/5 border-white/10 rounded-xl font-mono"
								/>
								<Button
									onClick={() => void handleSaveChannel()}
									disabled={!canEdit || savingChannel}
									className="bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold italic uppercase tracking-tighter"
								>
									{savingChannel ? "Guardando..." : "Guardar canal"}
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Self-test */}
					<Card className="bg-white/5 border-white/10">
						<CardHeader>
							<CardTitle className="text-xl font-semibold flex items-center gap-2">
								<IconChecks className="size-5 text-emerald-400" />
								Prueba de reclutamiento
							</CardTitle>
							<CardDescription>
								Corre el flujo real de solicitud con tu cuenta y un personaje
								vinculado, publica al canal de test y revierte todo al final.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{characters.length > 0 ? (
								<div className="flex flex-col gap-2 max-w-md">
									<label
										htmlFor="self-test-char"
										className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500"
									>
										Personaje de prueba
									</label>
									<select
										id="self-test-char"
										value={selectedCharId}
										onChange={(e) => setSelectedCharId(e.target.value)}
										disabled={running}
										className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
									>
										{characters.map((c) => (
											<option key={c.id} value={c.id} className="bg-zinc-900">
												{c.name} — {c.realm} (nivel {c.level})
											</option>
										))}
									</select>
								</div>
							) : (
								<p className="text-sm text-amber-300">
									No tenés personajes de Battle.net vinculados. Vinculá uno
									antes de ejecutar la prueba.
								</p>
							)}

							<Button
								onClick={() => void handleRunSelfTest()}
								disabled={!canManage || running || characters.length === 0}
								className="bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold italic uppercase tracking-tighter"
							>
								{running ? (
									<IconLoader2 className="size-4 mr-2 animate-spin" />
								) : (
									<IconActivity className="size-4 mr-2" />
								)}
								Ejecutar prueba
							</Button>

							{overall !== "idle" && (
								<div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-2">
									{steps.map((s) => (
										<div
											key={s.step}
											className="flex items-start gap-2 text-sm"
										>
											<span
												className={s.ok ? "text-emerald-400" : "text-rose-400"}
											>
												{s.ok ? "✓" : "✗"}
											</span>
											<div>
												<span className="font-semibold text-white">
													{s.step}
												</span>
												{s.detail ? (
													<span className="text-zinc-400"> — {s.detail}</span>
												) : null}
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</>
			) : (
				<SettingsHeartbeatClient canEdit={canEdit} />
			)}
		</div>
	);
}
