import Link from "next/link";
import Image from "next/image";
import {
	IconActivity,
	IconBrandDiscord,
	IconBrandX,
	IconBrandYoutube,
	IconChartBar,
	IconRss,
	IconShield,
	IconLock,
	IconCookie,
	IconAccessible,
	IconHelp,
} from "@/shared/ui/tabler-icons";
import { WebsiteCarbonBadgeWidget } from "./website-carbon-badge";
import { DEFAULT_PUBLIC_LOGO } from "@/shared/guild/guild-constants";

const _copyrightFormatter = new Intl.DateTimeFormat("en", {
	year: "numeric",
	timeZone: "UTC",
});

function getCopyrightYear() {
	return _copyrightFormatter.format(new Date());
}

const COPYRIGHT_YEAR = getCopyrightYear();

const footerSocialLinkClass =
	"group inline-flex items-center gap-3 text-sm font-medium text-white/85 transition-colors motion-reduce:transition-none hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2 focus-visible:rounded";

const footerIconChipClass =
	"inline-flex size-11 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]  motion-reduce:transition-none hover:border-blue-500/30 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2";

const footerTextLinkClass =
	"inline-flex items-center gap-2 text-sm font-medium text-white/85 transition-colors motion-reduce:transition-none hover:text-blue-300 focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2 focus-visible:rounded";

export function LandingFooter({
	publicLogoUrl,
}: {
	publicLogoUrl?: string | null;
}) {
	return (
		<footer className="py-16 border-t border-white/5 bg-zinc-950/50 mt-auto relative z-10">
			<div className="max-w-[96rem] mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
				{/* Branding & Legal */}
				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-2">
						<Image
							src={publicLogoUrl || DEFAULT_PUBLIC_LOGO}
							alt="Artic Tempest"
							width={330}
							height={100}
							sizes="(max-width: 768px) 80vw, 330px"
							loading="lazy"
							className="h-15 w-auto object-contain"
						/>
						<p className="text-white/80 text-sm max-w-xs leading-relaxed">
							Hermandad competitiva de World of Warcraft en EU-Dun Modr.
							Alcanzando la excelencia desde hace más de 1 año.
						</p>
					</div>

					<p className="text-white/80 text-[10px] font-bold leading-normal uppercase tracking-widest mt-2">
						© {COPYRIGHT_YEAR} Artic Tempest. Todos los derechos reservados.
					</p>
					<p className="text-white/70 text-xs font-medium leading-relaxed">
						Creado con{" "}
						<span className="text-rose-400" aria-hidden="true">
							❤
						</span>
						<span className="sr-only">amor</span> por{" "}
						<a
							href="https://TomasPlatero.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-300 underline underline-offset-2 hover:text-white transition-colors"
						>
							TomasPlatero.com
						</a>
					</p>
					<p className="text-[9px] text-white/80 font-medium leading-relaxed max-w-xs mt-2 italic">
						World of Warcraft® y Blizzard Entertainment® son marcas registradas
						de Blizzard Entertainment, Inc. Artic Tempest es un sitio web de
						fans no oficial y no está afiliado, respaldado, patrocinado ni
						aprobado específicamente por Blizzard Entertainment.
					</p>
				</div>

				{/* Web responsable */}
				<div className="flex flex-col gap-6">
					<h4 className="text-white/80 text-[10px] font-semibold uppercase tracking-[0.2em]">
						Web responsable
					</h4>
					<div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4 max-w-xs">
						<p className="text-xs text-white/60 leading-relaxed mb-3">
							Medimos y mostramos nuestra huella digital.
						</p>
						<WebsiteCarbonBadgeWidget />
					</div>
				</div>

				{/* Social Media */}
				<div className="flex flex-col gap-6">
					<h4 className="text-white/80 text-[10px] font-semibold uppercase tracking-[0.2em]">
						Comunidad
					</h4>
					<div className="flex flex-col gap-3">
						<a
							href="https://discord.artictempest.es/"
							target="_blank"
							rel="noopener noreferrer"
							className={footerSocialLinkClass}
							aria-label="Unirse a nuestro Discord Oficial"
						>
							<IconBrandDiscord className="size-5 transition-colors group-hover:text-[#5865F2]" />
							<span>Discord Oficial</span>
						</a>
						<a
							href="https://x.com/artictempestWoW"
							target="_blank"
							rel="noopener noreferrer"
							className={footerSocialLinkClass}
							aria-label="Síguenos en Twitter / X"
						>
							<IconBrandX className="size-5 transition-colors group-hover:text-white" />
							<span>Twitter / X</span>
						</a>
						<a
							href="https://www.youtube.com/@ArticTempestTV"
							target="_blank"
							rel="noopener noreferrer"
							className={footerSocialLinkClass}
							aria-label="Visita nuestro canal de YouTube"
						>
							<IconBrandYoutube className="size-5 transition-colors group-hover:text-red-500" />
							<span>YouTube</span>
						</a>
					</div>
				</div>

				{/* WoW Links */}
				<div className="flex flex-col gap-6">
					<h4 className="text-white/80 text-[10px] font-semibold uppercase tracking-[0.2em]">
						Estamos en…
					</h4>
					<div className="flex flex-wrap gap-3">
						<a
							href="https://raider.io/guilds/eu/dun-modr/Artic%20Tempest"
							target="_blank"
							rel="noopener noreferrer"
							className={`${footerIconChipClass} group`}
							aria-label="Raider.io profile"
						>
							<Image
								src="/assets/images/icons/raiderio.webp"
								width={24}
								height={24}
								sizes="24px"
								loading="lazy"
								className="size-6 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100  object-contain"
								alt="Raider.io Logo"
							/>
						</a>
						<a
							href="https://www.wowprogress.com/guild/eu/dun-modr/Artic+Tempest"
							target="_blank"
							rel="noopener noreferrer"
							className={`${footerIconChipClass} group`}
							aria-label="WoW Progress profile"
						>
							<IconChartBar className="size-6 text-white/60 group-hover:text-amber-400 rotate-90 transition-colors" />
						</a>
						<a
							href="https://guildsofwow.com/artic-tempest"
							target="_blank"
							rel="noopener noreferrer"
							className={`${footerIconChipClass} group`}
							aria-label="Guilds Of WoW profile"
						>
							<Image
								src="/assets/images/icons/guildsofwow.webp"
								width={35}
								height={35}
								sizes="24px"
								loading="lazy"
								className="size-6 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100  object-contain"
								alt="Guilds Of WoW Logo"
							/>
						</a>
						<a
							href="https://www.warcraftlogs.com/guild/id/743623"
							target="_blank"
							rel="noopener noreferrer"
							className={`${footerIconChipClass} group`}
							aria-label="Warcraft Logs profile"
						>
							<Image
								src="/assets/images/icons/wcl.webp"
								width={24}
								height={24}
								sizes="24px"
								loading="lazy"
								className="size-6 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100  object-contain"
								alt="Warcraft Logs Logo"
							/>
						</a>
					</div>
				</div>

				{/* Legal Section */}
				<div className="flex flex-col gap-6">
					<h4 className="text-white/80 text-[10px] font-semibold uppercase tracking-[0.2em]">
						Legal
					</h4>
					<div className="flex flex-col gap-3 text-white/70 text-sm font-medium">
						<Link href="/aviso-legal" className={footerTextLinkClass}>
							<IconShield className="size-4 text-[#f9c46b]" />
							Aviso Legal
						</Link>
						<Link href="/privacidad" className={footerTextLinkClass}>
							<IconLock className="size-4 text-[#f9c46b]" />
							Privacidad
						</Link>
						<Link href="/cookies" className={footerTextLinkClass}>
							<IconCookie className="size-4 text-[#f9c46b]" />
							Políticas de Cookies
						</Link>
						<Link href="/accesibilidad" className={footerTextLinkClass}>
							<IconAccessible className="size-4 text-[#f9c46b]" />
							Accesibilidad
						</Link>
						<Link href="/ayuda" className={footerTextLinkClass}>
							<IconHelp className="size-4 text-[#f9c46b]" />
							Centro de Ayuda
						</Link>
						<Link
							href="/noticias/rss"
							className={footerTextLinkClass}
							prefetch={false}
						>
							<IconRss className="size-4 text-amber-300" />
							RSS Noticias
						</Link>
						<a
							href="https://artictempest.statuspage.io/"
							target="_blank"
							rel="noopener noreferrer"
							className={footerTextLinkClass}
						>
							<IconActivity className="size-4 text-emerald-400" />
							Estado Web
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
