"use client"

import { useState, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/shared/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/shared/ui/dropdown-menu"
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle,
} from "@/shared/ui/sheet"
import { IconUser, IconDashboard, IconLogout, IconMenu2, IconChevronRight, IconFileSearch, IconShieldCheck, IconClock, IconFlame, IconBriefcase } from "@tabler/icons-react"
import { NotificationBell } from "@/domains/notifications/components/notification-bell"
import { supabase } from "@/shared/supabase/client"
import { useFlags } from "@/shared/layout/flags-provider"

const NAV_LINKS = [
    { href: "/", label: "Inicio", title: "Inicio de Artic Tempest" },
    { href: "/#noticias", label: "Noticias", title: "Consulta las últimas novedades de la hermandad" },
    { href: "/#progreso", label: "Progreso", title: "Consulta nuestro progreso en Midnight" },
    { href: "/#reclutamiento", label: "Reclutamiento", title: "Mira las clases que necesitamos en Artic Tempest" },
    { href: "/streamers", label: "Streamers", title: "Sigue en directo a nuestros creadores de contenido" },
    { href: "/#historia", label: "Nuestra Historia", title: "Conoce la trayectoria de nuestra hermandad" },
]

export function LandingNavigation() {
    const { data: session } = useSession()
    const { showBetaFeatures } = useFlags()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [hasApplied, setHasApplied] = useState(false)
    const [hasLiveStreamer, setHasLiveStreamer] = useState(false)

    useEffect(() => {
        setMounted(true)

        fetch("/api/streamers")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.some(s => s.is_live)) {
                    setHasLiveStreamer(true)
                }
            })
            .catch(() => { })

        async function checkApplication() {
            if (!session?.user?.id) return
            const { data } = await supabase
                .from("recruitment_applications")
                .select("id")
                .eq("user_id", session.user.id)
                .in("status", ["pending", "reviewing", "interview"])
                .limit(1)

            if (data && data.length > 0) setHasApplied(true)
        }

        checkApplication()
    }, [session])

    if (!mounted) {
        return <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-black/50 backdrop-blur-md border-b border-white/10" />
    }

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10 dark">
            <div className="mx-auto max-w-[1600px] h-16 px-4 md:px-6 flex items-center justify-between gap-4 relative">
                <div className="flex items-center gap-2">
                    {/* Botón de Menú Mobile */}
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10 text-white/70 hover:text-white hover:bg-white/5 transition-colors -ml-2">
                                <IconMenu2 className="size-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="bg-zinc-950/95 backdrop-blur-xl border-white/10 p-0 text-white w-[300px]">
                            <SheetHeader className="p-6 border-b border-white/5">
                                <SheetTitle className="text-left">
                                    <div className="relative h-8 w-32">
                                        <Image
                                            src="/assets/brand/logo-texto.webp"
                                            alt="Artic Tempest Logo"
                                            fill
                                            className="object-contain"
                                            sizes="150px"
                                        />
                                    </div>
                                </SheetTitle>
                            </SheetHeader>
                            <div className="p-4 flex flex-col gap-2">
                                {NAV_LINKS.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-[0.98]"
                                        title={link.title}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold tracking-tight">{link.label}</span>
                                            {link.label === "Streamers" && hasLiveStreamer && (
                                                <span className="flex h-2 w-2 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                            )}
                                        </div>
                                        <IconChevronRight className="size-4 text-white/30 group-hover:text-white/70 transition-colors" />
                                    </Link>
                                ))}
                                {session && session.user.roleLevel?.toLowerCase() !== 'invitado' && (
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border border-blue-500/20 transition-all active:scale-[0.98]"
                                    >
                                        <div className="flex flex-col gap-1 text-left">
                                            <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest leading-none">Acceso Raider</span>
                                            <span className="font-bold tracking-tight text-white">Zona Raider</span>
                                        </div>
                                        <IconShieldCheck className="size-5 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                                    </Link>
                                )}
                                {session && hasApplied && (
                                    <Link
                                        href="/reclutamiento/apply-en-curso"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="group flex items-center justify-between p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/10 transition-all active:scale-[0.98]"
                                    >
                                        <div className="flex flex-col gap-1 text-left">
                                            <span className="text-[10px] font-black uppercase text-blue-400/60 tracking-widest leading-none">Tu Proceso</span>
                                            <span className="font-bold tracking-tight text-white">Revisar mi aplicación</span>
                                        </div>
                                        <IconFileSearch className="size-4 text-blue-400" />
                                    </Link>
                                )}
                                {!session && (
                                    <>
                                        <div className="h-px bg-white/5 my-2 mx-4" />
                                        <Link
                                            href="/login"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="group flex items-center justify-between p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/10 transition-all active:scale-[0.98]"
                                        >
                                            <span className="font-black uppercase text-[10px] tracking-widest text-blue-400">Acceso Miembros</span>
                                            <IconUser className="size-4 text-blue-400/70" />
                                        </Link>
                                    </>
                                )}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 to-transparent">
                                <p className="text-[10px] text-white/20 font-medium uppercase tracking-[0.2em]">Artic Tempest Hermandad</p>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Link href="/" className="flex items-center shrink-0">
                        <div className="relative h-9 w-36 md:h-12 md:w-48 transition-all">
                            <Image
                                src="/assets/brand/logo-texto.webp"
                                alt="Artic Tempest Logo"
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 150px, 200px"
                                priority
                            />
                        </div>
                    </Link>
                </div>

                {/* Nav Desktop */}
                <div className="hidden lg:flex items-center gap-8">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-white/70 hover:text-white transition-colors relative"
                            title={link.title}
                        >
                            {link.label}
                            {link.label === "Streamers" && hasLiveStreamer && (
                                <span className="absolute -top-0.5 -right-3 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            )}
                        </Link>
                    ))}

                    {showBetaFeatures && (
                        <Link
                            href="/beta/raiders-hub"
                            className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-600/20 transition-all"
                            title="Prueba las nuevas herramientas para Raiders"
                        >
                            <IconFlame className="size-3 animate-pulse text-blue-400" />
                            Raiders Hub (BETA)
                        </Link>
                    )}

                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        {session ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-white/10 hover:bg-white/5 p-0 overflow-hidden ring-offset-zinc-950 focus-visible:ring-2 focus-visible:ring-blue-500">
                                        <Image
                                            src={session.user.avatarUrl || `https://ui-avatars.com/api/?name=${session.user.username}&background=0D8ABC&color=fff`}
                                            alt={session.user.username || "Avatar"}
                                            fill
                                            className="object-cover"
                                        />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 mt-2 bg-zinc-900/95 backdrop-blur-xl border-white/10 text-white" align="end">
                                    <div className="flex items-center justify-start gap-2 p-2">
                                        <div className="flex flex-col space-y-0.5">
                                            <p className="text-sm font-bold leading-none">{session.user.username}</p>
                                            <p className="text-xs leading-none text-white/40">{session.user.username}</p>
                                        </div>
                                    </div>
                                    <DropdownMenuSeparator className="bg-white/5" />
                                    <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white cursor-pointer py-2.5">
                                        <Link href="/mis-personajes" className="flex items-center w-full">
                                            <IconUser className="mr-2 h-4 w-4 text-blue-400" />
                                            <span>Mis Personajes</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="focus:bg-white/5 focus:text-white cursor-pointer py-2.5">
                                        <Link href="/dashboard" className="flex items-center w-full">
                                            <IconDashboard className="mr-2 h-4 w-4 text-blue-400" />
                                            <span>Panel de Control</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/5" />
                                    <DropdownMenuItem 
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="focus:bg-red-500/10 focus:text-red-400 text-red-400/80 cursor-pointer py-2.5"
                                    >
                                        <IconLogout className="mr-2 h-4 w-4" />
                                        <span>Cerrar Sesión</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button
                                asChild
                                variant="outline"
                                className="hidden sm:flex rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-white transition-all px-6 active:scale-95"
                            >
                                <Link href="/login">Acceso</Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Nav Mobile Right (Login small) */}
                <div className="flex lg:hidden items-center gap-3">
                    <NotificationBell />
                    {session ? (
                        <Link href="/dashboard" className="relative h-9 w-9 rounded-full border border-white/10 overflow-hidden active:scale-90 transition-transform">
                            <Image
                                src={session.user.avatarUrl || `https://ui-avatars.com/api/?name=${session.user.username}&background=0D8ABC&color=fff`}
                                alt={session.user.username || "Avatar"}
                                fill
                                className="object-cover"
                            />
                        </Link>
                    ) : (
                        <Button
                            asChild
                            variant="outline"
                            className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white h-9 px-4 text-xs font-bold active:scale-90 transition-transform"
                        >
                            <Link href="/login">Acceso</Link>
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    )
}
