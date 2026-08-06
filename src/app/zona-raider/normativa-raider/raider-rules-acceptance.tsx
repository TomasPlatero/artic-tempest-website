"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconShieldCheck } from "@/shared/ui/tabler-icons";

import { Button } from "@/shared/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";

type RaiderRulesStatus = {
	required: boolean;
	acceptedAt: string | null;
	acceptedVersion: string | null;
	discordHasVerifiedRole: boolean;
	discordRoleError: string | null;
	currentVersion: string;
	roleLevel: string | null;
};

type RaiderRulesAcceptResponse = {
	error?: string;
	acceptedAt?: string;
	roleAssigned?: boolean;
	roleError?: string | null;
};

async function doAcceptRaiderRules(): Promise<{
	success: boolean;
	data?: RaiderRulesAcceptResponse;
	error?: string;
}> {
	try {
		const res = await fetch("/api/raider-rules/accept", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
		});
		if (!res.ok) {
			const errorData = (await res
				.json()
				.catch(() => ({}))) as RaiderRulesAcceptResponse;
			return {
				success: false,
				error: errorData?.error || "No se pudo aceptar la normativa",
			};
		}
		const data = (await res
			.json()
			.catch(() => ({}))) as RaiderRulesAcceptResponse;
		return { success: true, data };
	} catch (err) {
		return {
			success: false,
			error:
				err instanceof Error ? err.message : "No se pudo aceptar la normativa",
		};
	}
}

export function RaiderRulesAcceptance({
	initialStatus,
}: {
	initialStatus: RaiderRulesStatus | null;
}) {
	const router = useRouter();

	const [state, setState] = React.useState({
		checked: Boolean(
			initialStatus?.discordHasVerifiedRole || initialStatus?.acceptedAt,
		),
		acceptedAt: initialStatus?.acceptedAt ?? (null as string | null),
		hasVerifiedRole: Boolean(initialStatus?.discordHasVerifiedRole),
		saving: false,
		error: null as string | null,
		roleError: initialStatus?.discordRoleError ?? (null as string | null),
	});

	if (initialStatus?.discordHasVerifiedRole) {
		return null;
	}

	const handleAccept = async () => {
		setState((prev) => ({ ...prev, saving: true, error: null }));

		const result = await doAcceptRaiderRules();
		if (result.success && result.data) {
			setState((prev) => ({
				...prev,
				acceptedAt: result.data!.acceptedAt ?? new Date().toISOString(),
				hasVerifiedRole: Boolean(result.data!.roleAssigned),
				roleError: result.data!.roleError ?? null,
				checked: true,
			}));

			if (result.data.roleAssigned) {
				router.replace("/zona-raider?tourPrompt=1");
			}
		} else {
			setState((prev) => ({
				...prev,
				error: result.error || "No se pudo aceptar la normativa",
			}));
		}
		setState((prev) => ({ ...prev, saving: false }));
	};

	return (
		<Card className="border-emerald-500/20 bg-emerald-500/[0.03]">
			<CardHeader className="space-y-3">
				<CardTitle className="text-xl uppercase tracking-tight text-white">
					Confirmar lectura y aceptación
				</CardTitle>
				<CardDescription className="text-white/55">
					Esta aceptación se guarda por usuario en este dispositivo. Más
					adelante se podrá enlazar con la gestión automática de Discord.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{state.error ? (
					<div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-100">
						{state.error}
					</div>
				) : null}

				{state.hasVerifiedRole ? (
					<div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">
						Ya has aceptado las normas, podrás ver todos los canales de Discord
						y la Zona Raider.
					</div>
				) : state.acceptedAt && !state.hasVerifiedRole ? (
					<div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100 space-y-3">
						<p>
							Las normas ya están aceptadas, pero aún falta asignar el rol
							Raider-Verificado en Discord.
						</p>
						{state.roleError ? (
							<p className="text-amber-50/80">{state.roleError}</p>
						) : null}
						<Button
							className="w-full h-9 gap-2 px-4 rounded-xl relative group overflow-hidden bg-linear-to-r from-blue-600 via-blue-500 to-violet-600 text-white font-semibold uppercase tracking-widest text-[10px] border border-blue-400/20  hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
							disabled={state.saving}
							onClick={() => void handleAccept()}
						>
							<div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
							<IconShieldCheck className="size-3.5 mr-2 group-hover:scale-110 transition-transform" />
							{state.saving
								? "Reintentando..."
								: "Reintentar asignación del rol"}
						</Button>
					</div>
				) : (
					<>
						<div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-zinc-950/20 p-4">
							<Checkbox
								id="raider-rules-acceptance"
								checked={state.checked}
								onCheckedChange={(value) =>
									setState((prev) => ({ ...prev, checked: value === true }))
								}
							/>
							<div className="space-y-1">
								<Label
									htmlFor="raider-rules-acceptance"
									className="text-sm font-semibold text-white"
								>
									He leído y acepto la normativa de Raider de Artic Tempest
								</Label>
								<p className="text-sm leading-relaxed text-white/55">
									Al marcar esta casilla confirmas que entiendes las normas de
									asistencia, preparación, loot y conducta.
								</p>
							</div>
						</div>

						<Button
							className="w-full h-9 gap-2 px-4 rounded-xl relative group overflow-hidden bg-linear-to-r from-blue-600 via-blue-500 to-violet-600 text-white font-semibold uppercase tracking-widest text-[10px] border border-blue-400/20  hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
							disabled={state.saving || !state.checked}
							onClick={() => void handleAccept()}
						>
							<div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
							<IconShieldCheck className="size-3.5 mr-2 group-hover:scale-110 transition-transform" />
							{state.saving ? "Aceptando..." : "Aceptar normativa"}
						</Button>
					</>
				)}
			</CardContent>
		</Card>
	);
}
