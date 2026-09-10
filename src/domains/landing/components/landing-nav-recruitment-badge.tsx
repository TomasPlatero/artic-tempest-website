// Extracted from navigation.tsx (ATW-20): keeps each component in its own file.

import { IconUserPlus } from "@/shared/ui/tabler-icons";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/shared/ui/tooltip";
import { cn } from "@/shared/tailwind/tailwind-utils";

export function RecruitmentBadge({
	canSeeRecruitmentBadge,
	recruitmentCount,
	hasApplicantMessages,
}: {
	canSeeRecruitmentBadge: boolean;
	recruitmentCount: number;
	hasApplicantMessages: boolean;
}) {
	if (!canSeeRecruitmentBadge) return null;

	const badge = (
		<span className="relative inline-flex">
			<span
				className={cn(
					"inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-md border bg-zinc-950 px-2 text-[11px] font-semibold text-white shadow-[0_0_0_1px_rgba(239,68,68,0.15)] transition-opacity",
					recruitmentCount > 0
						? "border-red-500/60 opacity-100"
						: "border-white/15 opacity-45",
				)}
			>
				<IconUserPlus className="size-3.5 text-white" />
				<span>{recruitmentCount}</span>
			</span>
			{hasApplicantMessages && (
				<span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border border-zinc-950 bg-red-500 shadow-[0_0_0_2px_rgba(0,0,0,0.8)] motion-safe:animate-pulse" />
			)}
		</span>
	);

	if (recruitmentCount > 0) {
		return (
			<TooltipProvider delayDuration={300}>
				<Tooltip>
					<TooltipTrigger asChild>{badge}</TooltipTrigger>
					<TooltipContent sideOffset={4}>
						Hay {recruitmentCount} aplicaciones activas
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return badge;
}

