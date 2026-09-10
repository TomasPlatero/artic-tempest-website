// Extracted from recruitment-detail-client.tsx (ATW-20).

import Link from "next/link";
import { Button } from "@/shared/ui/button";
import {
	IconExternalLink,
	IconMessageCircle,
} from "@/shared/ui/tabler-icons";

type RecruitmentDetailChatHistoryProps = {
	application: any;
	canViewChatHistory: boolean;
	currentStatus: string;
};

export function RecruitmentDetailChatHistory({
	application,
	canViewChatHistory,
	currentStatus,
}: RecruitmentDetailChatHistoryProps) {
	if (!canViewChatHistory) return null;

	return (
		<>
			<div className="pt-3 animate-in fade-in slide-in-from-top-2 duration-500">
				<Button
					className="w-full rounded-xl h-12 bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold uppercase text-[10px] tracking-[0.15em] shadow-xl shadow-blue-500/20 border-t border-white/20 group justify-center gap-2 px-4 ring-1 ring-white/5"
					asChild
				>
					<Link
						href={`/zona-raider/configuracion/reclutamiento/${application.id}/chat`}
					>
						<IconMessageCircle className="size-4 group-hover:translate-x-[-2px] group-hover:rotate-[-10deg] transition-colors duration-300" />
						<span className="truncate">
							{currentStatus === "interview"
								? "Chat con Aspirante"
								: "Ver histórico de chat"}
						</span>
						<IconExternalLink className="size-3 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-colors shrink-0" />
					</Link>
				</Button>
			</div>
		</>
	);
}

type RecruitmentDetailItemLevelProps = {
	initialBnetData: any;
	rioData: any;
};

function resolveHasAverage(initialBnetData: any) {
	return initialBnetData.average > 0;
}

function resolveHasItemLevelTotal(rioData: any) {
	return rioData.gear.item_level_total > 0;
}
export function RecruitmentDetailItemLevel({ initialBnetData, rioData }: RecruitmentDetailItemLevelProps) {
	return (
		<>
			<div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
				<span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">
					iLvl
				</span>
				<span className="text-xs font-semibold text-white">
					{initialBnetData?.equipped ? (
						<>
							{initialBnetData.equipped}
							{resolveHasAverage(initialBnetData) && (
								<span className="text-zinc-500 ml-1">
									/ {initialBnetData.average}
								</span>
							)}
						</>
					) : rioData?.gear?.item_level_equipped ? (
						<>
							{rioData.gear.item_level_equipped}
							{resolveHasItemLevelTotal(rioData) && (
								<span className="text-zinc-500 ml-1">
									/ {rioData.gear.item_level_total}
								</span>
							)}
						</>
					) : (
						"Próx. Sinc."
					)}
				</span>
			</div>
		</>
	);
}
