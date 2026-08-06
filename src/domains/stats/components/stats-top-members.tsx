"use client";

import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { IconCrown } from "@/shared/ui/tabler-icons";
import { cn } from "@/shared/tailwind/tailwind-utils";
import type { TopMembersState } from "./stats.types";

export function TopMembersRankingCards({
	topMembers,
	classColors,
	onInspectMember,
}: {
	topMembers: TopMembersState;
	classColors: Record<number, string>;
	onInspectMember: (member: any) => void;
}) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			{topMembers.isLoading ? (
				<>
					<div className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />
					<div className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />
					<div className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />
				</>
			) : topMembers.members.length > 0 ? (
				topMembers.members.map((m, i) => (
					<Card
						key={m.id}
						className={cn(
							"bg-linear-to-br from-card to-background border-border/40 overflow-hidden group cursor-pointer hover:border-primary/50 ",
							i === 0
								? "border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
								: "",
						)}
						onClick={() => onInspectMember(m)}
					>
						<CardContent className="p-4 flex items-center gap-4">
							<div
								className={cn(
									"size-12 rounded-full flex items-center justify-center shrink-0 border-2",
									i === 0
										? "border-amber-500 bg-amber-500/10"
										: i === 1
											? "border-stone-400 bg-stone-400/10"
											: "border-amber-700 bg-amber-700/10",
								)}
							>
								{i === 0 ? (
									<IconCrown className="size-6 text-amber-500" />
								) : (
									<span className="font-semibold">{i + 1}</span>
								)}
							</div>
							<div className="min-w-0">
								<div
									className={cn(
										"font-semibold text-lg truncate",
										!classColors[m.class_id]?.startsWith("#") &&
											classColors[m.class_id],
									)}
									style={
										classColors[m.class_id]?.startsWith("#")
											? { color: classColors[m.class_id] }
											: {}
									}
								>
									{m.character_name}
								</div>
								<div className="flex items-center gap-2">
									<span
										className="text-2xl font-semibold"
										style={{ color: m.color }}
									>
										{Math.round(m.score)}
									</span>
									<Badge
										variant="outline"
										className="text-[9px] uppercase tracking-tighter py-0 px-1 opacity-60"
									>
										Best in Guild
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				))
			) : null}
		</div>
	);
}
