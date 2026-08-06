"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import {
	IconExternalLink,
	IconBolt,
	
} from "@/shared/ui/tabler-icons";

interface AdBannerProps {
	type: "restedxp" | "protonvpn" | "instantgaming" | "generic";
	href: string;
	title?: string;
	description?: string;
	imageSrc?: string;
}

const PROTON_VPN_BACKGROUND =
	"data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%221200%22%20height%3D%22675%22%20viewBox%3D%220%200%201200%20675%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22paint0_linear%22%20x1%3D%2280%22%20y1%3D%2260%22%20x2%3D%221120%22%20y2%3D%22620%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%23070816%22%2F%3E%3Cstop%20offset%3D%220.52%22%20stop-color%3D%22%23171132%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%236D28D9%22%2F%3E%3C%2FlinearGradient%3E%3CradialGradient%20id%3D%22paint1_radial%22%20cx%3D%220%22%20cy%3D%220%22%20r%3D%221%22%20gradientUnits%3D%22userSpaceOnUse%22%20gradientTransform%3D%22translate(980%20140)%20rotate(137.291)%20scale(336.534%20392.921)%22%3E%3Cstop%20stop-color%3D%22%23A78BFA%22%20stop-opacity%3D%220.75%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23A78BFA%22%20stop-opacity%3D%220%22%2F%3E%3C%2FradialGradient%3E%3CradialGradient%20id%3D%22paint2_radial%22%20cx%3D%220%22%20cy%3D%220%22%20r%3D%221%22%20gradientUnits%3D%22userSpaceOnUse%22%20gradientTransform%3D%22translate(210%20560)%20rotate(23.6298)%20scale(240.676%20309.022)%22%3E%3Cstop%20stop-color%3D%22%2322D3EE%22%20stop-opacity%3D%220.35%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%2322D3EE%22%20stop-opacity%3D%220%22%2F%3E%3C%2FradialGradient%3E%3Cfilter%20id%3D%22blur50%22%20x%3D%22-50%22%20y%3D%22-50%22%20width%3D%221300%22%20height%3D%22775%22%20filterUnits%3D%22userSpaceOnUse%22%20color-interpolation-filters%3D%22sRGB%22%3E%3CfeGaussianBlur%20stdDeviation%3D%2224%22%2F%3E%3C%2Ffilter%3E%3C%2Fdefs%3E%3Crect%20width%3D%221200%22%20height%3D%22675%22%20rx%3D%2248%22%20fill%3D%22url(%23paint0_linear)%22%2F%3E%3Cg%20filter%3D%22url(%23blur50)%22%3E%3Cellipse%20cx%3D%22990%22%20cy%3D%22150%22%20rx%3D%22240%22%20ry%3D%22210%22%20fill%3D%22url(%23paint1_radial)%22%2F%3E%3Cellipse%20cx%3D%22240%22%20cy%3D%22560%22%20rx%3D%22230%22%20ry%3D%22180%22%20fill%3D%22url(%23paint2_radial)%22%2F%3E%3C%2Fg%3E%3Cpath%20d%3D%22M140%20145C240%2088%20372%2082%20486%20114C533%20127%20581%20148%20628%20170C714%20210%20811%20252%20930%20240C993%20234%201057%20208%201108%20178C1070%20257%201044%20338%201014%20419C970%20539%20902%20592%20787%20604C674%20615%20562%20573%20454%20529C335%20480%20233%20449%20140%20145Z%22%20fill%3D%22white%22%20fill-opacity%3D%220.05%22%2F%3E%3Cpath%20d%3D%22M130%20486C256%20440%20369%20432%20494%20459C595%20480%20689%20524%20792%20547C879%20567%20981%20568%201085%20548C1052%20611%201009%20644%20945%20651C840%20661%20726%20635%20617%20600C503%20565%20394%20533%20280%20525C224%20521%20174%20523%20130%20486Z%22%20fill%3D%22white%22%20fill-opacity%3D%220.05%22%2F%3E%3Cg%20opacity%3D%220.9%22%3E%3Ccircle%20cx%3D%22250%22%20cy%3D%22210%22%20r%3D%2210%22%20fill%3D%22%23C4B5FD%22%20fill-opacity%3D%220.9%22%2F%3E%3Ccircle%20cx%3D%221015%22%20cy%3D%22530%22%20r%3D%228%22%20fill%3D%22%2322D3EE%22%20fill-opacity%3D%220.8%22%2F%3E%3Ccircle%20cx%3D%22905%22%20cy%3D%22120%22%20r%3D%226%22%20fill%3D%22%23F8FAFC%22%20fill-opacity%3D%220.8%22%2F%3E%3Ccircle%20cx%3D%221085%22%20cy%3D%22260%22%20r%3D%225%22%20fill%3D%22%23A5B4FC%22%20fill-opacity%3D%220.7%22%2F%3E%3C%2Fg%3E%3Cpath%20d%3D%22M600%20206C515%20206%20446%20275%20446%20360C446%20475%20600%20579%20600%20579C600%20579%20754%20475%20754%20360C754%20275%20685%20206%20600%20206Z%22%20fill%3D%22%230F172A%22%20fill-opacity%3D%220.56%22%20stroke%3D%22%23E0E7FF%22%20stroke-opacity%3D%220.12%22%20stroke-width%3D%224%22%2F%3E%3Cpath%20d%3D%22M600%20254C542%20254%20495%20300%20495%20357C495%20433%20600%20502%20600%20502C600%20502%20705%20433%20705%20357C705%20300%20658%20254%20600%20254Z%22%20fill%3D%22%2322D3EE%22%20fill-opacity%3D%220.12%22%20stroke%3D%22%2322D3EE%22%20stroke-opacity%3D%220.25%22%20stroke-width%3D%224%22%2F%3E%3Cpath%20d%3D%22M600%20286C557%20286%20522%20319%20522%20360C522%20415%20600%20468%20600%20468C600%20468%20678%20415%20678%20360C678%20319%20643%20286%20600%20286Z%22%20fill%3D%22%23A78BFA%22%20fill-opacity%3D%220.12%22%2F%3E%3Cpath%20d%3D%22M600%20313C581%20313%20566%20328%20566%20347C566%20371%20600%20395%20600%20395C600%20395%20634%20371%20634%20347C634%20328%20619%20313%20600%20313Z%22%20fill%3D%22%23FFFFFF%22%20fill-opacity%3D%220.88%22%2F%3E%3C%2Fsvg%3E";
const INSTANT_GAMING_BANNER_ID = "ig-banner-artic-tempest";
const INSTANT_GAMING_SCRIPT_ID = "instant-gaming-partner-loader";
const INSTANT_GAMING_REF = "gamer-94712f";

interface InstantGamingBannerConfig {
	lang: string;
	igr: string;
	banners: string[];
}

export function AdBanner({
	type,
	href,
	title,
	description,
	imageSrc,
}: AdBannerProps) {
	useEffect(() => {
		if (type !== "instantgaming" || typeof window === "undefined") return;

		(
			window as Window & { igBannerConfig?: InstantGamingBannerConfig }
		).igBannerConfig = {
			lang: "es",
			igr: INSTANT_GAMING_REF,
			banners: [INSTANT_GAMING_BANNER_ID],
		};

		const script = document.createElement("script");
		script.id = INSTANT_GAMING_SCRIPT_ID;
		script.src = "https://www.instant-gaming.com/api/banner/partner/loader.js";
		script.defer = true;
		document.body.appendChild(script);
	}, [type]);

	if (type === "restedxp") {
		return (
			<div className="group relative overflow-hidden rounded-2xl border border-orange-500/30 bg-[#050816] shadow-2xl md:h-[240px] animate-in fade-in slide-in-from-bottom-4 duration-700 hover:scale-[1.02] transition-transform">
				<Link
					href="https://shop.restedxp.com/ref/artictempest/"
					target="_blank"
					rel="noopener noreferrer"
					className="relative block size-full"
				>
					{/* Background Image */}
					<div className="absolute inset-0 z-0">
						<div className="absolute inset-0 bg-linear-to-r from-black via-black/45 to-black/20 z-10" />
						<div aria-hidden="true" className="absolute inset-0">
							<Image
								src="https://media.restedxp.com/raw/q95sa9.png"
								alt="RestedXP Leveling Guides"
								width={800}
								height={1000}
								quality={60}
								sizes="(max-width: 768px) 100vw, 400px"
								className="absolute inset-0 size-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
							/>
						</div>
						<div
							aria-hidden="true"
							className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.12),transparent_30%)] motion-safe:animate-pulse"
						/>
					</div>

					<div className="relative z-20 flex size-full flex-col p-5 md:p-6">
						<div className="flex items-center justify-between">
							<div className="bg-orange-600 text-white text-[8px] md:text-[9px] font-semibold uppercase px-3 py-1 rounded-full tracking-widest shadow-xl">
								Partner Oficial
							</div>
						</div>

						<div className="flex flex-1 flex-col justify-center">
							<h3 className="text-[1.1rem] md:text-[1.45rem] font-semibold text-white uppercase tracking-tighter leading-[1.02] group-hover:text-orange-400 transition-colors max-w-lg">
								El <span className="text-orange-500">leveo más rápido</span>{" "}
								para volver al endgame
							</h3>
							<p className="mt-2 max-w-lg text-zinc-200 text-[10px] md:text-[12px] font-medium leading-relaxed">
								Sube de nivel sin perder tiempo: rutas optimizadas, progreso
								ágil y la ruta más directa para llegar preparado a raids,
								míticas y PvP.
							</p>
						</div>

						<div className="flex items-end justify-between gap-4 pt-4">
							<span className="text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.22em] text-orange-500 underline underline-offset-4">
								Obtén un 5% de Descuento
							</span>
							<span className="inline-flex items-center justify-center rounded-full bg-orange-500 px-3 py-1.5 text-[8px] md:text-[9px] font-semibold uppercase tracking-[0.22em] text-black transition-colors hover:bg-orange-400">
								Comprar Ahora
							</span>
						</div>
					</div>

					{/* Edge Glow */}
					<div className="absolute inset-0 border border-white/10 rounded-2xl z-30 pointer-events-none" />
				</Link>
			</div>
		);
	}

	if (type === "protonvpn") {
		return (
			<div className="group relative overflow-hidden rounded-2xl border border-violet-400/20 bg-[#070816] shadow-2xl aspect-[16/10] md:aspect-auto md:h-[280px] hover:scale-[1.02] transition-transform">
				<Link
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					className="relative block size-full"
				>
					<div className="absolute inset-0 z-0">
						<Image
							src={imageSrc || PROTON_VPN_BACKGROUND}
							alt="Proton VPN banner background"
							fill
							sizes="(max-width: 768px) 100vw, 560px"
							className="object-cover opacity-85 transition-transform duration-700 group-hover:scale-105"
							priority={false}
						/>
						<div className="absolute inset-0 bg-linear-to-br from-[#050611]/65 via-[#150f31]/45 to-[#6d28d9]/18" />
						<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_24%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(109,40,217,0.12),transparent_35%)]" />
					</div>

					<div className="absolute inset-0 z-20 p-6 flex h-full flex-col justify-between">
						<div className="flex flex-1 flex-col justify-center">
							<h3 className="flex items-center gap-3 text-2xl font-semibold uppercase tracking-tighter leading-none text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.75)]">
								<Image
									src="https://vpncdn.protonweb.com/image-transformation/?s=c&image=image%2Fupload%2Fv1693233227%2Fstatic%2Flogos%2Fproton-vpn-trademark_xiobqc.svg"
									alt="Proton VPN"
									width={160}
									height={40}
									className="h-9 w-auto shrink-0 drop-shadow-[0_2px_10px_rgba(255,255,255,0.45)]"
									unoptimized
								/>
								<span className="sr-only">Proton VPN</span>
							</h3>
							<p className="text-sm text-white/75 mt-3 max-w-sm leading-relaxed">
								Prueba Proton gratis por 14 días y obtén US$20 en créditos. Más
								de 100 millones de personas ya eligen su ecosistema cifrado para
								mantener el control de sus datos.
							</p>
						</div>

						<div className="pt-5">
							<div className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white backdrop-blur-sm">
								<IconBolt className="size-4 text-cyan-300" />
								Empezar gratis
							</div>
						</div>
					</div>

					<div className="absolute inset-0 border border-white/10 rounded-2xl z-30 pointer-events-none" />
				</Link>
			</div>
		);
	}

	if (type === "instantgaming") {
		return (
			<div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60 p-4 hover:scale-[1.02] transition-transform">
				<div className="rounded-2xl overflow-hidden border border-white/5 bg-zinc-950/30 p-2 min-h-[180px]">
					<div
						id={INSTANT_GAMING_BANNER_ID}
						className="ig-banner w-full min-h-[180px]"
					>
						<a
							href="https://www.instant-gaming.com/?igr=gamer-94712f"
							target="_blank"
							rel="noreferrer"
							aria-label="Instant Gaming - Videojuegos más baratos"
							className="relative flex min-h-[180px] w-full items-end overflow-hidden rounded-xl bg-cover bg-center p-4 text-white"
							style={{
								backgroundImage:
									"url('https://www.instant-gaming.com/images/bp/14/14-es.jpg?v=1777027042')",
							}}
						>
							<div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/10" />
							<div className="relative z-10 flex w-full items-end justify-between gap-4">
								<div className="max-w-[70%] space-y-2">
									<div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/75">
										Instant Gaming
									</div>
									<div className="text-sm font-semibold leading-relaxed sm:text-base">
										Todos tus videojuegos más baratos
									</div>
								</div>
								<div className="rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-black">
									Descúbrelos
								</div>
							</div>
						</a>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 p-4 hover:scale-[1.02] transition-transform">
			<Link href={href} className="block">
				{imageSrc && (
					<div className="relative aspect-video rounded-lg overflow-hidden mb-4">
						<Image
							src={imageSrc}
							alt={title || "Ad"}
							width={1200}
							height={675}
							sizes="(max-width: 768px) 100vw, 400px"
							className="absolute inset-0 size-full object-cover"
						/>
					</div>
				)}
				<div className="flex items-center justify-between mb-2">
					<h3 className="text-sm font-semibold text-white uppercase">
						{title}
					</h3>
					<IconExternalLink className="size-4 text-white/20" />
				</div>
				<p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
			</Link>
		</div>
	);
}
