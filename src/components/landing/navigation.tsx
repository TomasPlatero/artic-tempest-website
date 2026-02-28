"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { IconUser, IconDashboard, IconLogout, IconMenu2 } from "@tabler/icons-react"
import { NotificationBell } from "@/components/notifications/notification-bell"

export function LandingNavigation() {
    const { data: session } = useSession()

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <div className="relative h-12 w-48">
                        <Image
                            src="/assets/brand/logo-texto.webp"
                            alt="Artic Tempest Logo"
                            fill
                            className="object-contain"
                        />
                    </div>
                </Link>

                <div className="hidden md:flex items-center gap-8">
                    <Link href="/#progreso" className="text-sm font-medium text-white/70 hover:text-white transition-colors" title="Consulta nuestro progreso en Midnight">Progreso</Link>
                    <Link href="/#reclutamiento" className="text-sm font-medium text-white/70 hover:text-white transition-colors" title="Mira las clases que necesitamos en Artic Tempest">Reclutamiento</Link>
                    <Link href="/#historia" className="text-sm font-medium text-white/70 hover:text-white transition-colors" title="Conoce la trayectoria de nuestra hermandad">Nuestra Historia</Link>
                </div>

                <div className="flex items-center gap-4">
                    <NotificationBell />
                    {session ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-white/10 hover:bg-white/5 p-0 overflow-hidden ring-offset-black">
                                    {session.user.avatarUrl ? (
                                        <Image
                                            src={session.user.avatarUrl}
                                            alt={session.user.username || "Usuario"}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <IconUser className="size-5 text-white/70" />
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 bg-zinc-950 border-white/10 text-white p-2">
                                <div className="px-2 py-3 flex items-center justify-between gap-4">
                                    <p className="text-sm font-bold truncate">{session.user.username}</p>
                                    <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest whitespace-nowrap">
                                        {session.user.roleLevel?.toUpperCase()}
                                    </span>
                                </div>
                                <DropdownMenuSeparator className="bg-white/10 mb-1" />
                                <DropdownMenuItem asChild className="focus:bg-white/5 cursor-pointer">
                                    <Link href="/mis-personajes" className="flex items-center gap-2">
                                        <IconUser className="size-4" />
                                        <span>Mis Personajes</span>
                                    </Link>
                                </DropdownMenuItem>
                                {session.user.roleLevel?.toLowerCase() !== 'invitado' && (
                                    <DropdownMenuItem asChild className="focus:bg-white/5 cursor-pointer">
                                        <Link href="/dashboard" className="flex items-center gap-2">
                                            <IconDashboard className="size-4" />
                                            <span>Panel de Miembro</span>
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => signOut()} className="focus:bg-rose-500/10 text-rose-400 cursor-pointer">
                                    <IconLogout className="size-4" />
                                    <span>Cerrar Sesión</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            variant="glow"
                            size="sm"
                            onClick={() => signIn('discord')}
                            className="rounded-full px-6"
                        >
                            Acceso Miembros
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    )
}
