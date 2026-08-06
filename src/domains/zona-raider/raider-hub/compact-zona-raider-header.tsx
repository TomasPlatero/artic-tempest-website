import type { ZonaRaiderCharacter } from "./zona-raider.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Card } from "@/shared/ui/card";
import { RAIDER_CARD_REVEAL_CLASSES } from "@/shared/components/raider-motion";
import { getClassColor } from "./zona-raider.utils";

type CompactZonaRaiderHeaderProps = {
	userName: string;
	activeCharacter: ZonaRaiderCharacter | null;
	raidProgress: string;
	raidProgressLabel: string | null;
	mplusScore: number | null;
	rioUrl: string | null;
};

export function CompactZonaRaiderHeader({
	userName,
	activeCharacter,
	raidProgress,
	raidProgressLabel,
	rioUrl: _rioUrl,
}: CompactZonaRaiderHeaderProps) {
	const characterName = activeCharacter?.name ?? userName;
	const classColor = activeCharacter
		? getClassColor(activeCharacter.class_id)
		: undefined;

	return (
		<Card
			className={`relative overflow-hidden rounded-3xl p-6 ${RAIDER_CARD_REVEAL_CLASSES}`}
			style={{
				background: "transparent",
				border: "none",
				backdropFilter: "none",
				boxShadow: "none",
			}}
			data-widget-id="compact-header"
			data-tour-step="zona-raider-banner"
		>
			<div className="relative flex items-center gap-4">
				<Avatar className="size-16 shrink-0 border-2 border-blue-400/60 bg-background/20 shadow-sm sm:size-20">
					<AvatarImage
						src={
							activeCharacter
								? (activeCharacter.thumbnail_url ?? undefined)
								: undefined
						}
						alt={characterName}
						className="object-cover"
					/>
					<AvatarFallback className="bg-transparent text-xl font-semibold text-foreground sm:text-2xl">
						{characterName.slice(0, 2)}
					</AvatarFallback>
				</Avatar>

				<div className="min-w-0 flex-1">
					<p className="text-sm font-medium text-white/90 sm:text-xl">
						Hola de nuevo,{" "}
						<span className="font-semibold" style={{ color: classColor }}>
							{characterName}
						</span>
					</p>

					<p className="mt-1 text-sm text-white/85">
						Progreso raid:{" "}
						<span className="font-semibold text-white">
							{raidProgressLabel ?? raidProgress}
						</span>
					</p>
				</div>
			</div>
		</Card>
	);
}
