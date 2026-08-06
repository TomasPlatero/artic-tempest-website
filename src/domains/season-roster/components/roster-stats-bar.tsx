"use client";

import { useState } from "react";
import {
	IconShield,
	IconHeart,
	IconSword,
	IconBow,
} from "@/shared/ui/tabler-icons";
import dynamic from "next/dynamic";

const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), {
	ssr: false,
});
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), {
	ssr: false,
});

import type { RosterStats } from "./season-roster.types";

function RosterStatsBar({ stats }: { stats: RosterStats }) {
	const { roles, classes } = stats;
	const total = roles.total;
	const [activeIndex, setActiveIndex] = useState(-1);

	const pieData = classes.map((c) => ({
		name: c.label,
		value: c.count,
		fill: c.color,
	}));

	return (
		<div className="rounded-xl border border-white/10 bg-zinc-900/40 backdrop-blur-sm p-4 md:p-5">
			<div className="md:grid md:grid-cols-[1fr_1px_1fr] md:gap-0">
				<div className="md:pr-5">
					<h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-300 mb-3">
						Roles ({total})
					</h3>
					<div className="grid grid-cols-2 gap-2 sm:gap-3">
						<div className="flex items-center gap-2 rounded-lg bg-sky-500/10 border border-sky-500/20 px-3 py-2">
							<IconShield className="size-4 text-sky-400 shrink-0" />
							<div>
								<span className="text-lg font-bold text-sky-400">
									{roles.tanks}
								</span>
								<span className="text-[10px] text-sky-400/70 ml-1 uppercase">
									Tanques
								</span>
							</div>
						</div>
						<div className="flex items-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2">
							<IconHeart className="size-4 text-blue-400 shrink-0" />
							<div>
								<span className="text-lg font-bold text-blue-400">
									{roles.healers}
								</span>
								<span className="text-[10px] text-blue-400/70 ml-1 uppercase">
									Sanadores
								</span>
							</div>
						</div>
						<div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2">
							<IconSword className="size-4 text-rose-400 shrink-0" />
							<div>
								<span className="text-lg font-bold text-rose-400">
									{roles.melee}
								</span>
								<span className="text-[10px] text-rose-400/70 ml-1 uppercase">
									Melee
								</span>
							</div>
						</div>
						<div className="flex items-center gap-2 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2">
							<IconBow className="size-4 text-violet-400 shrink-0" />
							<div>
								<span className="text-lg font-bold text-violet-400">
									{roles.ranged}
								</span>
								<span className="text-[10px] text-violet-400/70 ml-1 uppercase">
									Ranged
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className="hidden md:block w-px bg-white/10 self-stretch" />
				<div className="md:hidden my-4 border-t border-white/10" />

				<div className="md:pl-5">
					<h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-300 mb-3">
						Clases ({classes.length})
					</h3>
					{classes.length > 0 ? (
						<div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
							<div className="relative size-32 sm:size-36 shrink-0">
								<PieChart width={144} height={144}>
									<Pie
										data={pieData}
										dataKey="value"
										nameKey="name"
										cx="50%"
										cy="50%"
										innerRadius={38}
										outerRadius={52}
										onMouseEnter={(_, index) => setActiveIndex(index)}
										onMouseLeave={() => setActiveIndex(-1)}
									/>
								</PieChart>
								<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
									<span className="text-lg font-bold text-zinc-100">
										{total}
									</span>
								</div>
							</div>
							<div
								className="flex-1 w-full grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs"
								onMouseLeave={() => setActiveIndex(-1)}
							>
								{classes.map((c, i) => {
									const isActive = activeIndex === i || activeIndex === -1;
									return (
										<div
											key={c.classId}
											className={`flex items-center gap-1.5 cursor-default transition-opacity duration-200 ${isActive ? "" : "opacity-40"}`}
											onMouseEnter={() => setActiveIndex(i)}
										>
											<div
												className="size-2 shrink-0 rounded-sm"
												style={{ backgroundColor: c.color }}
											/>
											<span
												className={`truncate ${isActive ? "text-white font-bold" : "text-zinc-100"}`}
											>
												{c.label}
											</span>
											<span
												className={`tabular-nums ml-auto text-[11px] ${isActive ? "text-white font-bold" : "text-zinc-400"}`}
											>
												{c.count}
											</span>
										</div>
									);
								})}
							</div>
						</div>
					) : (
						<span className="text-xs text-zinc-400 italic">Sin datos</span>
					)}
				</div>
			</div>
		</div>
	);
}

export { RosterStatsBar };
