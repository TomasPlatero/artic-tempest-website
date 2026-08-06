import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/shared/seo/json-ld";
import { LandingFooter } from "@/domains/landing/components/footer";
import { LandingNavigation } from "@/domains/landing/components/navigation";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { getStreamerResources } from "@/domains/streamers/lib/resources";
import {
  IconDownload,
  IconPhoto,
  IconSparkles,
  IconArrowLeft,
} from "@/shared/ui/tabler-icons";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artictempest.es";

export const metadata: Metadata = {
  title: "Recursos para streamers | Artic Tempest",
  description:
    "Descarga banners y logos oficiales de Artic Tempest para tus directos, overlays y escenas.",
  alternates: {
    canonical: "/streamers/recursos",
  },
  openGraph: {
    title: "Recursos para streamers | Artic Tempest",
    description:
      "Banners y logos oficiales listos para descargar y usar en tus directos.",
    type: "website",
    url: `${baseUrl}/streamers/recursos`,
  },
};

export default async function StreamerResourcesPage() {
  const resources = await getStreamerResources();

  return (
    <div className="min-h-dvh bg-zinc-950 text-white selection:bg-cyan-500/30 dark flex flex-col animate-fade-in animate-duration-slow motion-reduce:animate-none">
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", url: baseUrl },
          { name: "Streamers", url: `${baseUrl}/streamers` },
          { name: "Recursos", url: `${baseUrl}/streamers/recursos` },
        ]}
      />
      <LandingNavigation />

      <main className="flex-1 mt-20">
        <section className="mx-auto max-w-7xl px-4 py-10 md:py-16">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 md:p-12 shadow-2xl shadow-cyan-950/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_35%)]" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  <IconSparkles className="size-4" />
                  Kit oficial para streamers
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl">
                    Recursos Streamers
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                    Recursos oficiales listos para usar en tus directos. Cada
                    tarjeta muestra su resolución y un botón de descarga rápida.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Button asChild variant="publicGhost" size="public">
                  <Link href="/streamers">
                    <IconArrowLeft className="size-4" />
                    Volver a streamers
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => (
              <Card
                key={resource.fileName}
                className="group relative h-full min-h-[31rem] overflow-hidden border-white/10 bg-white/[0.04]  hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${resource.accent}`}
                />
                <CardHeader className="gap-3 p-6 pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <CardTitle className="text-xl font-semibold tracking-tight text-white">
                        {resource.title}
                      </CardTitle>
                      <CardDescription className="max-w-sm text-sm leading-6 text-white/60">
                        {resource.description}
                      </CardDescription>
                    </div>
                    <span className="rounded-full border border-white/10 bg-zinc-950/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                      PNG
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="flex h-full flex-col gap-5 p-6 pt-5">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/30">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.09),transparent_55%)]" />
                    <Image
                      src={resource.src}
                      alt={resource.title}
                      width={resource.width}
                      height={resource.height}
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="relative size-full object-contain p-4"
                    />
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/20 px-4 py-3 text-sm text-white/75">
                    <IconPhoto className="size-4 text-cyan-300" />
                    Resolución:{" "}
                    <span className="font-semibold text-white">
                      {resource.resolution}
                    </span>
                  </div>

                  <div className="mt-auto grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button
                      asChild
                      variant="landingPrimary"
                      size="public"
                      className="w-full rounded-2xl"
                    >
                      <a href={resource.src} download={resource.fileName}>
                        <IconDownload className="size-4" />
                        Descargar
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="publicGhost"
                      size="public"
                      className="w-full rounded-2xl"
                    >
                      <a href={resource.src} target="_blank" rel="noreferrer">
                        Ver archivo
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
