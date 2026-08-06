"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/shared/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import {
	IconEdit,
	IconTrash,
	IconCheck,
	IconX,
} from "@/shared/ui/tabler-icons";

import type { RosterEntry, ClassSpecsMap } from "../lib/constants";
import {
	CLASS_COLORS,
	PROFESSION_LIST,
	getProfessionIconUrl,
	getSpecIconUrl,
	getCharacterAvatarUrl,
	getSpecDisplayName,
} from "../lib/constants";
import {
	saveMyEntry,
	deleteMyEntry,
	adminUpdateEntry,
	adminDeleteEntry,
} from "../lib/server";
import {
	getSpecRole,
	getSpecsForClassId,
	hasChanges,
	getRoleLabel,
} from "./season-roster.utils";
import type { EditableFields } from "./season-roster.types";

// ──────────────────────────────────────────────
// Image with fallback
// ──────────────────────────────────────────────

function Img({
	src,
	alt,
	className,
}: {
	src: string;
	alt: string;
	className?: string;
}) {
	const [errored, setErrored] = useState(false);

	if (errored || !src) {
		return (
			<div
				className={`bg-white/10 rounded ${className ?? "size-8"}`}
				aria-label={alt}
			/>
		);
	}

	return (
		<Image
			src={src}
			alt={alt}
			fill
			sizes="32px"
			className={`object-cover ${className ?? ""}`}
			onError={() => setErrored(true)}
		/>
	);
}

// ──────────────────────────────────────────────
// Profession cell (view/edit)
// ──────────────────────────────────────────────

function RosterProfessionCell({
	profession,
	isEditable,
	value,
	onValueChange,
}: {
	profession: string | undefined;
	isEditable: boolean;
	value: string;
	onValueChange: (v: string) => void;
}) {
	if (isEditable) {
		return (
			<Select value={value} onValueChange={onValueChange}>
				<SelectTrigger className="h-9 w-full min-w-[120px] bg-white/5 border-white/10 text-sm">
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
		);
	}

	return (
		<div className="flex items-center gap-2">
			<div className="relative size-5 shrink-0 overflow-hidden rounded border border-white/10 bg-zinc-800">
				<Img
					src={profession ? getProfessionIconUrl(profession) : ""}
					alt={profession ?? ""}
					className="size-full"
				/>
			</div>
			<span className="text-sm text-zinc-200">{profession || "—"}</span>
		</div>
	);
}

// ──────────────────────────────────────────────
// Row action buttons
// ──────────────────────────────────────────────

function RosterRowActions({
	isOwn,
	canEdit,
	editing,
	saving,
	changed,
	onStartEdit,
	onSave,
	onCancelEdit,
	onDelete,
}: {
	isOwn: boolean;
	canEdit: boolean;
	editing: boolean;
	saving: boolean;
	changed: boolean;
	onStartEdit: () => void;
	onSave: () => void;
	onCancelEdit: () => void;
	onDelete: () => void;
}) {
	const isEditable = editing && canEdit;
	const showViewActions = (isOwn || canEdit) && !editing;

	return (
		<td className="p-2 sm:p-3 md:p-4 text-right align-middle">
			<div className="flex flex-col sm:flex-row items-end sm:items-center sm:justify-end gap-0.5 sm:gap-1">
				{showViewActions && (
					<Button
						variant="ghost"
						size="icon"
						className="size-7 sm:size-8 text-zinc-300 hover:text-white"
						onClick={onStartEdit}
						disabled={saving}
					>
						<IconEdit className="size-3.5 sm:size-4" />
					</Button>
				)}

				{isEditable && (
					<>
						<Button
							variant="ghost"
							size="icon"
							className="size-7 sm:size-8 text-blue-500 hover:text-blue-400"
							onClick={onSave}
							disabled={saving || !changed}
						>
							<IconCheck className="size-3.5 sm:size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="size-7 sm:size-8 text-zinc-300 hover:text-zinc-200"
							onClick={onCancelEdit}
							disabled={saving}
						>
							<IconX className="size-3.5 sm:size-4" />
						</Button>
					</>
				)}

				{showViewActions && (
					<Button
						variant="ghost"
						size="icon"
						className="size-7 sm:size-8 text-red-500 hover:text-red-400 opacity-60 hover:opacity-100"
						onClick={onDelete}
						disabled={saving}
					>
						<IconTrash className="size-3.5 sm:size-4" />
					</Button>
				)}
			</div>
		</td>
	);
}

// ──────────────────────────────────────────────
// Row component
// ──────────────────────────────────────────────

function RosterRow({
	entry,
	classNames,
	specsByClass,
	isOwn,
	canEdit,
}: {
	entry: RosterEntry;
	classNames: Record<number, string>;
	specsByClass: ClassSpecsMap;
	isOwn: boolean;
	canEdit: boolean;
}) {
	const router = useRouter();
	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [fields, setFields] = useState<EditableFields>({
		main_spec: entry.main_spec,
		off_spec: entry.off_spec ?? "",
		profession_1: entry.profession_1 ?? "",
		profession_2: entry.profession_2 ?? "",
	});

	const specs = getSpecsForClassId(entry.class_id, specsByClass);
	const className = classNames[entry.class_id] ?? "Desconocida";
	const isEditable = editing && canEdit;
	const changed = hasChanges(entry, fields);

	const handleSave = async () => {
		if (!changed) {
			setEditing(false);
			return;
		}

		setSaving(true);
		const payload = {
			main_spec: fields.main_spec,
			off_spec: fields.off_spec || undefined,
			profession_1: fields.profession_1 || undefined,
			profession_2: fields.profession_2 || undefined,
		};

		let result;
		if (isOwn) {
			if (!entry.bnet_character_id) return;
			result = await saveMyEntry({
				entry_id: entry.id,
				bnet_character_id: entry.bnet_character_id,
				...payload,
			});
		} else {
			result = await adminUpdateEntry(entry.id, payload);
		}

		setSaving(false);

		if (result.ok) {
			toast.success(isOwn ? "Roster actualizado" : "Entrada actualizada");
			setEditing(false);
			router.refresh();
		} else {
			toast.error(result.error);
		}
	};

	const handleDelete = async () => {
		if (!confirm("¿Eliminar esta entrada del roster?")) return;

		setSaving(true);
		const result = isOwn
			? await deleteMyEntry(entry.id)
			: await adminDeleteEntry(entry.id);
		setSaving(false);

		if (result.ok) {
			toast.success("Entrada eliminada");
			router.refresh();
		} else {
			toast.error(result.error);
		}
	};

	const cancelEdit = () => {
		setFields({
			main_spec: entry.main_spec,
			off_spec: entry.off_spec ?? "",
			profession_1: entry.profession_1 ?? "",
			profession_2: entry.profession_2 ?? "",
		});
		setEditing(false);
	};

	const startEdit = () => {
		setEditing(true);
	};

	return (
		<tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
			{/* Character */}
			{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
			<td className="p-2 sm:p-3 md:p-4">
				<div className="flex items-center gap-2 sm:gap-3">
					<div className="relative size-7 sm:size-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-800">
						<Img
							src={
								entry.thumbnail_url ??
								getCharacterAvatarUrl(entry.realm_slug, entry.character_name)
							}
							alt={entry.character_name}
							className="size-full"
						/>
					</div>
					<div className="flex flex-col min-w-0">
						<span className="font-semibold text-white/90 text-xs sm:text-sm leading-none truncate">
							{entry.character_name}
						</span>
						<span className="text-[9px] sm:text-[10px] text-zinc-300 mt-0.5 truncate">
							{entry.realm}
						</span>
					</div>
				</div>
			</td>

			{/* Role */}
			<td className="hidden sm:table-cell p-3 md:p-4">
				<span className="text-sm text-zinc-300">
					{getRoleLabel(
						getSpecRole(entry.class_id, entry.main_spec, specsByClass),
					)}
				</span>
			</td>

			{/* Class */}
			{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
			<td className="p-2 sm:p-3 md:p-4">
				<div className="flex items-center gap-1.5 sm:gap-2">
					<div className="relative size-5 sm:size-6 shrink-0 overflow-hidden rounded border border-white/10 bg-zinc-800">
						<Image
							src={`/assets/images/classes/${entry.class_id}.webp`}
							alt={className}
							fill
							sizes="24px"
							className="object-cover"
						/>
					</div>
					<span
						className="text-xs sm:text-sm font-medium"
						style={{ color: CLASS_COLORS[entry.class_id] ?? "#A8A29E" }}
					>
						{className}
					</span>
				</div>
			</td>

			{/* Main Spec */}
			{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
			<td className="p-2 sm:p-3 md:p-4">
				{isEditable ? (
					<Select
						value={fields.main_spec}
						onValueChange={(v) => setFields((f) => ({ ...f, main_spec: v }))}
					>
						<SelectTrigger className="h-8 sm:h-9 w-full min-w-[100px] sm:min-w-[120px] bg-white/5 border-white/10 text-xs sm:text-sm">
							<SelectValue placeholder="Elegir..." />
						</SelectTrigger>
						<SelectContent>
							{specs.map((s) => (
								<SelectItem key={s.spec_name} value={s.spec_name}>
									{getSpecDisplayName(s.spec_name)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<div className="flex items-center gap-1.5 sm:gap-2">
						<div className="relative size-4 sm:size-5 shrink-0 overflow-hidden rounded border border-white/10 bg-zinc-800">
							<Img
								src={getSpecIconUrl(entry.class_id, entry.main_spec) ?? ""}
								alt={entry.main_spec}
								className="size-full"
							/>
						</div>
						<span className="text-xs sm:text-sm text-zinc-100">
							{getSpecDisplayName(entry.main_spec)}
						</span>
					</div>
				)}
			</td>

			{/* Off Spec */}
			{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
			<td className="hidden sm:table-cell p-3 md:p-4">
				{isEditable ? (
					<Select
						value={fields.off_spec}
						onValueChange={(v) => setFields((f) => ({ ...f, off_spec: v }))}
					>
						<SelectTrigger className="h-9 w-full min-w-[120px] bg-white/5 border-white/10 text-sm">
							<SelectValue placeholder="Ninguna" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="(ninguna)">—</SelectItem>
							{specs.flatMap((s) =>
								s.spec_name !== fields.main_spec
									? [
											<SelectItem key={s.spec_name} value={s.spec_name}>
												{getSpecDisplayName(s.spec_name)}
											</SelectItem>,
										]
									: [],
							)}
						</SelectContent>
					</Select>
				) : (
					<div className="flex items-center gap-2">
						<div className="relative size-5 shrink-0 overflow-hidden rounded border border-white/10 bg-zinc-800">
							<Img
								src={
									entry.off_spec
										? (getSpecIconUrl(entry.class_id, entry.off_spec) ?? "")
										: ""
								}
								alt={entry.off_spec ?? ""}
								className="size-full"
							/>
						</div>
						<span className="text-sm text-zinc-200">
							{entry.off_spec ? getSpecDisplayName(entry.off_spec) : "—"}
						</span>
					</div>
				)}
			</td>

			{/* Profession 1 */}
			<td className="hidden md:table-cell p-3 md:p-4">
				<RosterProfessionCell
					profession={entry.profession_1 ?? undefined}
					isEditable={isEditable}
					value={fields.profession_1}
					onValueChange={(v) => setFields((f) => ({ ...f, profession_1: v }))}
				/>
			</td>

			{/* Profession 2 */}
			<td className="hidden md:table-cell p-3 md:p-4">
				<RosterProfessionCell
					profession={entry.profession_2 ?? undefined}
					isEditable={isEditable}
					value={fields.profession_2}
					onValueChange={(v) => setFields((f) => ({ ...f, profession_2: v }))}
				/>
			</td>

			{/* Actions */}
			<RosterRowActions
				isOwn={isOwn}
				canEdit={canEdit}
				editing={editing}
				saving={saving}
				changed={changed}
				onStartEdit={startEdit}
				onSave={() => void handleSave()}
				onCancelEdit={cancelEdit}
				onDelete={() => void handleDelete()}
			/>
		</tr>
	);
}

export { Img, RosterProfessionCell, RosterRowActions, RosterRow };
