import Image from "next/image";
import { Label } from "@/shared/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shared/ui/select";
import { IconShield } from "@/shared/ui/tabler-icons";
import { RecruitmentDetailChatHistory } from "./recruitment-detail-sections";
import {
	DATE_FORMATTER_UTC,
	resolveGuildRealm,
	resolveSpecLabel,
	statusChangeOptions,
} from "./recruitment-detail-view-state";

type RecruitmentDetailHeaderProps = {
	application: any;
	canViewChatHistory: boolean;
	cls: any;
	currentStatus: any;
	handleUpdateStatus: any;
	rioData: any;
	statusLocked: boolean;
};

export function RecruitmentDetailHeader({
	application,
	canViewChatHistory,
	cls,
	currentStatus,
	handleUpdateStatus,
	rioData,
	statusLocked,
}: RecruitmentDetailHeaderProps) {
	return (
		<div className="flex flex-col md:flex-row justify-between items-start gap-4">
			<div className="flex items-center gap-6">
				<div className="relative size-20 md:size-24 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-blue-500/10 bg-zinc-900">
					<Image
						src={
							rioData?.thumbnail_url ||
							`/assets/images/classes/${application.character_class}.webp`
						}
						alt="Avatar"
						fill
						sizes="(min-width: 768px) 96px, 80px"
						className="object-cover"
					/>
				</div>
				<div>
					<div className="flex items-center gap-3 mb-1">
						<h2 className="text-3xl md:text-4xl font-semibold text-white uppercase tracking-tighter">
							{application.character_name}
						</h2>
					</div>
					<p className="text-lg font-medium" style={{ color: cls?.color }}>
						{resolveSpecLabel(application, rioData)} {cls?.name}
					</p>
					<p
						className="text-sm text-muted-foreground flex items-center gap-2"
						suppressHydrationWarning
					>
						{application.character_realm} •{" "}
						{DATE_FORMATTER_UTC.format(new Date(application.created_at))}
					</p>
					{rioData?.guild?.name && (
						<p className="text-sm text-blue-400/80 font-medium flex items-center gap-1.5 mt-1">
							<IconShield className="size-3.5" />
							&lt;{rioData.guild.name}&gt; · {resolveGuildRealm(rioData, application)}
						</p>
					)}
				</div>
			</div>

			<div className="flex flex-col gap-2 w-full md:w-64">
				<Label className="text-[10px] uppercase font-bold text-zinc-500 ml-2">
					Cambiar Estado
				</Label>
				<Select
					value={currentStatus}
					onValueChange={(val) => void handleUpdateStatus(val)}
					disabled={statusLocked}
				>
					<SelectTrigger className="bg-zinc-950/50 border-white/10 h-10 rounded-xl focus:ring-blue-500/50">
						<SelectValue placeholder="Seleccionar estado" />
					</SelectTrigger>
					<SelectContent className="bg-zinc-950 border-white/10 text-white">
						{statusChangeOptions.map(([key, cfg]) => (
							<SelectItem
								key={key}
								value={key}
								className="focus:bg-white/5 cursor-pointer"
							>
								<div className="flex items-center gap-2">
									<div
										className={`size-2 rounded-full ${key === "pending" ? "bg-blue-500" : key === "reviewing" ? "bg-purple-500" : key === "paused" ? "bg-zinc-400" : key === "interview" ? "bg-amber-500" : key === "accepted" ? "bg-emerald-500" : key === "simulated" ? "bg-cyan-500" : key === "cancelado" ? "bg-zinc-500" : key === "rejected" ? "bg-rose-500" : "bg-zinc-500"}`}
									/>
									{cfg.label}
								</div>
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<RecruitmentDetailChatHistory
					application={application}
					canViewChatHistory={canViewChatHistory}
					currentStatus={currentStatus}
				/>
			</div>
		</div>
	);
}
