"use client";

import * as React from "react";
import Image from "next/image";
import { IconExternalLink } from "@/shared/ui/tabler-icons";
import type { RaiderIoGuildBossKillRosterEntry } from "@/shared/integrations/raiderio/raiderio-client";
import { RosterModal } from "./roster-modal";

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
