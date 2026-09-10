"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import type { RaiderIoGuildBossKillRosterEntry } from "@/shared/integrations/raiderio/raiderio-client";

// Shared by both progress timelines (horizontal and vertical), which used to keep
// their own byte-identical copy of this modal and of the helpers below.
const fullFormatter = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "short",
	year: "numeric",
});

function formatDate(value?: string | null, formatter = fullFormatter) {
	if (!value) return "Sin fecha";
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return "Sin fecha";
	return formatter.format(parsed);
}

function getRoleWeight(role?: string | null) {
	const normalized = role?.toLowerCase();
	if (normalized === "tank") return 0;
	if (normalized === "healer") return 1;
	if (normalized === "dps") return 2;
	return 3;
}

function getClassIconUrl(classSlug?: string | null) {
	if (!classSlug) return null;
	const iconSlug = classSlug.replace(/-/g, "");
	return `https://cdnassets.raider.io/images/wow/icons/large/classicon_${iconSlug}.jpg`;
}

export function RosterModal({
	roster,
	date,
	slug,
	killImageUrl,
	onClose,
}: {
	roster: RaiderIoGuildBossKillRosterEntry[];
	date: string | null;
	slug: string;
	killImageUrl?: string | null;
	onClose: () => void;
}) {
	const sortedRoster = roster.slice().sort((a, b) => {
		const roleDelta = getRoleWeight(a.role) - getRoleWeight(b.role);
		if (roleDelta !== 0) return roleDelta;
		return a.name.localeCompare(b.name, "es");
	});

	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (dialog) (dialog as any).showModal();
		return () => (dialog as any)?.close();
	}, []);

	return (
		<dialog
			ref={dialogRef}
			onClose={onClose}
			aria-label="Roster del encuentro"
			className="fixed inset-0 m-auto max-h-[calc(100vh-7.5rem)] w-[min(76rem,calc(100vw-2rem))] overflow-hidden rounded-[2rem] border border-white/10 bg-[#08101c] px-6 py-7 shadow-[0_36px_120px_rgba(0,0,0,0.72)] backdrop:bg-black/78 backdrop:backdrop-blur-sm"
		>
			<div
				className="relative"
				role="presentation"
				onClick={(event) => event.stopPropagation()}
			>
				<button
					type="button"
					onClick={onClose}
					className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl leading-none text-white/70 transition-colors hover:bg-white/10 hover:text-white"
					aria-label="Cerrar roster"
				>
					×
				</button>

				<div className="mb-5 flex items-center justify-between gap-3 pr-10">
					<div>
						<p className="text-sm font-semibold text-emerald-100">
							Roster del kill
						</p>
						<p className="text-xs text-white/45">{formatDate(date)}</p>
					</div>
				</div>

				<div
					className={
						killImageUrl
							? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_42rem]"
							: "grid gap-4"
					}
				>
					<ul className="max-h-[calc(100vh-14rem)] space-y-2 overflow-auto pr-1">
						{sortedRoster.map((player) => {
							const details = [player.specName, player.className].filter(
								(value, valueIndex, values): value is string =>
									Boolean(value) && values.indexOf(value) === valueIndex,
							);
							const classIconUrl = getClassIconUrl(player.classSlug);

							return (
								<li
									key={`${slug}-${player.name}`}
									className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2 text-sm"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="flex min-w-0 items-center gap-3">
											{classIconUrl && (
												<Image
													src={classIconUrl}
													alt={player.className || "Class icon"}
													width={32}
													height={32}
													className="size-8 shrink-0 rounded-lg border border-white/10 bg-black/30"
												/>
											)}
											<div className="min-w-0">
												{player.profileUrl ? (
													<a
														href={player.profileUrl}
														target="_blank"
														rel="noreferrer"
														className="block truncate font-medium text-white transition-colors hover:text-emerald-200"
													>
														{player.name}
													</a>
												) : (
													<p className="truncate font-medium text-white">
														{player.name}
													</p>
												)}
												{details.length > 0 && (
													<p className="mt-0.5 truncate text-xs text-white/45">
														{details.join(" · ")}
													</p>
												)}
											</div>
										</div>
										{player.role && (
											<span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
												{player.role}
											</span>
										)}
									</div>
								</li>
							);
						})}
					</ul>

					{killImageUrl && (
						<div className="relative min-h-[calc(100vh-15rem)] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
							<Image
								src={killImageUrl}
								alt={`Kill ${slug}`}
								fill
								className="object-contain"
								sizes="672px"
							/>
						</div>
					)}
				</div>
			</div>
		</dialog>
	);
}
