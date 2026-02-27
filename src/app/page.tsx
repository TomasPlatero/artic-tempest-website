'use client'

import { useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session) {
      toast.success('¡Bienvenido!', {
        description: `Conectado como ${session.user?.username ?? 'Usuario'}`,
      })
      router.push('/dashboard')
    }
  }, [status, session, router])

  return (
    <main className="relative min-h-screen bg-black">
      {/* Fondo WoW */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('/assets/images/wow-raid-hero.jpg')",
        }}
      />
      {/* Overlay degradado/nebla */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/60 to-black/90" />

      {/* Aurora/luces suaves */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-10 h-[30rem] w-[30rem] rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Contenido */}
      <section className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center gap-6 p-8">
            {/* Logo + nombre */}
            <div className="flex flex-col items-center gap-3">
              <h1 className="sr-only">GuildBoard - Dashboard de Hermandad para World of Warcraft</h1>
              <div className="relative h-30 w-100">
                <Image
                  src="/assets/brand/logo-texto.png"
                  alt="Logo de GuildBoard - Artic Tempest"
                  fill
                  priority
                />
              </div>
              <Separator />

            </div>

            {/* Botón de login */}
            <Button
              size="lg"
              className="w-full rounded-xl"
              onClick={() => signIn('discord', { callbackUrl: '/' })}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Conectando...' : 'Iniciar sesión con Discord'}
            </Button>

            {/* Pie pequeño */}
            <p className="mt-2 text-center text-xs text-white/50">
              © {new Date().getFullYear()} Artic Tempest · GuildBoard
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
