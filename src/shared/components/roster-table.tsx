"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
	IconSettings,
	IconTrash,
	IconCheck,
	IconX,
	IconPencil,
	IconArrowUp,
	IconArrowDown,
	IconArrowsSort,
	IconCircleLetterG,
	IconCircleLetterO,
	IconCircleLetterA,
	IconCircleLetterR,
	IconCircleLetterT,
	IconCircleLetterS,
	IconCircleLetterM,
	IconCircleLetterL,
	IconUser,
} from "@/shared/ui/tabler-icons";
import { cn } from "@/shared/tailwind/tailwind-utils";
import { normalizeRosterRole } from "@/shared/lib/roster-role";
import { openExternalUrl } from "@/shared/lib/external-url";
import { toast } from "sonner";
import {
	updateMemberRole,
	updateMemberRank,
	updateMemberNote,
	deleteMember,
} from "@/domains/roster/lib/server-actions.server";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/shared/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogDescription,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

const DATE_FORMATTER_UTC = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
	timeZone: "UTC",
});

function SyncedAt({ value }: { value: string }) {
	const formatted = (() => {
		const date = new Date(value);
		return Number.isNaN(date.getTime())
			? null
			: DATE_FORMATTER_UTC.format(date);
	})();

	return <>{formatted ?? "—"}</>;
}

export type GuildMember = {
	id: string;
	character_name: string;
	realm_slug: string;
	realm_name: string | null;
	class_id: number | null;
	race_id: number | null;
	level: number;
	rank: number;
	synced_at: string;
	note?: string | null;
	role?: string | null;
	is_plannable?: boolean;
};

const RANK_NAMES: Record<number, string> = {
	0: "Guild Master",
	1: "Oficial",
	2: "Alter Oficial",
	3: "Raid Leader",
	4: "Artic Raider",
	5: "Raider",
	6: "Trial",
	7: "Alter Raider",
	8: "Backup",
	9: "Miembro/familia",
};

const RANK_STYLES: Record<number, { icon: any; color: string }> = {
	0: {
		icon: IconCircleLetterG,
		color: "text-white bg-holo rounded-full p-[0.5px]",
	}, // Guild Master
	1: { icon: IconCircleLetterO, color: "text-[#33937F]" }, // Officer (Evoker Green)
	2: { icon: IconCircleLetterA, color: "text-zinc-400" }, // Officer Alt
	3: { icon: IconCircleLetterL, color: "text-[#808000]" }, // Raid Leader (Olive)
	4: { icon: IconCircleLetterA, color: "text-[#FFD700]" }, // Artic Raider (Gold)
	5: { icon: IconCircleLetterR, color: "text-[#EF4444]" }, // Raider (Red)
	6: { icon: IconCircleLetterT, color: "text-[#3B82F6]" }, // Trial (Blue)
	7: { icon: IconCircleLetterS, color: "text-[#22C55E]" }, // Social (Green)
	8: { icon: IconCircleLetterA, color: "text-zinc-500" }, // Alt
	9: { icon: IconCircleLetterM, color: "text-zinc-500" }, // Member (Zinc)
};

function RankBadge({
	rank,
	name,
	rankColors,
	rankImages,
	className: extraClassName,
}: {
	rank: number;
	name?: string;
	rankColors?: (string | null)[];
	rankImages?: (string | null)[];
	className?: string;
}) {
	const rankImageUrl = rankImages?.[rank] || null;
	const dbColor = rankColors?.[rank];
	const displayName = name || RANK_NAMES[rank] || `Rank ${rank}`;

	if (rankImageUrl) {
		return (
			<div
				className="shrink-0 leading-none inline-flex items-center gap-2"
				title={displayName}
			>
				<Image
					src={rankImageUrl}
					alt={displayName}
					width={24}
					height={24}
					className={cn(
						"size-5 lg:size-6 rounded-md border object-cover shrink-0 bg-black/20",
						extraClassName,
					)}
					style={{
						borderColor: dbColor || "rgba(255,255,255,0.15)",
					}}
				/>
				<span className="hidden lg:inline text-[10px] font-bold uppercase tracking-tight text-foreground/80 whitespace-nowrap">
					{displayName}
				</span>
			</div>
		);
	}

	const style = RANK_STYLES[rank] || { icon: IconUser, color: "text-zinc-500" };
	const Icon = style.icon;

	// Separate color classes from other utility classes (like bg-holo, rounded, etc)
	const classes = style.color.split(" ");
	// We check for text- color if no db color is provided
	const iconStyle = dbColor ? { color: dbColor } : {};
	const className = dbColor
		? classes.filter((c) => !c.startsWith("text-")).join(" ")
		: style.color;

	return (
		<div
			className={cn(
				"shrink-0 leading-none inline-flex items-center gap-2 justify-center",
				className,
				extraClassName,
			)}
			style={iconStyle}
			title={displayName}
		>
			<Icon className="size-8" stroke={2.5} alt={displayName} />
			<span className="hidden lg:inline text-[10px] font-bold uppercase tracking-tight text-foreground/80 whitespace-nowrap">
				{displayName}
			</span>
		</div>
	);
}

type SortColumn = "name" | "realm" | "class" | "rank";
const EMPTY_CLASS_NAMES: Record<number, string> = {};

async function handleRoleChange(memberId: string, name: string, role: string) {
	try {
		await updateMemberRole(memberId, role);
		toast.success(`Rol de ${name} actualizado`);
	} catch (e) {
		toast.error("Error al actualizar el rol");
		console.error(e);
	}
}

async function handleRankChange(
	memberId: string,
	name: string,
	rankId: string,
) {
	try {
		await updateMemberRank(memberId, rankId);
		toast.success(`Rango de ${name} actualizado`);
	} catch (e) {
		toast.error("Error al actualizar el rango");
		console.error(e);
	}
}

const SortIcon = ({
	column,
	sortColumn,
	sortDirection,
}: {
	column: SortColumn;
	sortColumn: SortColumn;
	sortDirection: "asc" | "desc";
}) => {
	if (sortColumn !== column)
		return (
			<IconArrowsSort className="size-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
		);
	return sortDirection === "asc" ? (
		<IconArrowUp className="size-3 text-primary" />
	) : (
		<IconArrowDown className="size-3 text-primary" />
	);
};

export function RosterTable({
	members,
	roleLevel,
	rankNames,
	rankOptions,
	rankColors,
	rankImages,
	classNames = EMPTY_CLASS_NAMES,
	classColors,
	classRoleMapping,
	sortColumn,
	sortDirection,
	onSort,
	canEdit = false,
}: {
	members: GuildMember[];
	sortColumn: SortColumn;
	sortDirection: "asc" | "desc";
	onSort?: (column: SortColumn) => void;
	canEdit?: boolean;
	roleLevel?: string;
	rankNames?: string[];
	rankOptions?: Array<{ rank: number; name: string }>;
	rankColors?: (string | null)[];
	rankImages?: (string | null)[];
	classNames?: Record<number, string>;
	classColors: Record<number, string>;
	classRoleMapping: Record<number, string>;
	raceNames?: Record<number, string>;
}) {
	const canViewNote = canEdit || roleLevel === "gm" || roleLevel === "officer";

	return (
		<div className="w-full">
			<Table>
				<TableHeader className="border-b border-border/40 bg-muted/20">
					<TableRow className="hover:bg-transparent border-0">
						<TableHead
							className="w-[25%] text-muted-foreground font-bold uppercase tracking-widest text-[10px] py-3 pl-4 cursor-pointer hover:bg-muted transition-colors select-none group"
							onClick={() => onSort?.("name")}
						>
							<div className="flex items-center gap-2">
								Nombre{" "}
								<SortIcon
									column="name"
									sortColumn={sortColumn}
									sortDirection={sortDirection}
								/>
							</div>
						</TableHead>
						<TableHead
							className="w-[25%] text-muted-foreground font-bold uppercase tracking-widest text-[10px] py-3 cursor-pointer hover:bg-muted transition-colors select-none group"
							onClick={() => onSort?.("class")}
						>
							<div className="flex items-center justify-center lg:justify-start gap-2">
								Clase{" "}
								<SortIcon
									column="class"
									sortColumn={sortColumn}
									sortDirection={sortDirection}
								/>
							</div>
						</TableHead>
						<TableHead
							className="w-[30%] text-muted-foreground font-bold uppercase tracking-widest text-[10px] py-3 cursor-pointer hover:bg-muted transition-colors select-none group"
							onClick={() => onSort?.("rank")}
						>
							<div className="flex items-center justify-center lg:justify-start gap-2">
								Rango{" "}
								<SortIcon
									column="rank"
									sortColumn={sortColumn}
									sortDirection={sortDirection}
								/>
							</div>
						</TableHead>
						<TableHead className="w-[20%] text-muted-foreground font-bold uppercase tracking-widest text-[10px] text-right pr-4">
							Enlaces / Ajustes
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{members.length > 0 ? (
						members.map((m) => {
							const dbClassColor = classColors[m.class_id ?? 0];
							const currentClass = classNames[m.class_id ?? 0] || "Desconocido";
							const rankName = rankNames?.[m.rank] || RANK_NAMES[m.rank];

							const classIconStyle = dbClassColor
								? { color: dbClassColor }
								: {};
							const classColorClass = dbClassColor ? "" : "text-white";

							return (
								<TableRow
									key={m.id}
									className="border-b border-border/10 hover:bg-[#333340] transition-colors group"
								>
									{/* Name Column */}
									<TableCell className="font-medium pl-4 py-2">
										<span
											className={cn(
												classColorClass,
												"font-bold drop-shadow-sm truncate text-sm",
											)}
											style={classIconStyle}
										>
											{m.character_name}
										</span>
									</TableCell>

									{/* Class Column */}
									<TableCell className="py-2">
										<div className="flex items-center justify-center lg:justify-start gap-2">
											{m.class_id ? (
												<Image
													src={`/assets/images/classes/${m.class_id}.webp`}
													alt={currentClass}
													width={24}
													height={24}
													className="size-5 lg:size-6 rounded shadow-inner border object-cover shrink-0"
													style={{
														borderColor:
															dbClassColor || "rgba(255,255,255,0.1)",
													}}
												/>
											) : (
												<div className="size-5 lg:size-6 rounded bg-[#1e1e24] border border-border/30 shadow-inner shrink-0"></div>
											)}
											<span
												className="hidden lg:inline text-[10px] font-semibold uppercase tracking-tighter bg-muted/40 px-2 py-0.5 rounded border border-border/10 whitespace-nowrap"
												style={classIconStyle}
											>
												{currentClass}
											</span>
										</div>
									</TableCell>

									{/* Rank Column */}
									<TableCell className="py-2">
										<div className="flex items-center justify-center lg:justify-start gap-2">
											<RankBadge
												rank={m.rank}
												name={rankName}
												rankColors={rankColors}
												rankImages={rankImages}
												className="size-5 lg:size-6 shrink-0"
											/>
										</div>
									</TableCell>

									{/* Links & Actions Column */}
									<TableCell className="text-right py-2 pr-4">
										<div className="flex items-center justify-end gap-2">
											<RosterExternalLinks member={m} />

											{canViewNote && (
												<>
													<div className="w-px h-3 bg-border/20 mx-0.5" />
													<Dialog>
														<DialogTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																aria-label="Ajustes del miembro"
																className="size-6 text-muted-foreground hover:text-white hover:bg-muted"
															>
																<IconSettings className="size-3.5" />
															</Button>
														</DialogTrigger>
														<RosterMemberSettingsDialog
															member={m}
															rankNames={rankNames}
															rankOptions={rankOptions}
															classRoleMapping={classRoleMapping}
															canViewNote={canViewNote}
															onRoleChange={handleRoleChange}
															onRankChange={handleRankChange}
														/>
													</Dialog>
												</>
											)}
										</div>
									</TableCell>
								</TableRow>
							);
						})
					) : (
						<TableRow>
							<TableCell
								colSpan={6}
								className="h-24 text-center text-muted-foreground"
							>
								No hay personajes en el roster.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}

function NoteCell({
	memberId,
	initialNote,
	inputId,
}: {
	memberId: string;
	initialNote?: string | null;
	inputId?: string;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [note, setNote] = useState(() => initialNote ?? "");
	const [isSaving, setIsSaving] = useState(false);
	const noteInputRef = useRef<HTMLInputElement>(null);

	const startEditing = () => {
		setIsEditing(true);
		window.requestAnimationFrame(() => {
			noteInputRef.current?.focus();
		});
	};

	const cancelEditing = () => {
		setIsEditing(false);
		setNote(initialNote ?? "");
	};

	const handleSave = async () => {
		setIsSaving(true);
		await updateMemberNote(memberId, note)
			.then(() => {
				if (!note || note.trim() === "") {
					toast.success("Nota borrada");
				} else {
					toast.success("Nota editada");
				}
				setIsEditing(false);
			})
			.catch(() => {
				toast.error("Error al guardar la nota");
			})
			.finally(() => {
				setIsSaving(false);
			});
	};

	return isEditing ? (
		<div className="flex items-center gap-1 w-full min-w-[200px]">
			<Input
				id={inputId}
				value={note}
				onChange={(e) => setNote(e.target.value)}
				className="h-8 bg-[#1e1e24]/50 border-border/30 text-xs w-full focus-visible:ring-1 focus-visible:ring-emerald-500"
				ref={noteInputRef}
				onKeyDown={(e) => {
					if (e.key === "Enter") void handleSave();
					if (e.key === "Escape") {
						cancelEditing();
					}
				}}
			/>
			<Button
				variant="ghost"
				size="icon"
				aria-label="Guardar nota"
				className="size-8 text-emerald-500 hover:bg-emerald-500/10"
				onClick={() => void handleSave()}
				disabled={isSaving}
			>
				<IconCheck className="size-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				aria-label="Cancelar edición de nota"
				className="size-8 text-red-500 hover:bg-red-500/10"
				onClick={cancelEditing}
				disabled={isSaving}
			>
				<IconX className="size-4" />
			</Button>
		</div>
	) : (
		<div className="group/note flex items-center justify-between w-full min-w-[200px] gap-2">
			<div className="text-xs text-muted-foreground truncate" title={note}>
				{note || <span className="opacity-50 italic">Añadir nota…</span>}
			</div>
			<Button
				variant="ghost"
				size="icon"
				aria-label="Editar nota"
				className="size-6 opacity-0 group-hover/note:opacity-100 transition-opacity"
				onClick={startEditing}
			>
				<IconPencil className="size-3 text-muted-foreground" />
			</Button>
		</div>
	);
}

function RosterExternalLinks({ member }: { member: GuildMember }) {
	const charName = member.character_name.toLowerCase();
	const links = [
		{
			href: `https://worldofwarcraft.blizzard.com/es-es/character/eu/${member.realm_slug}/${charName}`,
			title: "Armería de WoW",
			icon: "/assets/images/icons/armory.webp",
			alt: "Armería",
		},
		{
			href: `https://www.warcraftlogs.com/character/eu/${member.realm_slug}/${charName}`,
			title: "WarcraftLogs",
			icon: "/assets/images/icons/wcl.webp",
			alt: "WCL",
		},
		{
			href: `https://raider.io/characters/eu/${member.realm_slug}/${charName}`,
			title: "Raider.io",
			icon: "/assets/images/icons/raiderio.webp",
			alt: "RIO",
		},
	] as const;

	return (
		<div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
			{links.map((link) => (
				<button
					key={link.href}
					type="button"
					onClick={() =>
						openExternalUrl(link.href)
					}
					className="p-1 hover:bg-muted rounded transition-colors"
					title={link.title}
					aria-label={link.title}
				>
					<Image
						src={link.icon}
						width={16}
						height={16}
						className="size-4 grayscale hover:grayscale-0  object-contain"
						alt={link.alt}
					/>
				</button>
			))}
		</div>
	);
}

function RosterMemberSettingsDialog({
	member,
	rankNames,
	rankOptions,
	classRoleMapping,
	canViewNote,
	onRoleChange,
	onRankChange,
}: {
	member: GuildMember;
	rankNames?: string[];
	rankOptions?: Array<{ rank: number; name: string }>;
	classRoleMapping: Record<number, string>;
	canViewNote: boolean;
	onRoleChange: (memberId: string, name: string, role: string) => Promise<void>;
	onRankChange: (
		memberId: string,
		name: string,
		rankId: string,
	) => Promise<void>;
}) {
	return (
		<DialogContent className="sm:max-w-md bg-card border-border/40 p-0 overflow-hidden shadow-2xl">
			<DialogHeader className="p-6 pb-2">
				<DialogTitle className="text-xl font-semibold text-foreground uppercase tracking-tight flex items-center gap-2">
					<IconUser className="size-5 text-primary" /> Ficha de Personaje
				</DialogTitle>
				<DialogDescription className="text-xs text-muted-foreground/70 uppercase font-bold tracking-widest mt-1">
					Configuración técnica y notas internas
				</DialogDescription>
			</DialogHeader>
			<div className="px-6 py-4 space-y-6">
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<label
							htmlFor={`roster-role-${member.id}`}
							className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
						>
							Rol
						</label>
						<Select
							defaultValue={
								normalizeRosterRole(member.role) ||
								normalizeRosterRole(classRoleMapping[member.class_id ?? 0]) ||
								"ranged"
							}
							onValueChange={(val) =>
								void onRoleChange(member.id, member.character_name, val)
							}
						>
							<SelectTrigger
								id={`roster-role-${member.id}`}
								className="w-full bg-muted/20 border-border/40 hover:bg-muted/30 focus:ring-1 focus:ring-blue-500/30  font-semibold uppercase text-[10px] tracking-widest h-10"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="tank">Tanque</SelectItem>
								<SelectItem value="heal">Sanador</SelectItem>
								<SelectItem value="melee">Melee</SelectItem>
								<SelectItem value="ranged">Ranged</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<label
							htmlFor={`roster-rank-${member.id}`}
							className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
						>
							Rango
						</label>
						<Select
							defaultValue={member.rank.toString()}
							onValueChange={(val) =>
								void onRankChange(member.id, member.character_name, val)
							}
						>
							<SelectTrigger
								id={`roster-rank-${member.id}`}
								className="w-full bg-muted/20 border-border/40 hover:bg-muted/30 focus:ring-1 focus:ring-blue-500/30  font-semibold uppercase text-[10px] tracking-widest h-10"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="max-h-[32rem]">
								{(rankOptions?.length
									? rankOptions
									: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((rankId) => ({
											rank: rankId,
											name: rankNames?.[rankId] || RANK_NAMES[rankId],
										}))
								).map((rank) => (
									<SelectItem key={rank.rank} value={rank.rank.toString()}>
										{rank.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				{canViewNote && (
					<div className="space-y-1.5 pt-2 border-t border-border/10">
						<label
							htmlFor={`roster-note-${member.id}`}
							className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
						>
							Notas Internas
						</label>
						<NoteCell
							key={`${member.id}-${member.note ?? ""}`}
							inputId={`roster-note-${member.id}`}
							memberId={member.id}
							initialNote={member.note}
						/>
					</div>
				)}
				<div className="pt-2 border-t border-border/10 flex items-center justify-between">
					<span className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-widest">
						Sincronizado: <SyncedAt value={member.synced_at} />
					</span>
					<Button
						variant="destructive"
						size="sm"
						className="text-[10px] uppercase font-semibold tracking-widest gap-2 h-8"
						onClick={() => {
							void (async () => {
								if (
									confirm(
										`¿Estás seguro de que quieres borrar a ${member.character_name}?`,
									)
								) {
									try {
										await deleteMember(member.id);
										toast.success(`${member.character_name} eliminado`);
									} catch (e) {
										toast.error("Error al eliminar");
										console.error(e);
									}
								}
							})();
						}}
					>
						<IconTrash className="size-3.5" /> Remover personaje
					</Button>
				</div>
			</div>
		</DialogContent>
	);
}
