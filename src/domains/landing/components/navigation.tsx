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
                                            sizes="128px"
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
                    {session && session.user.roleLevel?.toLowerCase() !== 'invitado' && (
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-3 group px-5 py-2 rounded-xl relative overflow-hidden h-9 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white border border-blue-400/20 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                            title="Ir al panel privado de raiders"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            <div className="flex flex-col items-center justify-center relative z-10 w-full">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Zona Raider</span>
                            </div>
                        </Link>
                    )}
                    {session && hasApplied && (
                        <Link
                            href="/reclutamiento/apply-en-curso"
                            className="flex items-center gap-2 group px-4 py-2 rounded-full border border-blue-500/10 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all"
                            title="Ver el estado de tu aplicación"
                        >
                            <IconFileSearch className="size-4 text-blue-400 group-hover:rotate-12 transition-transform" />
                            <span className="text-sm font-black uppercase tracking-widest text-white/80 group-hover:text-white">Mi Aplicación</span>
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-2 md:gap-4 shrink-0 px-1">
                    <NotificationBell />
                    {session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-white/10 hover:bg-white/5 p-0 overflow-hidden ring-offset-black transition-all">
                                    {session.user.avatarUrl ? (
                                        <Image
                                            src={session.user.avatarUrl}
                                            alt={session.user.username || "Usuario"}
                                            fill
                                            className="object-cover"
                                            sizes="40px"
                                        />
                                    ) : (
                                        <IconUser className="size-5 text-white/70" />
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 bg-zinc-950 border-white/10 text-white p-2 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-2 py-3 flex items-center justify-between gap-4">
                                    <p className="text-sm font-bold truncate">{session.user.username}</p>
                                    <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest whitespace-nowrap">
                                        {session.user.roleLevel?.toUpperCase()}
                                    </span>
                                </div>
                                <DropdownMenuSeparator className="bg-white/10 mb-1" />
                                <DropdownMenuItem asChild className="focus:bg-white/5 cursor-pointer rounded-lg h-10 mb-0.5">
                                    <Link href="/mis-personajes" className="flex items-center gap-2">
                                        <IconUser className="size-4" />
                                        <span>Mis Personajes</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut()} className="focus:bg-rose-500/10 text-rose-400 cursor-pointer rounded-lg h-10">
                                    <IconLogout className="size-4" />
                                    <span>Cerrar Sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            asChild
                            variant="glass"
                            size="sm"
                            className="rounded-full px-6 transition-all min-w-[80px] -mr-2"
                        >
                            <Link href="/login">
                                <span className="hidden xs:inline">Acceso Miembros</span>
                                <span className="xs:hidden">Entrar</span>
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    )
}
