import Link from "next/link"
import Image from "next/image"
import {
    IconBrandDiscord,
    IconBrandX,
    IconBrandYoutube,
    IconExternalLink,
    IconChartBar,
} from "@tabler/icons-react"

export function LandingFooter() {
    return (
        <footer className="py-16 border-t border-white/5 bg-zinc-950/50 mt-auto relative z-10">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                {/* Branding & Legal */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-white font-black uppercase tracking-tighter text-xl">Artic Tempest</h3>
                        <p className="text-white/80 text-sm max-w-xs leading-relaxed">
                            Hermandad competitiva de World of Warcraft en EU-Dun Modr. Alcanzando la excelencia desde hace más de 1 año.
                        </p>
                    </div>

                    <p className="text-white/70 text-[10px] font-bold leading-normal uppercase tracking-widest mt-2">
                        © {new Date().getFullYear()} Artic Tempest. Todos los derechos reservados.
                    </p>
                    <p className="text-[9px] text-white/70 font-medium leading-relaxed max-w-xs mt-2 italic">
                        World of Warcraft® y Blizzard Entertainment® son marcas registradas de Blizzard Entertainment, Inc. Artic Tempest es un sitio web de fans no oficial y no está afiliado, respaldado, patrocinado ni aprobado específicamente por Blizzard Entertainment.
                    </p>
                </div>

                {/* Social Media */}
                <div className="flex flex-col gap-6">
                    <h4 className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">Comunidad</h4>
                    <div className="flex flex-col gap-3">
                        <a href="https://discord.com/invite/artictempest" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/70 hover:text-blue-400 transition-colors group" aria-label="Unirse a nuestro Discord Oficial">
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-[#5865F2]/20 transition-colors">
                                <IconBrandDiscord className="size-4 group-hover:text-[#5865F2] transition-colors" />
                            </div>
                            <span className="text-sm font-medium">Discord Oficial</span>
                        </a>
                        <a href="https://x.com/artictempestwow" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/70 hover:text-blue-400 transition-colors group" aria-label="Síguenos en Twitter / X">
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                <IconBrandX className="size-4 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-sm font-medium">Twitter / X</span>
                        </a>
                        <a href="https://www.youtube.com/@ArticTempestTV" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/70 hover:text-blue-400 transition-colors group" aria-label="Visita nuestro canal de YouTube">
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-red-500/20 transition-colors">
                                <IconBrandYoutube className="size-4 group-hover:text-red-500 transition-colors" />
                            </div>
                            <span className="text-sm font-medium">YouTube</span>
                        </a>
                    </div>
                </div>

                {/* WoW Links */}
                <div className="flex flex-col gap-6">
                    <h4 className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">Estamos en...</h4>
                    <div className="flex flex-wrap gap-3">
                        <a href="https://raider.io/guilds/eu/dun-modr/Artic%20Tempest" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all group" aria-label="Raider.io profile">
                            <Image src="/assets/images/icons/raiderio.webp" width={24} height={24} className="size-6 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all object-contain" alt="Raider.io Logo" />
                        </a>
                        <a href="https://www.warcraftlogs.com/guild/eu/dun-modr/artic%20tempest" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all group" aria-label="WarcraftLogs profile">
                            <Image src="/assets/images/icons/wcl.webp" width={24} height={24} className="size-6 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all object-contain" alt="WarcraftLogs Logo" />
                        </a>
                        <a href="https://www.wowprogress.com/guild/eu/dun-modr/Artic+Tempest" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all group" aria-label="WoW Progress profile">
                            <IconChartBar className="size-6 text-white/60 group-hover:text-amber-400 rotate-90 transition-colors" />
                        </a>
                        <a href="https://guildsofwow.com/artic-tempest" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all group" aria-label="Guilds Of WoW profile">
                            <Image src="/assets/images/icons/guildsofwow.webp" width={35} height={35} className="size-6 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all object-contain" alt="Guilds Of WoW Logo" />
                        </a>
                        <a href="https://worldofwarcraft.blizzard.com/en-gb/guild/eu/dun-modr/artic-tempest" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all group" aria-label="Armería WoW profile">
                            <Image src="/assets/images/icons/armory.webp" width={24} height={24} className="size-6 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all object-contain" alt="Armería WoW Logo" />
                        </a>
                    </div>
                </div>

                {/* Legal Section */}
                <div className="flex flex-col gap-6">
                    <h4 className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em]">Legal</h4>
                    <div className="flex flex-col gap-3 text-white/70 text-sm font-medium">
                        <Link href="/aviso-legal" className="hover:text-blue-400 transition-colors">Aviso Legal</Link>
                        <Link href="/privacidad" className="hover:text-blue-400 transition-colors">Privacidad</Link>
                        <Link href="/cookies" className="hover:text-blue-400 transition-colors">Políticas de Cookies</Link>
                        <Link href="/accesibilidad" className="hover:text-blue-400 transition-colors">Accesibilidad</Link>
                        <Link href="/ayuda" className="hover:text-blue-400 transition-colors">Centro de Ayuda</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
