"use client";

import { IconActivity, IconExternalLink } from "@/shared/ui/tabler-icons";

import { Card } from "@/shared/ui/card";
import {
	RAIDER_PAGE_FADE_IN_CLASSES,
	RAIDER_SECTION_REVEAL_CLASSES,
} from "@/shared/components/raider-motion";

import { CompactZonaRaiderHeader } from "./compact-zona-raider-header";
import { DiscordFeedCard } from "./discord-feed-card";
import { ZonaRaiderPromoStrip } from "./zona-raider-promo-strip";
import type { ZonaRaiderData } from "./zona-raider.types";
import {
	ZONA_RAIDER_SURFACE,
	ZONA_RAIDER_SURFACE_INSET,
} from "./zona-raider.utils";

type ZonaRaiderClientProps = {
	data: ZonaRaiderData;
};

function LogDate({ startTime }: { startTime: string | number | Date }) {
	return (
		<span>
			{new Date(startTime).toLocaleDateString("es-ES", {
				day: "numeric",
				month: "short",
				timeZone: "UTC",
			})}
		</span>
	);
}

export function ZonaRaiderClient({ data }: ZonaRaiderClientProps) {
	return (
		<div
			className={`relative isolate flex flex-col gap-6 pb-8 ${RAIDER_PAGE_FADE_IN_CLASSES}`}
		>
			<div
				className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-[0.18]"
				style={{
					backgroundImage: 'url("/assets/images/midnight-battle.webp")',
				}}
			/>
			<div className="pointer-events-none fixed inset-0 -z-10 bg-linear-to-t from-[#020203] via-[#020203]/60 to-transparent" />
			<div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.16),transparent_40%)]" />

			<div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
				<CompactZonaRaiderHeader
					userName={data.userName}
					activeCharacter={data.activeCharacter}
					raidProgress={data.raidProgress}
					raidProgressLabel={data.activeCharacterRaidProgress}
					mplusScore={data.activeCharacterScore}
					rioUrl={data.activeCharacterRioUrl}
				/>
			</div>

			<div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
				<DiscordFeedCard
					messages={data.discordMessages}
					guildId={data.discordGuildId}
					channelId={data.discordChannelId}
				/>
			</div>

			<div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
				<ZonaRaiderPromoStrip />
			</div>

			<div className={`grid gap-4 ${RAIDER_SECTION_REVEAL_CLASSES}`}>
				<Card
					className={`${ZONA_RAIDER_SURFACE} p-5 transition-colors duration-300 hover:border-border/80 md:col-span-2 xl:col-span-3`}
					data-tour-step="zona-raider-logs"
				>
					<div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-transparent opacity-60" />
					<div className="relative flex h-full flex-col gap-4">
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<IconActivity className="size-5 text-blue-500" />
								<div>

									<h3 className="text-lg font-semibold italic uppercase tracking-tighter text-white">
										Últimos Logs
									</h3>
								</div>
							</div>
						</div>

						{data.recentLogs.length > 0 ? (
							<div className="grid gap-3 md:grid-cols-3">
								{data.recentLogs.map((log) => (
									<a
										key={log.code}
										href={`https://www.warcraftlogs.com/reports/${log.code}`}
										target="_blank"
										rel="noreferrer"
										className={`${ZONA_RAIDER_SURFACE_INSET} group/log flex items-center justify-between p-4 transition-colors hover:border-border/80`}
									>
										<div className="min-w-0">
											<p className="truncate text-sm font-semibold uppercase italic tracking-tighter text-white group-hover/log:text-orange-200">
												{log.title}
											</p>
											<p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
												{log.zone?.name || "Raid"}
											</p>
										</div>
										<div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-orange-300">
											<LogDate startTime={log.startTime} />
											<IconExternalLink className="size-3.5" />
										</div>
									</a>
								))}
							</div>
						) : (
							<div className="rounded-2xl border border-border/60 bg-background/40 p-4">
								<p className="text-sm font-bold text-foreground/80">
									No hay logs recientes configurados.
								</p>
							</div>
						)}
					</div>
				</Card>
			</div>
		</div>
	);
}
