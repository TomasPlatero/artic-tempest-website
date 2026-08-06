"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
	IconCheck,
	IconClock,
	IconX,
	IconMessageCircle,
	IconInfoCircle,
	IconEdit,
	IconLoader2,
} from "@/shared/ui/tabler-icons";
import { toast } from "sonner";

async function doSaveApplication(
	applicationId: string,
	editedAnswers: Record<string, string>,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/recruitment/applications", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id: applicationId, answers: editedAnswers }),
		});

		if (!res.ok) {
			const json = await res.json().catch(() => ({}));
			return {
				success: false,
				error: json.error || "Error al actualizar la aplicación",
			};
		}

		return { success: true };
	} catch (err) {
		console.error("Error saving answers:", err);
		return { success: false, error: "Error al actualizar la aplicación" };
	}
}

async function doCancelApplication(
	applicationId: string,
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch("/api/recruitment/cancel", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ application_id: applicationId }),
		});

		if (!res.ok) {
			const json = await res.json().catch(() => ({}));
			return {
				success: false,
				error: json.error || "No se pudo cancelar la solicitud",
			};
		}

		return { success: true };
	} catch (err: any) {
		return {
			success: false,
			error: err.message || "No se pudo cancelar la solicitud",
		};
	}
}

import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { CharacterAvatar } from "@/shared/components/character-avatar";
import { isActiveRecruitmentStatus } from "@/domains/recruitment/lib/application-status";

type Answer = {
	id: string;
	question_id: string;
	answer_text: string;
	question: {
		label: string;
		type: string;
	};
};

type Application = {
	id: string;
	status: string;
	created_at: string;
	character_name: string;
	character_realm: string;
	character_class: string;
	character_spec: string;
	answers: Answer[];
};

type ClassConstant = {
	key: string;
	value: string;
	metadata?: { color?: string };
};

type ApplicationStep = {
	key: string;
	label: string;
	description: string;
};

const APPLICATION_STEPS: ApplicationStep[] = [
	{
		key: "pending",
		label: "Solicitud enviada",
		description: "Tu formulario está en cola para revisión inicial.",
	},
	{
		key: "reviewing",
		label: "Revisión",
		description: "Los oficiales están revisando respuestas y perfil.",
	},
	{
		key: "paused",
		label: "En Pausa",
		description: "La entrevista o revisión está temporalmente en espera.",
	},
	{
		key: "interview",
		label: "Entrevista",
		description: "Se coordina una entrevista por chat con oficiales.",
	},
	{
		key: "accepted",
		label: "Resolución",
		description: "Proceso finalizado con decisión del equipo.",
	},
];

const STATUS_CONFIG: Record<
	string,
	{ label: string; color: string; icon: any }
> = {
	pending: {
		label: "Pte. Revisión",
		color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
		icon: IconClock,
	},
	reviewing: {
		label: "En Revisión",
		color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
		icon: IconInfoCircle,
	},
	paused: {
		label: "En Pausa",
		color: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
		icon: IconClock,
	},
	interview: {
		label: "Entrevista",
		color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
		icon: IconMessageCircle,
	},
	accepted: {
		label: "Aceptado",
		color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
		icon: IconCheck,
	},
	simulated: {
		label: "Simulado",
		color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
		icon: IconLoader2,
	},
	rejected: {
		label: "Rechazado",
		color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
		icon: IconX,
	},
	cancelado: {
		label: "Cancelado",
		color: "bg-zinc-700/40 text-zinc-200 border-zinc-500/30",
		icon: IconX,
	},
};

export function ApplicationStatusClient(props: {
	application: Application;
	classConstants: ClassConstant[];
}) {
	return useApplicationStatusClient(props);
}

function useApplicationStatusClient({
	application,
	classConstants,
}: {
	application: Application;
	classConstants: ClassConstant[];
}) {
	const router = useRouter();
	const [isEditing, setIsEditing] = useState(false);
	const [editedAnswers, setEditedAnswers] = useState<Record<string, string>>(
		() =>
			application.answers.reduce(
				(acc, curr) => {
					acc[curr.id] = curr.answer_text;
					return acc;
				},
				{} as Record<string, string>,
			),
	);
	const [isSaving, setIsSaving] = useState(false);

	const classMap = (() => {
		const map = new Map<number, { name: string; color?: string }>();
		classConstants.forEach((c) =>
			map.set(Number(c.key), { name: c.value, color: c.metadata?.color }),
		);
		return map;
	})();

	const config = STATUS_CONFIG[application.status] || STATUS_CONFIG.pending;
	const canEdit = application.status === "pending";
	const canCancel = isActiveRecruitmentStatus(application.status);
	const cls = classMap.get(Number(application.character_class));
	const progress = (() => {
		const stepOrder = APPLICATION_STEPS.map((step) => step.key);
		const normalizedStatus =
			application.status === "simulated" ? "pending" : application.status;
		const statusStepIndex = stepOrder.indexOf(normalizedStatus);
		const currentStepIndex =
			statusStepIndex >= 0 ? statusStepIndex : stepOrder.indexOf("pending");
		const progressPercent =
			normalizedStatus === "rejected" || normalizedStatus === "cancelado"
				? 100
				: Math.max(
						25,
						Math.round(
							((currentStepIndex + 1) / APPLICATION_STEPS.length) * 100,
						),
					);

		return {
			currentStepIndex,
			progressPercent,
			isRejected:
				normalizedStatus === "rejected" || normalizedStatus === "cancelado",
		};
	})();

	const handleSave = async () => {
		setIsSaving(true);

		const result = await doSaveApplication(application.id, editedAnswers);
		setIsSaving(false);

		if (result.success) {
			toast.success("Aplicación actualizada correctamente");
			setIsEditing(false);
			router.refresh();
		} else {
			toast.error(result.error || "Error al actualizar la aplicación");
		}
	};

	const handleCancelApplication = async () => {
		if (!window.confirm("¿Seguro que quieres cancelar tu solicitud?")) return;

		setIsSaving(true);

		const result = await doCancelApplication(application.id);
		setIsSaving(false);

		if (result.success) {
			toast.success("Solicitud cancelada correctamente");
			router.refresh();
		} else {
			toast.error("Error al cancelar la solicitud", {
				description: result.error,
			});
		}
	};

	return (
		<div className="space-y-8 animate-in fade-in duration-700">
			{/* Header / Status Banner */}
			<Card className="bg-zinc-950/40 border-white/5 backdrop-blur-md overflow-hidden">
				<div className={`h-1.5 w-full ${config.color.split(" ")[0]}`} />
				<CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
					<div className="flex items-center gap-6">
						<div
							className={`size-16 rounded-2xl flex items-center justify-center border ${config.color}`}
						>
							<config.icon className="size-8" />
						</div>
						<div>
							<h2 className="text-2xl font-semibold text-white uppercase tracking-tighter">
								Estado: {config.label}
							</h2>
							<p
								className="text-zinc-500 text-sm mt-1 font-medium"
								suppressHydrationWarning
							>
								Enviada el{" "}
								{new Date(application.created_at).toLocaleDateString()} · ID:{" "}
								{application.id.split("-")[0].toUpperCase()}
							</p>
						</div>
					</div>
					<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto md:ml-auto">
						{application.status === "interview" && (
							<Button
								className="rounded-xl h-12 bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold uppercase text-[10px] tracking-[0.15em] shadow-xl shadow-blue-500/20 border-t border-white/20 group justify-center gap-2 px-4 ring-1 ring-white/5"
								asChild
							>
								<Link href="/reclutamiento/apply-en-curso/chat">
									<IconMessageCircle className="size-4 group-hover:translate-x-[-2px] group-hover:rotate-[-10deg] transition-colors duration-300" />
									<span className="truncate">Chat con Oficiales</span>
								</Link>
							</Button>
						)}
						{canEdit && !isEditing && (
							<Button
								variant="glass"
								className="rounded-xl px-6 group"
								onClick={() => setIsEditing(true)}
							>
								<IconEdit className="size-4 mr-2 group-hover:rotate-12 transition-transform" />
								Editar Respuestas
							</Button>
						)}
						{canCancel && (
							<Button
								variant="outline"
								className="rounded-xl px-6 border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
								onClick={() => void handleCancelApplication()}
								disabled={isSaving}
							>
								Cancelar solicitud
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Character Summary */}
				<div className="lg:col-span-1 space-y-6">
					<Card className="bg-zinc-950 border-white/5 overflow-hidden h-full">
						<CardHeader className="bg-white/5 py-4">
							<CardTitle className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
								Tu Personaje
							</CardTitle>
						</CardHeader>
						<CardContent className="p-6 text-center">
							<CharacterAvatar
								name={application.character_name}
								realm={application.character_realm}
								className="mx-auto mb-6 shadow-2xl border-2 border-white/10 ring-4 ring-white/5 rounded-3xl"
								size={128}
							/>
							<h3 className="text-2xl font-semibold text-white leading-none mb-2">
								{application.character_name}
							</h3>
							<p className="text-blue-400 font-bold text-sm uppercase tracking-tight mb-4">
								{application.character_spec}{" "}
								{cls?.name || application.character_class}
							</p>
							<Badge
								variant="outline"
								className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-500 uppercase font-semibold py-1 px-3"
							>
								{application.character_realm}
							</Badge>

							<div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-3">
								<Button
									variant="outline"
									className="w-full rounded-xl text-xs h-10"
									asChild
								>
									<a
										href={`https://raider.io/characters/eu/${application.character_realm.toLowerCase()}/${application.character_name.toLowerCase()}`}
										target="_blank"
										rel="noopener noreferrer"
									>
										Ver Raider.io
									</a>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Answers / Summary */}
				<div className="lg:col-span-2 space-y-6">
					<Card className="bg-zinc-950 border-white/5 overflow-hidden">
						<CardHeader className="bg-white/5 py-4">
							<CardTitle className="text-sm font-semibold uppercase tracking-widest text-zinc-300">
								Progreso de tu Solicitud
							</CardTitle>
						</CardHeader>
						<CardContent className="p-6 space-y-5">
							<div className="flex items-center justify-between gap-4">
								<p className="text-xs text-zinc-400 uppercase tracking-wider font-bold">
									Estado actual:{" "}
									<span className="text-white">{config.label}</span>
								</p>
								<Badge
									variant="outline"
									className="border-white/10 text-zinc-300"
								>
									{progress.progressPercent}% completado
								</Badge>
							</div>

							<div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
								<div
									className="h-full bg-linear-to-r from-blue-500 to-violet-500 transition-transform duration-500 ease-out"
									style={{
										transform: `scaleX(${progress.progressPercent / 100})`,
										transformOrigin: "left",
										width: "100%",
									}}
								/>
							</div>

							<div className="space-y-3">
								{APPLICATION_STEPS.map((step, index) => {
									const isComplete =
										!progress.isRejected && index < progress.currentStepIndex;
									const isCurrent =
										!progress.isRejected && index === progress.currentStepIndex;

									return (
										<div key={step.key} className="flex items-start gap-3">
											<div
												className={`mt-0.5 size-6 rounded-full border flex items-center justify-center shrink-0 ${
													isComplete
														? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
														: isCurrent
															? "bg-blue-500/20 border-blue-500/30 text-blue-400"
															: "bg-zinc-900 border-white/10 text-zinc-500"
												}`}
											>
												{isComplete ? (
													<IconCheck className="size-3.5" />
												) : (
													<span className="text-[10px] font-semibold">
														{index + 1}
													</span>
												)}
											</div>
											<div className="space-y-0.5">
												<p
													className={`text-sm font-semibold ${
														isCurrent ? "text-white" : "text-zinc-300"
													}`}
												>
													{step.label}
												</p>
												<p className="text-xs text-zinc-500">
													{step.description}
												</p>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>

					<Card className="bg-zinc-950 border-white/5 overflow-hidden">
						<CardHeader className="bg-white/5 py-4 flex flex-row items-center justify-between">
							<CardTitle className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
								Resumen de la Aplicación
							</CardTitle>
							{isEditing && (
								<div className="flex gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setIsEditing(false)}
										disabled={isSaving}
									>
										Cancelar
									</Button>
									<Button
										size="sm"
										onClick={() => void handleSave()}
										disabled={isSaving}
									>
										{isSaving && (
											<IconLoader2 className="size-3 mr-2 animate-spin" />
										)}
										Guardar
									</Button>
								</div>
							)}
						</CardHeader>
						<CardContent className="p-0">
							<div className="divide-y divide-white/5">
								{application.answers.map((ans) => (
									<div key={ans.id} className="p-6 space-y-3">
										<Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">
											{ans.question.label}
										</Label>
										{isEditing ? (
											<Textarea
												className="bg-zinc-950/40 border-zinc-800 text-white min-h-[80px] rounded-xl text-sm"
												value={editedAnswers[ans.id]}
												onChange={(e) =>
													setEditedAnswers((prev) => ({
														...prev,
														[ans.id]: e.target.value,
													}))
												}
											/>
										) : (
											<p className="text-zinc-200 text-sm whitespace-pre-wrap leading-relaxed">
												{ans.answer_text}
											</p>
										)}
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					<div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
						<IconInfoCircle className="size-5 text-blue-400 shrink-0" />
						<p className="text-xs text-blue-100/60 leading-normal italic">
							Esta información solo es visible para ti y para los oficiales de
							la hermandad. Si necesitas retirar tu aplicación o tienes dudas,
							puedes hacerlo desde este panel o contactar con un oficial por
							Discord.
						</p>
					</div>
				</div>
			</div>

			<div className="flex justify-center pt-8">
				<Button
					variant="ghost"
					className="text-zinc-500 hover:text-white"
					onClick={() => router.push("/")}
				>
					Volver al Inicio
				</Button>
			</div>
		</div>
	);
}
