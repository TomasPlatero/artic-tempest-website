"use client";

import Image from "next/image";
import Link from "next/link";
import { IconExternalLink } from "@/shared/ui/tabler-icons";

import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

import { ZONA_RAIDER_SURFACE } from "./zona-raider.utils";

export function ZonaRaiderPromoStrip() {
	return (
		<div
			className="grid gap-4 md:grid-cols-2"
			data-tour-step="zona-raider-promotions"
		>
			<Card
				className={`${ZONA_RAIDER_SURFACE} min-h-[300px] overflow-hidden p-0 md:hover:shadow-none md:hover:bg-card/80`}
			>
				<div className="relative h-full overflow-hidden">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.10),transparent_30%)]" />
					<div className="absolute inset-0 bg-linear-to-r from-background via-background/92 to-transparent" />
					<div className="absolute inset-y-0 right-0 w-[60%]">
						<Image
							src="/assets/images/ads/proton-vpn-seeklogo.webp"
							alt="ProtonVPN"
							width={800}
							height={800}
							className="size-full object-contain object-right opacity-12"
							loading="eager"
						/>
					</div>

					<div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-7">
						<div className="max-w-[58%] space-y-4">
							<div className="inline-flex items-center rounded-full border border-purple-400/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-200">
								Seguridad
							</div>
							<div className="space-y-2">
								<h3 className="text-2xl font-semibold italic uppercase tracking-tighter text-foreground drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]">
									ProtonVPN
								</h3>
								<p className="text-sm leading-6 text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
									Protección DDoS, menor latencia y privacidad para tus sesiones
									de raid.
								</p>
							</div>
						</div>

						<div className="flex flex-wrap gap-3">
							<Button asChild>
								<Link
									href="https://protonvpn.com/"
									target="_blank"
									rel="noreferrer"
								>
									<IconExternalLink size={16} />
									Saber más
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</Card>

			<Card
				className={`${ZONA_RAIDER_SURFACE} min-h-[300px] overflow-hidden p-0 md:hover:shadow-none md:hover:bg-card/80`}
			>
				<div className="relative h-full overflow-hidden">
					<div className="absolute inset-0 bg-linear-to-t from-black via-black/78 to-transparent" />
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_32%)]" />
					<a
						href="https://shop.restedxp.com/ref/artictempest/"
						target="_blank"
						rel="noreferrer"
						className="absolute inset-0 block"
					>
						<Image
							src="https://media.restedxp.com/raw/q95sa9.png"
							alt="RestedXP"
							fill
							sizes="(min-width: 768px) 30vw, 60vw"
							className="absolute inset-0 size-full object-cover opacity-16"
						/>
					</a>

					<div
						aria-hidden="true"
						className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.08),transparent_30%)]"
					/>

					<div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-7">
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<span className="inline-flex items-center rounded-full border border-orange-400/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-200">
									Afiliado
								</span>
								<h3 className="text-lg font-semibold italic uppercase tracking-tighter text-white">
									RestedXP
								</h3>
							</div>
							<span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75">
								Partner oficial
							</span>
						</div>

						<div className="max-w-md space-y-2">
							<h4 className="text-2xl font-semibold uppercase tracking-tighter text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
								El maestro <span className="text-orange-400">del leveo</span>
							</h4>
							<p className="text-sm leading-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
								Sube de nivel más rápido con sus guías premium y el descuento
								del afiliado. Obtén un 5% de descuento.
							</p>
						</div>

						<div className="flex flex-wrap gap-3">
							<Button asChild>
								<Link
									href="https://shop.restedxp.com/ref/artictempest/"
									target="_blank"
									rel="noreferrer"
								>
									<IconExternalLink size={16} />
									Comprar ahora
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}
