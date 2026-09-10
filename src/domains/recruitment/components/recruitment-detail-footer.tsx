// Extracted from recruitment-detail-client.tsx (ATW-20).
import Image from "next/image";

type RecruitmentDetailServiceButtonsProps = {
	application: any;
};

export function RecruitmentDetailServiceButtons({ application }: RecruitmentDetailServiceButtonsProps) {
	return (
		<>
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/5">
				<a
					href={`https://raider.io/characters/eu/${application.character_realm}/${application.character_name}`}
					target="_blank"
					rel="noreferrer"
					className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 hover:border-orange-500/30 transition-colors group"
				>
					<Image
						src="/assets/images/icons/raiderio.webp"
						alt="RIO"
						width={28}
						height={28}
						className="object-contain group-hover:scale-110 transition-transform"
					/>
					<div className="flex flex-col">
						<span className="text-[10px] font-semibold text-white uppercase tracking-widest">
							Raider.io
						</span>
						<span className="text-[8px] font-bold text-orange-400/70 uppercase">
							Perfil Completo
						</span>
					</div>
				</a>
				<a
					href={`https://www.warcraftlogs.com/character/eu/${application.character_realm}/${application.character_name}`}
					target="_blank"
					rel="noreferrer"
					className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 hover:border-blue-500/30 transition-colors group"
				>
					<Image
						src="/assets/images/icons/wcl.webp"
						alt="WCL"
						width={28}
						height={28}
						className="object-contain group-hover:scale-110 transition-transform"
					/>
					<div className="flex flex-col">
						<span className="text-[10px] font-semibold text-white uppercase tracking-widest">
							WarcraftLogs
						</span>
						<span className="text-[8px] font-bold text-blue-400/70 uppercase">
							Logs y Rankings
						</span>
					</div>
				</a>
				<a
					href={`https://worldofwarcraft.blizzard.com/es-es/character/eu/${application.character_realm}/${application.character_name}`}
					target="_blank"
					rel="noreferrer"
					className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/20 transition-colors group"
				>
					<Image
						src="/assets/images/icons/armory.webp"
						alt="Armory"
						width={28}
						height={28}
						className="object-contain invert opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-colors"
					/>
					<div className="flex flex-col">
						<span className="text-[10px] font-semibold text-white uppercase tracking-widest">
							Armory
						</span>
						<span className="text-[8px] font-bold text-zinc-500 uppercase">
							Perfil Oficial
						</span>
					</div>
				</a>
			</div>
		</>
	);
}
