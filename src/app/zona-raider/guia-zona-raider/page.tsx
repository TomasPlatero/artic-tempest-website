import { GuideLayout } from "@/domains/support/components/guide-layout";
import {
  IconBell,
  IconBook,
  IconCamera,
  IconHome,
  IconFileText,
  IconUsers,
} from "@/shared/ui/tabler-icons";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { RAIDER_PAGE_FADE_IN_CLASSES, RAIDER_CARD_REVEAL_CLASSES, RAIDER_STAGGER_DELAY_CLASSES } from "@/shared/components/raider-motion";

const pageTitle = "Guía Zona Raider | Artic Tempest";
const pageDescription =
  "Mini wiki funcional de Zona Raider: que hace cada seccion y como usarla.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: 'https://artictempest.es/zona-raider/guia-zona-raider' },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    type: "website",
    url: "https://artictempest.es/zona-raider/guia-zona-raider",
    siteName: "Artic Tempest",
    images: ["/assets/images/artic-tempest-og.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: ["/assets/images/artic-tempest-og.webp"],
  },
};

const faqs = [
  {
    q: "¿No veo algunas secciones de Zona Raider. Es normal?",
    a: "Si. Algunas partes solo aparecen si tu rango tiene permiso. No significa que tengas un error.",
  },
  {
    q: "¿Mis personajes no salen en la cuenta. Que hago?",
    a: "Entra en Cuenta y revisa la vinculacion de Battle.net. Si acabas de vincularla, espera unos minutos.",
  },
  {
    q: "¿Donde confirmo que voy a la raid?",
    a: "El Raid Leader es quien gestiona el roster. Consulta las notificaciones para estar al tanto de los eventos programados.",
  },
  {
    q: "¿Donde leo las normas de raid?",
    a: "En Normativa Raider, dentro de Zona Raider. Es la referencia rapida para dudas de asistencia y comportamiento.",
  },
];

const cards = [
  {
    title: "Inicio",
    icon: IconHome,
    summary:
      "Es tu resumen rapido. Aqui ves tu estado, tus personajes, la proxima raid y accesos directos a las partes mas usadas.",
  },
  {
    title: "Mis personajes",
    icon: IconUsers,
    summary:
      "Sirve para comprobar si tu Battle.net esta vinculada y gestionar los personajes que usa la web para identificarte.",
    href: "/zona-raider/guia-zona-raider/mis-personajes",
  },
  {
    title: "Notificaciones",
    icon: IconBell,
    summary:
      "Es la bandeja donde recibes avisos importantes, cambios de eventos y mensajes del equipo.",
    href: "/zona-raider/guia-zona-raider/notificaciones",
  },
  {
    title: "Normativa Raider",
    icon: IconFileText,
    summary:
      "Aqui tienes las reglas que debes conocer para entrar y mantenerte en el equipo de raid.",
    href: "/zona-raider/guia-zona-raider/normativa-raider",
  },
  {
    title: "Cámara semanal",
    icon: IconCamera,
    summary:
      "Si esta disponible para tu rol, sirve para subir la captura de tu Gran Cámara y ayudar con la distribucion de loot.",
    href: "/zona-raider/guia-zona-raider/camara-semanal",
  },
];

export default function ZonaRaiderGuidePage() {
  return (
    <GuideLayout
      title="Guía de la Zona Raider"
      description="Para que no te pierdas por la Zona Raider, aqui se explica que hace cada parte de esta zona exclusiva para los raiders de Artic Tempest."
      icon={<IconBook className="size-4" />}
      color="text-cyan-400"
      showBackLink={false}
    >
      <div className={`space-y-12 ${RAIDER_PAGE_FADE_IN_CLASSES}`}>
        <section className={`space-y-4 ${RAIDER_CARD_REVEAL_CLASSES}`}>
          <h2 className="text-2xl font-semibold text-white uppercase tracking-tight">
            Que es Zona Raider
          </h2>
          <p className="leading-relaxed text-white/60">
            Zona Raider es tu centro de mando dentro de Artic Tempest. Desde
            aqui puedes revisar tu actividad, preparar las raids y ver lo que
            necesitas para jugar al dia con la hermandad.
          </p>
        </section>

        <section className={`space-y-4 ${RAIDER_CARD_REVEAL_CLASSES} ${RAIDER_STAGGER_DELAY_CLASSES[1]}`}>
          <h2 className="text-2xl font-semibold text-white uppercase tracking-tight">
            Aplicaciones e Información para Raiders
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {cards.map((item) => {
              const Icon = item.icon;
              const content = (
                <>
                  <div className="flex items-center gap-4 min-h-12 text-white">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300 shrink-0">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="!m-0 text-lg font-semibold uppercase tracking-tight leading-none -translate-y-px">
                      {item.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">
                    {item.summary}
                  </p>
                </>
              );

              return item.href ? (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 no-underline transition-colors hover:border-cyan-400/30 hover:bg-white/[0.05] ${RAIDER_CARD_REVEAL_CLASSES}`}
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={item.title}
                  className={`rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 ${RAIDER_CARD_REVEAL_CLASSES}`}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </section>

        <section className={`space-y-4 ${RAIDER_CARD_REVEAL_CLASSES} ${RAIDER_STAGGER_DELAY_CLASSES[2]}`}>
          <h2 className="text-2xl font-semibold text-white uppercase tracking-tight">
            Preguntas frecuentes
          </h2>
          <Accordion
            type="single"
            collapsible
            className="rounded-[1.5rem] border border-white/10 bg-zinc-950/20 px-5"
          >
            {faqs.map((item) => (
              <AccordionItem
                key={item.q}
                value={item.q}
                className="border-white/10"
              >
                <AccordionTrigger className="hover:no-underline py-3 text-white text-[12px] md:text-sm font-semibold uppercase tracking-tight leading-relaxed">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4 text-sm leading-relaxed text-white/60">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </GuideLayout>
  );
}
