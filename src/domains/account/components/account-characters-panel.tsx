"use client";

import Image from "next/image";

import { Button } from "@/shared/ui/button";
import {
	IconAlertTriangle,
	IconCheck,
	IconChevronLeft,
	IconChevronRight,
	IconRefresh,
} from "@/shared/ui/tabler-icons";

import type { Character } from "./account-types";

type Props = {
	battletag: string | null;
	characters: Character[];
	currentPage: number;
	totalPages: number;
	selectedMainCharacterId: string | null;
	currentMainCharacter?: Character;
	refreshing: boolean;
	savingMainCharacterId: string | null;
	onRefresh: () => void;
	onSetMainCharacter: (characterId: string) => void;
	onPreviousPage: () => void;
	onNextPage: () => void;
};

const ITEMS_PER_PAGE = 10;

export function AccountCharactersPanel({
	battletag,
	characters,
	currentPage,
	totalPages,
	selectedMainCharacterId,
	currentMainCharacter: _currentMainCharacter,
	refreshing,
	savingMainCharacterId,
	onRefresh,
	onSetMainCharacter,
	onPreviousPage,
	onNextPage,
}: Props) {
	const currentCharacters = characters.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE,
	);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
				<div>
					<h2 className="text-xl font-semibold text-white uppercase tracking-tight">
						Personajes de la cuenta (EU)
					</h2>
					<p className="text-sm text-zinc-300 mt-1">
						Sincronización automática con la API de Blizzard.
					</p>
				</div>
				{battletag && (
					<Button
						variant="secondary"
						size="sm"
						onClick={onRefresh}
						disabled={refreshing}
						className="text-[10px] uppercase font-semibold tracking-widest bg-white/5 hover:bg-white/10 text-white/70 h-9 px-4 border border-white/10"
					>
						<IconRefresh
							className={`size-3.5 mr-2 ${refreshing ? "animate-spin" : ""}`}
						/>
						Refrescar Lista
					</Button>
				)}
			</div>

			<div
				className="border border-white/10 rounded-2xl overflow-hidden bg-zinc-950/20 shadow-2xl backdrop-blur-sm"
				data-tour-step="account-main-character"
			>
				<div className="flex items-center justify-between gap-4 p-4 border-b border-white/10 bg-white/5">
					<div>
						<h2 className="text-lg font-semibold uppercase tracking-tight text-white/90">
							Personaje principal
						</h2>
						<p className="text-xs text-zinc-300 mt-1">
							Elige cuál se usará por defecto en el inicio y en las herramientas
							que dependan de tu personaje base.
						</p>
					</div>
				</div>

				<table className="w-full text-sm">
					<thead className="bg-white/5 border-b border-white/10">
						<tr>
							<th className="text-left font-semibold uppercase tracking-widest text-[9px] text-zinc-400 p-4 w-[60%]">
								Personaje
							</th>
							<th className="font-semibold uppercase tracking-widest text-[9px] text-zinc-400 p-4 w-[40%] text-right">
								Reino / Servidor
							</th>
							<th className="font-semibold uppercase tracking-widest text-[9px] text-zinc-400 p-4 w-[140px] text-right">
								Principal
							</th>
						</tr>
					</thead>
					<tbody>
						{currentCharacters.length > 0 ? (
							currentCharacters.map((c) => (
								<tr
									key={c.id}
									className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group"
								>
									{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
									<td className="p-4">
										<div className="flex items-center gap-4">
											<div className="relative size-8 shrink-0">
												<Image
													src={`/assets/images/classes/${c.class_id}.webp`}
													alt="Clase"
													fill
													sizes="32px"
													className="rounded-lg shadow-2xl border border-white/10 object-cover"
												/>
											</div>
											<div className="flex flex-col">
												<a
													href={`https://worldofwarcraft.blizzard.com/es-es/character/eu/${c.realm_slug}/${c.name.toLowerCase()}`}
													target="_blank"
													rel="noopener noreferrer"
													className="font-bold text-white/90 text-base leading-none mb-1 hover:text-[#00aeff] transition-colors"
												>
													{c.name}
												</a>
												<span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
													Nivel {c.level}
												</span>
											</div>
										</div>
									</td>
									{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
									<td className="p-4 text-right">
										<div className="flex flex-col items-end">
											<span className="text-zinc-200 font-medium">
												{c.realm}
											</span>
											<span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
												Europa / EU
											</span>
										</div>
									</td>
									{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
									<td className="p-4 text-right">
										{selectedMainCharacterId === c.id ? (
											<span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
												<IconCheck className="size-3" />
												Principal
											</span>
										) : (
											<Button
												variant="ghost"
												size="sm"
												className="h-8 text-[10px] uppercase font-semibold tracking-widest text-zinc-500 hover:text-zinc-200"
												onClick={() => onSetMainCharacter(c.id)}
												disabled={savingMainCharacterId === c.id}
											>
												{savingMainCharacterId === c.id ? (
													<IconRefresh className="size-3.5 animate-spin" />
												) : (
													<span className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-300">
														Marcar
													</span>
												)}
											</Button>
										)}
									</td>
								</tr>
							))
						) : (
							<tr>
								{/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
								<td colSpan={3} className="p-16 text-center">
									<div className="flex flex-col items-center gap-4">
										<div className="p-4 rounded-full bg-white/5 border border-white/5">
											<IconAlertTriangle className="size-8 text-zinc-600" />
										</div>
										<p className="text-zinc-300 text-sm italic max-w-xs">
											{battletag
												? "No hemos encontrado personajes de nivel 10 o superior en tu cuenta principal."
												: "Víncula tu cuenta de Battle.net para importar tu Roster de personajes automáticamente."}
										</p>
									</div>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{totalPages > 1 && characters.length > 0 && (
				<div className="flex items-center justify-between pt-4">
					<span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 ml-2">
						Página {currentPage} de {totalPages}{" "}
						<span className="mx-2 opacity-30">|</span> {characters.length}{" "}
						encontrados
					</span>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={onPreviousPage}
							disabled={currentPage === 1}
							aria-label="Página anterior"
							className="h-8 bg-transparent border-white/10 hover:bg-white/5 text-[10px] uppercase font-semibold tracking-widest"
						>
							<IconChevronLeft className="size-3.5 mr-1" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={onNextPage}
							disabled={currentPage === totalPages}
							aria-label="Página siguiente"
							className="h-8 bg-transparent border-white/10 hover:bg-white/5 text-[10px] uppercase font-semibold tracking-widest"
						>
							<IconChevronRight className="size-3.5 ml-1" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
