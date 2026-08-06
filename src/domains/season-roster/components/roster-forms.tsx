"use client";

import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { IconPlayerPlay, IconPlus } from "@/shared/ui/tabler-icons";

import type { BnetCharacter, ClassSpecsMap } from "../lib/constants";
import { PROFESSION_LIST, getSpecDisplayName } from "../lib/constants";
import { saveMyEntry, adminAddManualEntry } from "../lib/server";
import { getSpecsForClassId } from "./season-roster.utils";

// ──────────────────────────────────────────────
// My Entry Form (shown when user has no entry)
// ──────────────────────────────────────────────

function MyEntryForm({
	myBnetCharacters,
	specsByClass,
	classNames,
	onSaved,
}: {
	myBnetCharacters: BnetCharacter[];
	specsByClass: ClassSpecsMap;
	classNames: Record<number, string>;
	onSaved: () => void;
}) {
	const [selectedCharId, setSelectedCharId] = useState<string>("");
	const [mainSpec, setMainSpec] = useState("");
	const [offSpec, setOffSpec] = useState("");
	const [prof1, setProf1] = useState("");
	const [prof2, setProf2] = useState("");
	const [saving, setSaving] = useState(false);

	const selectedChar = myBnetCharacters.find((c) => c.id === selectedCharId);
	const specs = selectedChar
		? getSpecsForClassId(selectedChar.class_id, specsByClass)
		: [];
	const className = selectedChar
		? (classNames[selectedChar.class_id] ?? "")
		: "";
	const canSave = selectedCharId && mainSpec;

	const handleSave = async () => {
		if (!canSave) return;
		setSaving(true);

		const result = await saveMyEntry({
			bnet_character_id: selectedCharId,
			main_spec: mainSpec,
			off_spec: offSpec || undefined,
			profession_1: prof1 || undefined,
			profession_2: prof2 || undefined,
		});

		setSaving(false);

		if (result.ok) {
			toast.success("¡Registrado en Season 2!");
			onSaved();
		} else {
			toast.error(result.error);
		}
	};

	return (
		<div className="border border-white/10 rounded-2xl p-4 md:p-6 bg-zinc-900/50 backdrop-blur-sm">
			<h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
				<IconPlayerPlay className="size-5 text-blue-400" />
				Tu personaje para Season 2
			</h3>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{/* Character selector */}
				<div className="space-y-1.5">
					<label
						htmlFor="my-char-trigger"
						className="text-[10px] uppercase tracking-widest text-zinc-300 font-semibold"
					>
						Personaje
					</label>
					<Select value={selectedCharId} onValueChange={setSelectedCharId}>
						<SelectTrigger
							id="my-char-trigger"
							className="w-full bg-white/5 border-white/10"
						>
							<SelectValue placeholder="Elige tu personaje..." />
						</SelectTrigger>
						<SelectContent>
							{myBnetCharacters.map((c) => (
								<SelectItem key={c.id} value={c.id}>
									{c.name} · {classNames[c.class_id] ?? `Clase ${c.class_id}`} ·{" "}
									{c.realm}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Class (auto) */}
				<div className="space-y-1.5">
					<span className="text-[10px] uppercase tracking-widest text-zinc-300 font-semibold">
						Clase
					</span>
					<div className="h-10 flex items-center px-3 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-zinc-200">
						{className || "Selecciona un personaje"}
					</div>
				</div>

				{/* Main Spec */}
				<div className="space-y-1.5">
					<label
						htmlFor="my-main-spec-trigger"
						className="text-[10px] uppercase tracking-widest text-zinc-300 font-semibold"
					>
						Especialización principal *
					</label>
					<Select
						value={mainSpec}
						onValueChange={setMainSpec}
						disabled={!selectedChar}
					>
						<SelectTrigger
							id="my-main-spec-trigger"
							className="w-full bg-white/5 border-white/10"
						>
							<SelectValue
								placeholder={
									selectedChar ? "Elegir..." : "Primero elige personaje"
								}
							/>
						</SelectTrigger>
						<SelectContent>
							{specs.map((s) => (
								<SelectItem key={s.spec_name} value={s.spec_name}>
									{getSpecDisplayName(s.spec_name)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Off Spec */}
				<div className="space-y-1.5">
					<label
						htmlFor="my-off-spec-trigger"
						className="text-[10px] uppercase tracking-widest text-zinc-300 font-semibold"
					>
						Especialización secundaria
					</label>
					<Select
						value={offSpec}
						onValueChange={setOffSpec}
						disabled={!selectedChar || !mainSpec}
					>
						<SelectTrigger
							id="my-off-spec-trigger"
							className="w-full bg-white/5 border-white/10"
						>
							<SelectValue placeholder="Ninguna" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="(ninguna)">—</SelectItem>
							{specs.flatMap((s) =>
								s.spec_name !== mainSpec
									? [
											<SelectItem key={s.spec_name} value={s.spec_name}>
												{getSpecDisplayName(s.spec_name)}
											</SelectItem>,
										]
									: [],
							)}
						</SelectContent>
					</Select>
				</div>

				{/* Profession 1 */}
				<div className="space-y-1.5">
					<label
						htmlFor="my-prof-1-trigger"
						className="text-[10px] uppercase tracking-widest text-zinc-300 font-semibold"
					>
						Profesión principal
					</label>
					<Select value={prof1} onValueChange={setProf1}>
						<SelectTrigger
							id="my-prof-1-trigger"
							className="w-full bg-white/5 border-white/10"
						>
							<SelectValue placeholder="Elegir..." />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="(ninguna)">—</SelectItem>
							{PROFESSION_LIST.map((p) => (
								<SelectItem key={p} value={p}>
									{p}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Profession 2 */}
				<div className="space-y-1.5">
					<label
						htmlFor="my-prof-2-trigger"
						className="text-[10px] uppercase tracking-widest text-zinc-300 font-semibold"
					>
						Profesión secundaria
					</label>
					<Select value={prof2} onValueChange={setProf2}>
						<SelectTrigger
							id="my-prof-2-trigger"
							className="w-full bg-white/5 border-white/10"
						>
							<SelectValue placeholder="Elegir..." />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="(ninguna)">—</SelectItem>
							{PROFESSION_LIST.map((p) => (
								<SelectItem key={p} value={p}>
									{p}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="mt-4 flex justify-end gap-3">
				<Button
					variant="outline"
					onClick={onSaved}
					className="border-white/10 text-zinc-300"
				>
					Cancelar
				</Button>
				<Button
					onClick={() => void handleSave()}
					disabled={!canSave || saving}
					className="bg-blue-600 hover:bg-blue-500 text-white"
				>
					{saving ? "Guardando..." : "Guardar en Roster"}
				</Button>
			</div>
		</div>
	);
}

// ──────────────────────────────────────────────
// Manual Entry Form (officers add any character)
// ──────────────────────────────────────────────

function ManualEntryForm({
	specsByClass,
	classNames,
	onSaved,
}: {
	specsByClass: ClassSpecsMap;
	classNames: Record<number, string>;
	onSaved: () => void;
}) {
	const [characterName, setCharacterName] = useState("");
	const [realmSlug, setRealmSlug] = useState("");
	const [classId, setClassId] = useState(0);
	const [mainSpec, setMainSpec] = useState("");
	const [offSpec, setOffSpec] = useState("");
	const [prof1, setProf1] = useState("");
	const [prof2, setProf2] = useState("");
	const [saving, setSaving] = useState(false);
	const specs = classId ? getSpecsForClassId(classId, specsByClass) : [];
	const canSave =
		characterName.trim() && realmSlug.trim() && classId > 0 && mainSpec;

	const handleSave = async () => {
		if (!canSave) return;
		setSaving(true);
		const result = await adminAddManualEntry({
			character_name: characterName.trim(),
			realm_slug: realmSlug.trim(),
			class_id: classId,
			main_spec: mainSpec,
			off_spec: offSpec || undefined,
			profession_1: prof1 || undefined,
			profession_2: prof2 || undefined,
		});
		setSaving(false);
		if (result.ok) {
			toast.success("Personaje añadido al roster");
			onSaved();
		} else {
			toast.error(result.error);
		}
	};

	return (
		<div className="border border-white/10 rounded-2xl p-4 md:p-6 bg-zinc-900/50 backdrop-blur-sm">
			<h3 className="text-lg font-semibold text-white/90 mb-4 flex items-center gap-2">
				<IconPlus className="size-5 text-sky-400" />
				Añadir personaje manualmente
			</h3>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div className="space-y-1.5">
					<label
						htmlFor="manual-char-name"
						className="text-[10px] uppercase tracking-widest text-zinc-300 font-semibold"
					>
						Nombre del personaje *
					</label>
					<input
						id="manual-char-name"
						type="text"
						value={characterName}
						onChange={(e) => setCharacterName(e.target.value)}
						placeholder="Ej: Zatoshi"
						className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
					/>
				</div>
				<div className="space-y-1.5">
					<label
						htmlFor="manual-realm"
						className="text-[10px] uppercase tracking-widest text-zinc-300 font-semibold"
					>
						Reino *
					</label>
					<input
						id="manual-realm"
						type="text"
						value={realmSlug}
						onChange={(e) => setRealmSlug(e.target.value)}
						placeholder="Ej: dun-modr"
						className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
					/>
				</div>
				<div className="space-y-1.5">
					<label
						htmlFor="manual-class-trigger"
						className="text-[10px] uppercase tracking-widest text-zinc-300 font-semibold"
					>
						Clase *
					</label>
					<Select
						value={classId ? String(classId) : ""}
						onValueChange={(v) => {
							setClassId(Number(v));
							setMainSpec("");
							setOffSpec("");
						}}
					>
						<SelectTrigger
							id="manual-class-trigger"
							className="w-full bg-white/5 border-white/10"
						>
							<SelectValue placeholder="Selecciona clase..." />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(classNames).map(([id, name]) => (
								<SelectItem key={id} value={id}>
									{name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1.5">
					<label
						htmlFor="manual-main-spec-trigger"
						className="text-[10px] uppercase tracking-widest text-zinc-300 font-semibold"
					>
						Especialización principal *
					</label>
					<Select
						value={mainSpec}
						onValueChange={setMainSpec}
						disabled={!classId}
					>
						<SelectTrigger
							id="manual-main-spec-trigger"
							className="w-full bg-white/5 border-white/10"
						>
							<SelectValue
								placeholder={classId ? "Elegir..." : "Primero elige clase"}
							/>
						</SelectTrigger>
						<SelectContent>
							{specs.map((s) => (
								<SelectItem key={s.spec_name} value={s.spec_name}>
									{getSpecDisplayName(s.spec_name)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1.5">
					<label
						htmlFor="manual-off-spec-trigger"
						className="text-[10px] uppercase tracking-widest text-zinc-300 font-semibold"
					>
						Especialización secundaria
					</label>
					<Select
						value={offSpec}
						onValueChange={setOffSpec}
						disabled={!mainSpec}
					>
						<SelectTrigger
							id="manual-off-spec-trigger"
							className="w-full bg-white/5 border-white/10"
						>
							<SelectValue placeholder="Ninguna" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="(ninguna)">—</SelectItem>
							{specs.flatMap((s) =>
								s.spec_name !== mainSpec
									? [
											<SelectItem key={s.spec_name} value={s.spec_name}>
												{getSpecDisplayName(s.spec_name)}
											</SelectItem>,
										]
									: [],
							)}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1.5">
					<label
						htmlFor="manual-prof-1-trigger"
						className="text-[10px] uppercase tracking-widest text-zinc-300 font-semibold"
					>
						Profesión principal
					</label>
					<Select value={prof1} onValueChange={setProf1}>
						<SelectTrigger
							id="manual-prof-1-trigger"
							className="w-full bg-white/5 border-white/10"
						>
							<SelectValue placeholder="Elegir..." />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="(ninguna)">—</SelectItem>
							{PROFESSION_LIST.map((p) => (
								<SelectItem key={p} value={p}>
									{p}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1.5">
					<label
						htmlFor="manual-prof-2-trigger"
						className="text-[10px] uppercase tracking-widest text-zinc-300 font-semibold"
					>
						Profesión secundaria
					</label>
					<Select value={prof2} onValueChange={setProf2}>
						<SelectTrigger
							id="manual-prof-2-trigger"
							className="w-full bg-white/5 border-white/10"
						>
							<SelectValue placeholder="Elegir..." />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="(ninguna)">—</SelectItem>
							{PROFESSION_LIST.map((p) => (
								<SelectItem key={p} value={p}>
									{p}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
			<div className="mt-4 flex justify-end gap-3">
				<Button
					variant="outline"
					onClick={onSaved}
					className="border-white/10 text-zinc-300"
				>
					Cancelar
				</Button>
				<Button
					onClick={() => void handleSave()}
					disabled={!canSave || saving}
					className="bg-sky-600 hover:bg-sky-500 text-white"
				>
					{saving ? "Guardando..." : "Añadir al roster"}
				</Button>
			</div>
		</div>
	);
}

export { MyEntryForm, ManualEntryForm };
