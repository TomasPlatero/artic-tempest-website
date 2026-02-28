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
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Branding & Legal */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-white font-black uppercase tracking-tighter text-xl">Artic Tempest</h3>
                        <p className="text-white/40 text-sm max-w-xs leading-relaxed">
                            Hermandad competitiva de World of Warcraft en EU-Dun Modr. Alcanzando la excelencia desde hace más de 1 año.
                        </p>
                    </div>

                    <div className="flex gap-4 text-[10px] text-white/20 uppercase tracking-widest font-black">
                        <Link href="/aviso-legal" className="hover:text-white/60 transition-colors">Aviso Legal</Link>
                        <Link href="/privacidad" className="hover:text-white/60 transition-colors">Privacidad</Link>
                        <Link href="/cookies" className="hover:text-white/60 transition-colors">Cookies</Link>
                    </div>

                    <p className="text-white/20 text-[10px] font-medium">
                        © {new Date().getFullYear()} Artic Tempest. Todos los derechos reservados.
                    </p>
                </div>

                {/* Social Media */}
                <div className="flex flex-col gap-6">
                    <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Comunidad</h4>
                    <div className="flex flex-col gap-3">
                        <a href="https://discord.gg/artictempest" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group">
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-[#5865F2]/20 transition-colors">
                                <IconBrandDiscord className="size-4 group-hover:text-[#5865F2] transition-colors" />
                            </div>
                            <span className="text-sm font-medium">Discord Oficial</span>
                        </a>
                        <a href="https://x.com/artictempestwow" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group">
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                <IconBrandX className="size-4 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-sm font-medium">Twitter / X</span>
                        </a>
                        <a href="https://www.youtube.com/@ArticTempestTV" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group">
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-red-500/20 transition-colors">
                                <IconBrandYoutube className="size-4 group-hover:text-red-500 transition-colors" />
                            </div>
                            <span className="text-sm font-medium">YouTube</span>
                        </a>
                    </div>
                </div>

                {/* WoW Links */}
                <div className="flex flex-col gap-6">
                    <h4 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Progreso & Stats</h4>
                    <div className="flex flex-wrap gap-3">
                        <a href="https://raider.io/guilds/eu/dun-modr/Artic%20Tempest" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all group" title="Raider.io">
                            <Image src="/assets/images/icons/raiderio.png" width={24} height={24} className="size-5 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all object-contain" alt="RIO" />
                        </a>
                        <a href="https://www.warcraftlogs.com/guild/eu/dun-modr/artic%20tempest" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all group" title="WarcraftLogs">
                            <Image src="/assets/images/icons/wcl.png" width={24} height={24} className="size-5 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all object-contain" alt="WCL" />
                        </a>
                        <a href="https://www.wowprogress.com/guild/eu/dun-modr/artic%20tempest" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all group" title="WoW Progress">
                            <IconChartBar className="size-5 text-white/40 group-hover:text-amber-400 rotate-90 transition-colors" />
                        </a>
                        <a href="https://worldofwarcraft.blizzard.com/en-gb/guild/eu/dun-modr/artic-tempest" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/10 transition-all group" title="Armería WoW">
                            <Image src="/assets/images/icons/armory.png" width={24} height={24} className="size-5 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all object-contain" alt="Armería" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
