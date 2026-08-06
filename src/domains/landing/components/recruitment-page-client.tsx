"use client";

import { useSession } from "next-auth/react";
import { LandingNavigation } from "@/domains/landing/components/navigation";
import { LandingFooter } from "@/domains/landing/components/footer";
import { Button } from "@/shared/ui/button";
import {
  IconArrowRight,
  IconShieldCheck,
  IconClock,
  IconFlame,
  IconFileSearch,
} from "@/shared/ui/tabler-icons";
import Link from "next/link";
import Image from "next/image";
import { RouteScopedAdsenseSlot } from "@/shared/components/route-scoped-adsense-slot";
import { blurDataUrls } from "@/shared/images/blur-data-urls";

export function RecruitmentPageClient({
  initialHasApplied,
  adsenseClientId,
  adsenseSlot,
  }: {
  initialHasApplied?: boolean;
  adsenseClientId?: string;
  adsenseSlot?: string;
}) {
  const { data: session } = useSession();
  const hasApplied = Boolean(initialHasApplied);
  return (
    <div className="min-h-dvh bg-zinc-950 overflow-x-hidden dark flex flex-col animate-fade-in animate-duration-slow motion-reduce:animate-none">
      <LandingNavigation />

      <main id="main-content" className="flex-1">
        <div className="relative overflow-hidden group">
          {/* Background Image Layer with Native Next.js Optimization */}
          <div className="absolute inset-0 z-0 select-none pointer-events-none opacity-40 scale-105 animate-[slow-zoom_20s_infinite_alternate]">
            <Image
              src="/assets/images/midnight-cinematic.webp"
              alt="midnight-cinematic"
              width={1920}
              height={1080}
              sizes="100vw"
              placeholder="blur"
              blurDataURL={blurDataUrls.midnightCinematic}
              className="absolute inset-0 size-full object-cover object-[center_30%]"
              priority
              quality={90}
            />
          </div>
          {/* Advanced Overlays for Maximum Readability and Premium Look */}
          <div className="absolute inset-0 z-0 bg-linear-to-b from-black via-black/40 to-black pointer-events-none" />
          <div className="absolute inset-0 z-0 bg-linear-to-r from-black via-transparent to-black pointer-events-none" />

          <div className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-12 items-start">
              <div className="flex-1">
                <h1 className="mb-6 text-4xl font-semibold uppercase tracking-[0.18em] drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] md:text-6xl">
                  <span className="text-blue-100">
                    Únete a Artic Tempest
                  </span>
                </h1>
                <p className="text-xl text-blue-100/70 mb-8 max-w-2xl font-medium drop-shadow-lg leading-relaxed">
                  ¿Tienes lo que se necesita para raidear en el nivel más alto?
                  Buscamos jugadores comprometidos, con mentalidad de progreso y
                  capacidad de análisis.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                  <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 h-fit">
                      <IconClock className="size-6" />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="font-semibold text-white text-lg">Horario</h2>
                      <p className="text-sm text-white/50">
                        Lunes a Jueves, 17:30 - 19:30 (Hora servidor).
                      </p>
                      <p className="text-sm text-white/50">
                        El primer mes de cada temporada también raideamos los
                        Viernes (Sujeto a cambio).
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 h-fit">
                      <IconShieldCheck className="size-6" />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="font-semibold text-white text-lg">
                        Estabilidad
                      </h2>
                      <p className="text-sm text-white/50">
                        Grupo formado con gente en Experiencia Mítico y con
                        compromiso.
                      </p>
                    </div>
                  </div>
                </div>

                {session ? (
                  hasApplied ? (
                    <Button
                      size="publicLg"
                      variant="landingTinted"
                      className="group w-full sm:w-auto sm:min-w-[15rem]"
                      asChild
                    >
                      <Link href="/reclutamiento/apply-en-curso">
                        Revisar mi Apply
                        <IconFileSearch className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="publicLg"
                      variant="landingPrimary"
                      className="group w-full sm:w-auto sm:min-w-[15rem]"
                      asChild
                    >
                      <Link href="/reclutamiento/apply">
                        Empezar Apply
                        <IconArrowRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  )
                ) : (
                  <Button
                    asChild
                    size="publicLg"
                    variant="landingPrimary"
                    className="group w-full sm:w-auto sm:min-w-[15rem]"
                  >
                    <Link href="/login">
                      Inicia Sesión para Aplicar
                      <IconArrowRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                )}
              </div>

              <div className="w-full md:w-[450px] space-y-4">
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <IconFlame className="size-20" />
                  </div>
                  <h3 className="text-blue-400 font-semibold mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                    <span className="relative flex size-2">
                      <span className="animate-ping absolute inline-flex size-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full size-2 bg-blue-500"></span>
                    </span>
                    Prioridades de Reclutamiento
                  </h3>
                  <p className="text-sm text-blue-100/70 mb-4 italic">
                    &quot;Valoramos el rendimiento, el compromiso y el buen
                    ambiente.&quot;
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    Requisitos Mínimos
                  </h3>
                  <ul className="space-y-3 font-medium">
                    {[
                      "Experiencia comprobada en contenido Mítico.",
                      "Máxima asistencia posible.",
                      "Dominio absoluto del personaje que vayas a usar.",
                      "Capacidad para optimizar y adaptar la interfaz (addons, auras, etc.).",
                      "Uso obligatorio de addons (WeakAuras, BigWigs/LittleWigs, Method Raid Tools).",
                      "Preparación previa de los encuentros (consumibles, guías).",
                      "Micrófono funcional y presencia en Discord.",
                    ].map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-white/60">
                        <div className="size-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl px-6 pb-10">
          <RouteScopedAdsenseSlot
            pathname="/reclutamiento"
            zoneId="recruitment-inline-1"
            adSlot={adsenseSlot}
            adClient={adsenseClientId}
          />
        </div>

      </main>

      <LandingFooter />
    </div>
  );
}
