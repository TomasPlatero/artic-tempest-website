"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Checkbox } from "@/shared/ui/checkbox";
import {
	IconArrowLeft,
	IconDeviceFloppy,
	IconShieldCheck,
} from "@/shared/ui/tabler-icons";
import { cn } from "@/shared/tailwind/tailwind-utils";
import type { AppPage } from "@/app/api/pages/route";

type RoleRow = {
	level: string;
	label: string;
	color: string | null;
	priority: number;
	is_super_admin: boolean;
	is_admin: boolean;
};

async function doSavePage(
	id: string,
	name: string,
	roleLevels: string[],
): Promise<{ success: boolean; error?: string }> {
	try {
		const res = await fetch(`/api/pages/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: name.trim(), roleLevels }),
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error(err.error || "Error al guardar");
		}
		return { success: true };
	} catch (error: any) {
		return { success: false, error: error.message || "No se pudo guardar" };
	}
}

export function PageEditorClient({
	page,
	roles,
	initialViewRoles,
}: {
	page: AppPage;
	roles: RoleRow[];
	initialViewRoles: Set<string>;
}) {
	const router = useRouter();
	const [name, setName] = useState(() => page.name);
	const [viewRoles, setViewRoles] = useState(initialViewRoles);
	const [saving, setSaving] = useState(false);
	const [dirty, setDirty] = useState(false);

	const toggleRole = (level: string) => {
		setViewRoles((prev) => {
			const next = new Set(prev);
			if (next.has(level)) next.delete(level);
			else next.add(level);
			return next;
		});
		setDirty(true);
	};

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error("El nombre no puede estar vacío");
			return;
		}

		setSaving(true);
		const result = await doSavePage(page.id, name, [...viewRoles]);
		if (result.success) {
			toast.success("Página actualizada");
			setDirty(false);
			router.refresh();
		} else {
			toast.error(result.error);
		}
		setSaving(false);
	};

	return (
		<div className="flex flex-col gap-6 p-4 md:p-6 lg:px-8 w-full max-w-full">
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					asChild
					className="gap-2 text-white/60 hover:text-white"
				>
					<Link href="/zona-raider/configuracion/pages">
						<IconArrowLeft className="size-4" /> Volver a páginas
					</Link>
				</Button>
			</div>

			<div className="grid gap-6">
				{/* ── Page info card ── */}
				<div className="rounded-3xl border border-white/10 bg-[linear-gradient(130deg,rgba(15,23,42,0.85),rgba(2,6,23,0.92))] p-6">
					<div className="flex flex-col gap-2 mb-4">
						<p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
							{page.is_admin
								? "Página de administración"
								: "Página de Zona Raider"}
						</p>
						<p className="text-xs text-white/30 font-mono">{page.path}</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="page-name">Título</Label>
						<Input
							id="page-name"
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								setDirty(true);
							}}
							className="bg-white/5 border-white/10 text-white"
						/>
						<p className="text-[11px] text-white/40">
							Nombre visible en la navegación y listados.
						</p>
					</div>
				</div>

				{/* ── Role permissions card — solo para páginas no-admin ── */}
				{!page.is_admin && (
					<div className="rounded-3xl border border-white/10 bg-[linear-gradient(130deg,rgba(15,23,42,0.85),rgba(2,6,23,0.92))] p-6">
						<h2 className="text-lg font-semibold text-white mb-1">
							Roles con acceso
						</h2>
						<p className="text-sm text-white/50 mb-6">
							Marca qué roles pueden ver esta página.
						</p>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{roles.map((role) => {
								const checked = viewRoles.has(role.level);
								const isAdminRole = role.is_admin || role.is_super_admin;
								return (
									<button
										key={role.level}
										className={cn(
											"flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
											checked
												? "border-emerald-500/50 bg-emerald-500/10"
												: "border-white/10 hover:border-white/30",
										)}
										onClick={() => toggleRole(role.level)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												toggleRole(role.level);
											}
										}}
									>
										<Checkbox
											checked={checked}
											className="border-white/30 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
										/>
										<div className="flex flex-col">
											<span
												className="text-sm font-semibold"
												style={{ color: role.color ?? undefined }}
											>
												{role.label}
											</span>
											<span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">
												{role.level}
												{isAdminRole && (
													<Badge
														variant="outline"
														className="ml-2 text-[9px] px-1.5 py-0 h-4 border-sky-500/30 text-sky-300"
													>
														Admin
													</Badge>
												)}
											</span>
										</div>
									</button>
								);
							})}
						</div>
					</div>
				)}

				{/* ── Admin page notice ── */}
				{page.is_admin && (
					<div className="rounded-3xl border border-sky-500/20 bg-sky-500/10 p-6">
						<div className="flex items-center gap-3">
							<IconShieldCheck className="size-5 text-sky-400 shrink-0" />
							<p className="text-sm text-sky-200 font-semibold">
								Acceso controlado por el rol
							</p>
						</div>
						<p className="text-xs text-white/50 mt-2">
							El acceso a esta página está gestionado por el permiso{" "}
							<strong>Administrador</strong> en los ajustes del rol. No es
							necesario configurar permisos individuales aquí.
						</p>
					</div>
				)}

				{/* ── Save ── */}
				<div className="flex justify-end">
					<Button
						onClick={() => void handleSave()}
						disabled={!dirty || saving}
						className="gap-2"
					>
						<IconDeviceFloppy className="size-4" />
						{saving ? "Guardando…" : "Guardar cambios"}
					</Button>
				</div>
			</div>
		</div>
	);
}
