import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  IconBrandDiscord,
  IconBrandX,
  IconBrandYoutube,
} from "@/shared/ui/tabler-icons";
import { isMaintenanceEnabled } from "@/flags";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estamos en mantenimiento | Artic Tempest",
  description: "Estamos preparando la web para que vuelva aún mejor.",
  alternates: {
    canonical: "/mantenimiento",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const SOCIAL_LINKS = [
  {
    href: "https://discord.artictempest.es/",
    label: "Discord",
    icon: IconBrandDiscord,
  },
  {
    href: "https://x.com/artictempestWoW",
    label: "X",
    icon: IconBrandX,
  },
  {
    href: "https://www.youtube.com/@ArticTempestTV",
    label: "YouTube",
    icon: IconBrandYoutube,
  },
] as const;

export default async function MaintenancePage() {
  if (!(await isMaintenanceEnabled())) {
    redirect("/");
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#0a0806] text-white">
      <div className="absolute inset-0">
        <Image
          src="/assets/images/mantenimiento.webp"
          alt="Fondo de mantenimiento de Artic Tempest"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-55 scale-105"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_38%),linear-gradient(to_bottom,rgba(10,8,6,0.35),rgba(10,8,6,0.92))]" />
        <div className="absolute inset-0 bg-linear-to-b from-black/25 via-black/35 to-[#0a0806]" />
      </div>

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-5 py-12">
        <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#120f0c]/78 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-10">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/assets/brand/logo-texto.webp"
              alt="Artic Tempest"
              width={360}
              height={120}
              priority
              className="h-14 w-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)] sm:h-16"
            />

            <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-5xl">
              Estamos en mantenimiento
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              Estamos haciendo algunos cambios, volveremos lo antes posible.
            </p>

            <div className="mt-10 w-full">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/35">
                Síguenos mientras tanto
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left  hover:border-amber-300/25 hover:bg-white/[0.07]"
                    aria-label={`Visítanos en ${label}`}
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white/80 transition-colors group-hover:bg-amber-400/10 group-hover:text-amber-200">
                      <Icon className="size-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-white">
                        {label}
                      </span>
                      <span className="block text-xs text-white/45">
                        Únete a la comunidad
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
