"use client";

import * as React from "react";
import Image from "next/image";
import { IconExternalLink } from "@/shared/ui/tabler-icons";
import type { RaiderIoGuildBossKillRosterEntry } from "@/shared/integrations/raiderio/raiderio-client";

type Difficulty = "mythic" | "heroic" | "normal";

type TimelineBoss = {
	name: string;
	slug: string;
	imageUrl: string;
	isDefeated: boolean;
	defeatedDifficulty: Difficulty | null;
	killDate: string | null;
	pullCount: number;
	bestPercent: number;
	firstSeenAt: string | null;
	lastPullAt: string | null;
	killImageUrl: string | null;
	killRoster: RaiderIoGuildBossKillRosterEntry[];
};

type SporefallLike = {
	difficulty: Difficulty;
	isDefeated: boolean;
	killDate: string | null;
	firstSeenAt: string | null;
	lastPullAt: string | null;
	pullCount: number;
	bestPercent: number;
	killImageUrl?: string | null;
	killRoster: RaiderIoGuildBossKillRosterEntry[];
};

type Props = {
	timeline: { bosses: TimelineBoss[] } | null;
	sporefall: SporefallLike | null;
};

const difficultyLabel: Record<Difficulty, string> = {
	mythic: "Mítico",
	heroic: "Heroico",
	normal: "Normal",
};

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

function formatProgressPercent(value: number) {
	const progress = Math.max(0, Math.min(100, 100 - value));
	return `${Math.round(progress)}%`;
}

function getTimestamp(value?: string | null) {
	if (!value) return Number.MAX_SAFE_INTEGER;
	const parsed = new Date(value).getTime();
	return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function getBossSortDate(boss: TimelineBoss) {
	return boss.isDefeated ? boss.killDate : boss.lastPullAt || boss.firstSeenAt;
}

function getSporefallSortDate(sporefall: SporefallLike) {
	return sporefall.isDefeated
		? sporefall.killDate
		: sporefall.lastPullAt || sporefall.firstSeenAt;
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

function RosterModal({
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
	const dialogRef = React.useRef<HTMLDialogElement>(null);
	React.useEffect(() => {
		const d = dialogRef.current;
		if (d) (d as any).showModal();
		return () => (d as any)?.close();
	}, []);
	const sortedRoster = roster.slice().sort((a, b) => {
		const roleDelta = getRoleWeight(a.role) - getRoleWeight(b.role);
		if (roleDelta !== 0) return roleDelta;
		return a.name.localeCompare(b.name, "es");
	});

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

function DotIndicator({ isDefeated }: { isDefeated: boolean }) {
	return (
		<div className="relative z-10 size-5 shrink-0 rounded-full border border-white/20 bg-[#060b17] shadow-[0_0_0_4px_rgba(6,11,23,1)]">
			<span
				className={`absolute inset-1 rounded-full ${
					isDefeated
						? "bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.75)]"
						: "bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.6)]"
				}`}
			/>
		</div>
	);
}

function BossCard({
	boss,
	pinnedSlug,
	setPinnedSlug,
}: {
	boss: TimelineBoss;
	pinnedSlug: string | null;
	setPinnedSlug: (slug: string | null) => void;
}) {
	const isPinned = pinnedSlug === boss.slug;
	const togglePinned = () => setPinnedSlug(isPinned ? null : boss.slug);
	const hasKillModal = boss.killRoster.length > 0 || Boolean(boss.killImageUrl);

	return (
		<>
			<div className="rounded-[1.5rem] border border-white/10 bg-[#0a1020]/95 p-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.28)]">
				<div className="flex items-start gap-4">
					<div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/30 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
						<Image
							src={boss.imageUrl}
							alt={boss.name}
							fill
							className="object-cover"
							sizes="96px"
						/>
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<p className="text-[1rem] font-semibold leading-tight text-white text-wrap break-words">
									{boss.name}
								</p>
								<p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-300/80">
									{boss.defeatedDifficulty
										? difficultyLabel[boss.defeatedDifficulty]
										: "Mítico"}
								</p>
							</div>
							{boss.isDefeated && hasKillModal ? (
								<button
									type="button"
									aria-label={`Abrir roster y foto de ${boss.name}`}
									onClick={togglePinned}
									className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 transition-colors hover:border-emerald-300/50 hover:bg-emerald-500/20"
								>
									<IconExternalLink className="size-4" />
								</button>
							) : null}
						</div>
						<p className="mt-2.5 text-sm leading-5 text-white/70">
							{boss.isDefeated
								? `Fecha del kill: ${formatDate(boss.killDate)}.`
								: boss.pullCount > 0
									? `Mejor progreso: ${formatProgressPercent(boss.bestPercent)}.`
									: "Aún no hemos registrado pulls en este encuentro."}
						</p>
					</div>
				</div>
			</div>

			{isPinned && boss.isDefeated && hasKillModal && (
				// react-doctor-disable-line prefer-html-dialog
				<RosterModal
					roster={boss.killRoster}
					date={boss.killDate}
					slug={boss.slug}
					killImageUrl={boss.killImageUrl}
					onClose={() => setPinnedSlug(null)}
				/>
			)}
		</>
	);
}

function SporefallCard({
	sporefall,
	pinnedSlug,
	setPinnedSlug,
}: {
	sporefall: SporefallLike;
	pinnedSlug: string | null;
	setPinnedSlug: (slug: string | null) => void;
}) {
	const isPinned = pinnedSlug === "sporefall";
	const togglePinned = () => setPinnedSlug(isPinned ? null : "sporefall");
	const hasKillModal =
		sporefall.killRoster.length > 0 || Boolean(sporefall.killImageUrl);

	return (
		<>
			<div className="rounded-[1.5rem] border border-white/10 bg-[#0a1020]/95 p-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.28)]">
				<div className="flex items-start gap-4">
					<div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/30 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
						<Image
							src="/assets/images/raids/sporefall.webp"
							alt="Sporefall"
							fill
							className="object-cover"
							sizes="96px"
						/>
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<p className="text-[1rem] font-semibold leading-tight text-white text-wrap break-words">
									Pudrelodo
								</p>
								<p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-blue-300/80">
									{difficultyLabel[sporefall.difficulty]}
								</p>
							</div>
							{sporefall.isDefeated && hasKillModal ? (
								<button
									type="button"
									aria-label="Abrir roster y foto de Pudrelodo"
									onClick={togglePinned}
									className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 transition-colors hover:border-emerald-300/50 hover:bg-emerald-500/20"
								>
									<IconExternalLink className="size-4" />
								</button>
							) : null}
						</div>
						<p className="mt-2.5 text-sm leading-5 text-white/70">
							{sporefall.isDefeated
								? `Fecha del kill: ${formatDate(sporefall.killDate)}.`
								: `Mejor progreso: ${formatProgressPercent(sporefall.bestPercent)}.`}
						</p>
					</div>
				</div>
			</div>

			{isPinned && sporefall.isDefeated && hasKillModal && (
				<RosterModal
					roster={sporefall.killRoster}
					date={sporefall.killDate}
					slug="sporefall"
					killImageUrl={sporefall.killImageUrl}
					onClose={() => setPinnedSlug(null)}
				/>
			)}
		</>
	);
}

export function VerticalProgressTimeline({ timeline, sporefall }: Props) {
	const [pinnedSlug, setPinnedSlug] = React.useState<string | null>(null);

	const bosses = timeline?.bosses ?? [];
	const items = [
		...bosses.map((boss) => ({
			type: "boss" as const,
			boss,
			sortDate: getBossSortDate(boss),
		})),
		...(sporefall
			? [
					{
						type: "sporefall" as const,
						sporefall,
						sortDate: getSporefallSortDate(sporefall),
					},
				]
			: []),
	].sort((a, b) => getTimestamp(a.sortDate) - getTimestamp(b.sortDate));

	if (items.length === 0) return null;

	return (
		<div className="px-4 sm:px-6 py-8 sm:py-10">
			<div className="max-w-lg mx-auto space-y-0">
				{items.map((item, index) => {
					const isFirst = index === 0;
					const isLast = index === items.length - 1;
					const isDefeated =
						item.type === "boss"
							? item.boss.isDefeated
							: item.sporefall.isDefeated;
					const stableKey = item.type === "boss" ? item.boss.slug : "sporefall";

					return (
						<div key={stableKey} className="flex items-stretch gap-3">
							{/* Card */}
							<div className="flex-1 min-w-0 py-3">
								{item.type === "boss" ? (
									<BossCard
										boss={item.boss}
										pinnedSlug={pinnedSlug}
										setPinnedSlug={setPinnedSlug}
									/>
								) : (
									<SporefallCard
										sporefall={item.sporefall}
										pinnedSlug={pinnedSlug}
										setPinnedSlug={setPinnedSlug}
									/>
								)}
							</div>

							{/* Timeline column */}
							<div className="flex flex-col items-center w-10 shrink-0">
								{/* Top connector line */}
								<div
									className={`w-px bg-white/16 ${
										isFirst ? "flex-[0.5] min-h-5" : "flex-1"
									}`}
								/>
								{/* Dot */}
								<DotIndicator isDefeated={isDefeated} />
								{/* Bottom connector line */}
								<div
									className={`w-px bg-white/16 ${
										isLast ? "flex-[0.5] min-h-5" : "flex-1"
									}`}
								/>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
