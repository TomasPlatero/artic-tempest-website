"use client";

import * as React from "react";
import { useSyncExternalStore } from "react";
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

const dayFormatter = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "short",
});
const fullFormatter = new Intl.DateTimeFormat("es-ES", {
	day: "2-digit",
	month: "short",
	year: "numeric",
});
const ITEM_STEP_PX = 560;

function formatDate(value?: string | null, formatter = fullFormatter) {
	if (!value) return "Sin fecha";
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return "Sin fecha";
	return formatter.format(parsed);
}

function formatTimelineDate(value?: string | null) {
	return formatDate(value, dayFormatter);
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

function resolveBossTimelineVisuals(boss: TimelineBoss, index: number) {
	const topSide = index % 2 === 0;
	return {
		stamp: boss.isDefeated
			? boss.killDate
			: boss.lastPullAt || boss.firstSeenAt,
		metaPlacement: topSide
			? "top-[calc(50%+1.35rem)]"
			: "bottom-[calc(50%+1.35rem)]",
		cardPlacement: topSide ? "top-0" : "bottom-0",
		dotClass: boss.isDefeated
			? "bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.75)]"
			: "bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.6)]",
		statusClass: boss.isDefeated
			? "text-emerald-300/90"
			: "text-blue-200/80",
		statusLabel: boss.isDefeated ? "Kill" : "En progreso",
		hasKillModal:
			boss.killRoster.length > 0 || Boolean(boss.killImageUrl),
	};
}

function TimelineItem({
	boss,
	index,
	pinnedSlug,
	setPinnedSlug,
}: {
	boss: TimelineBoss;
	index: number;
	pinnedSlug: string | null;
	setPinnedSlug: (slug: string | null) => void;
}) {
	const isPinned = pinnedSlug === boss.slug;
	const togglePinned = () => setPinnedSlug(isPinned ? null : boss.slug);
	const {
		stamp,
		metaPlacement,
		cardPlacement,
		dotClass,
		statusClass,
		statusLabel,
		hasKillModal,
	} = resolveBossTimelineVisuals(boss, index);

	return (
		<li className="group relative list-none h-[20rem] w-[17rem] shrink-0 first:ml-4 sm:first:ml-6 lg:first:ml-8 last:mr-4 sm:last:mr-6 lg:last:mr-8">
			<div className="pointer-events-none absolute left-1/2 top-[calc(50%-0.5rem)] z-30 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-[#060b17] shadow-[0_0_0_4px_rgba(6,11,23,1)]">
				<span
					className={`absolute inset-1 rounded-full ${dotClass}`}
				/>
			</div>

			<div className={`absolute left-0 right-0 ${metaPlacement} text-center`}>
				<p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/45">
					{formatTimelineDate(stamp)}
				</p>
				<p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/30">
					{boss.pullCount} pulls
				</p>
				<p
					className={`text-[10px] uppercase tracking-[0.35em] ${statusClass}`}
				>
					{statusLabel}
				</p>
			</div>

			<div className={`absolute left-0 right-0 ${cardPlacement} pb-3 pt-3`}>
				<div
					data-timeline-card="true"
					className="relative w-full rounded-[1.75rem] border border-white/10 bg-[#0a1020]/95 p-3.5 text-left shadow-[0_16px_48px_rgba(0,0,0,0.28)] transition-colors duration-200 hover:border-blue-400/30 hover:bg-[#0d1528]"
				>
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
										onClick={(event) => {
											event.stopPropagation();
											togglePinned();
										}}
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
			</div>
		</li>
	);
}

function SporefallItem({
	sporefall,
	index,
	pinnedSlug,
	setPinnedSlug,
}: {
	sporefall: SporefallLike;
	index: number;
	pinnedSlug: string | null;
	setPinnedSlug: (slug: string | null) => void;
}) {
	const stamp = sporefall.isDefeated
		? sporefall.killDate
		: sporefall.lastPullAt || sporefall.firstSeenAt;
	const topSide = index % 2 === 0;
	const metaPlacement = topSide
		? "top-[calc(50%+1.35rem)]"
		: "bottom-[calc(50%+1.35rem)]";
	const cardPlacement = topSide ? "top-0" : "bottom-0";
	const isPinned = pinnedSlug === "sporefall";
	const togglePinned = () => setPinnedSlug(isPinned ? null : "sporefall");
	const hasKillModal =
		sporefall.killRoster.length > 0 || Boolean(sporefall.killImageUrl);

	return (
		<li className="group relative list-none h-[20rem] w-[17rem] shrink-0 first:ml-4 sm:first:ml-6 lg:first:ml-8 last:mr-4 sm:last:mr-6 lg:last:mr-8">
			<div className="pointer-events-none absolute left-1/2 top-[calc(50%-0.5rem)] z-30 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-[#060b17] shadow-[0_0_0_4px_rgba(6,11,23,1)]">
				<span
					className={`absolute inset-1 rounded-full ${sporefall.isDefeated ? "bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.75)]" : "bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.6)]"}`}
				/>
			</div>

			<div className={`absolute left-0 right-0 ${metaPlacement} text-center`}>
				<p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/45">
					{formatTimelineDate(stamp)}
				</p>
				<p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/30">
					{sporefall.pullCount} pulls
				</p>
				<p
					className={`text-[10px] uppercase tracking-[0.35em] ${sporefall.isDefeated ? "text-emerald-300/90" : "text-blue-200/80"}`}
				>
					{sporefall.isDefeated ? "Kill" : "En progreso"}
				</p>
			</div>

			<div className={`absolute left-0 right-0 ${cardPlacement} pb-3 pt-3`}>
				<div
					data-timeline-card="true"
					className="relative w-full rounded-[1.75rem] border border-white/10 bg-[#0a1020]/95 p-3.5 text-left shadow-[0_16px_48px_rgba(0,0,0,0.28)] transition-colors duration-200 hover:border-blue-400/30 hover:bg-[#0d1528]"
				>
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
										onClick={(event) => {
											event.stopPropagation();
											togglePinned();
										}}
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
			</div>
		</li>
	);
}

export function HorizontalProgressTimeline({ timeline, sporefall }: Props) {
	const railRef = React.useRef<HTMLDivElement | null>(null);
	const mounted = useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);
	const [pinnedSlug, setPinnedSlug] = React.useState<string | null>(null);
	const [canScrollPrevious, setCanScrollPrevious] = React.useState(false);
	const [canScrollNext, setCanScrollNext] = React.useState(false);
	const dragState = React.useRef({
		dragging: false,
		moved: false,
		startX: 0,
		startScrollLeft: 0,
		pointerId: -1,
	});

	const updateScrollButtons = () => {
		const rail = railRef.current;
		if (!rail) return;

		const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
		setCanScrollPrevious(rail.scrollLeft > 4);
		setCanScrollNext(rail.scrollLeft < maxScrollLeft - 4);
	};

	const updateScrollButtonsRef = React.useRef(updateScrollButtons);

	React.useEffect(() => {
		updateScrollButtonsRef.current = updateScrollButtons;
	});

	React.useEffect(() => {
		const rail = railRef.current;
		if (!rail) return;

		const scrollHandler = () => updateScrollButtonsRef.current();
		const resizeHandler = () => updateScrollButtonsRef.current();

		updateScrollButtonsRef.current();
		rail.addEventListener("scroll", scrollHandler, { passive: true });
		window.addEventListener("resize", resizeHandler);

		return () => {
			rail.removeEventListener("scroll", scrollHandler);
			window.removeEventListener("resize", resizeHandler);
		};
	}, [timeline, sporefall]);

	React.useEffect(() => {
		function onPointerUp() {
			dragState.current.dragging = false;
			document.body.style.userSelect = "";
		}

		window.addEventListener("pointerup", onPointerUp);
		window.addEventListener("pointercancel", onPointerUp);
		return () => {
			window.removeEventListener("pointerup", onPointerUp);
			window.removeEventListener("pointercancel", onPointerUp);
		};
	}, []);

	const scrollByItems = (direction: -1 | 1) => {
		const rail = railRef.current;
		if (!rail) return;
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		const behavior = mediaQuery.matches ? "instant" : "smooth";
		rail.scrollBy({ left: direction * ITEM_STEP_PX * 2, behavior });
	};

	const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		const target = event.target as HTMLElement;
		if (target.closest("button")) {
			return;
		}

		const rail = railRef.current;
		if (!rail) return;

		dragState.current.dragging = true;
		dragState.current.moved = false;
		dragState.current.startX = event.clientX;
		dragState.current.startScrollLeft = rail.scrollLeft;
		dragState.current.pointerId = event.pointerId;
		rail.setPointerCapture(event.pointerId);
		document.body.style.userSelect = "none";
	};

	const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		const rail = railRef.current;
		if (!rail) return;
		const deltaX = event.clientX - dragState.current.startX;
		if (!dragState.current.dragging) return;
		if (Math.abs(deltaX) > 4) {
			dragState.current.moved = true;
		}
		rail.scrollLeft = dragState.current.startScrollLeft - deltaX;
		updateScrollButtons();
		event.preventDefault();
	};

	const onPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
		const rail = railRef.current;
		if (!rail) return;
		dragState.current.dragging = false;
		dragState.current.pointerId = -1;
		document.body.style.userSelect = "";
		if (rail.hasPointerCapture(event.pointerId)) {
			rail.releasePointerCapture(event.pointerId);
		}
	};

	const bosses = timeline?.bosses ?? [];
	const timelineItems = [
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
	const hasControls = mounted && timelineItems.length > 1;

	return (
		<div className="relative overflow-hidden text-white">
			<div className="relative mx-auto w-full px-0 py-10 sm:py-14 lg:py-16">
				<div className="relative">
					{canScrollPrevious && (
						<div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-linear-to-r from-[#040612] via-[#040612]/90 to-transparent sm:w-16 lg:w-20" />
					)}
					{canScrollNext && (
						<div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-linear-to-l from-[#040612] via-[#040612]/90 to-transparent sm:w-16 lg:w-20" />
					)}
					<div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-linear-to-r from-transparent via-white/16 to-transparent" />

					<div
						ref={railRef}
						className="no-scrollbar relative flex gap-3 overflow-x-auto overflow-y-hidden pb-4 pt-8 select-none touch-pan-x"
						style={{ WebkitOverflowScrolling: "touch", userSelect: "none" }}
						onPointerDown={onPointerDown}
						onPointerMove={onPointerMove}
						onPointerUp={onPointerEnd}
						onPointerLeave={onPointerEnd}
						onDragStart={(event) => event.preventDefault()}
					>
						{timelineItems.map((item, index) =>
							item.type === "boss" ? (
								<TimelineItem
									key={item.boss.slug}
									boss={item.boss}
									index={index}
									pinnedSlug={pinnedSlug}
									setPinnedSlug={setPinnedSlug}
								/>
							) : (
								<SporefallItem
									key="sporefall"
									sporefall={item.sporefall}
									index={index}
									pinnedSlug={pinnedSlug}
									setPinnedSlug={setPinnedSlug}
								/>
							),
						)}
					</div>
				</div>

				{hasControls && (
					<div className="mt-6 flex w-full items-center justify-between px-4 sm:px-6 lg:px-8">
						{canScrollPrevious ? (
							<button
								type="button"
								aria-label="Ver bosses anteriores"
								onClick={() => scrollByItems(-1)}
								className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-emerald-400/30 hover:bg-emerald-500/10"
							>
								←
							</button>
						) : (
							<span aria-hidden="true" />
						)}

						{canScrollNext ? (
							<button
								type="button"
								aria-label="Ver bosses siguientes"
								onClick={() => scrollByItems(1)}
								className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-emerald-400/30 hover:bg-emerald-500/10"
							>
								→
							</button>
						) : (
							<span aria-hidden="true" />
						)}
					</div>
				)}
			</div>
		</div>
	);
}
