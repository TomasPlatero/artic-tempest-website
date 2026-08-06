import { notFound } from "next/navigation";
import { GuideLayout } from "@/domains/support/components/guide-layout";
import { IconBook } from "@/shared/ui/tabler-icons";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import {
  guideSectionMap,
  guideSections,
  type GuideSectionSlug,
} from "../guide-data";
import { RAIDER_PAGE_FADE_IN_CLASSES, RAIDER_CARD_REVEAL_CLASSES, RAIDER_STAGGER_DELAY_CLASSES } from "@/shared/components/raider-motion";

const sectionDeepDive: Record<
  GuideSectionSlug,
  {
    zonaRaiderHref: string;
    zonaRaiderLabel: string;
    highlight: string;
    whenToUse: string[];
    commonMistakes: string[];
    practicalFlow: string[];
  }
> = {
  "mis-personajes": {
    zonaRaiderHref: "/zona-raider/cuenta",
    zonaRaiderLabel: "Abrir Cuenta",
    highlight:
      "Aqui revisas si la web esta leyendo bien tu Battle.net y que personajes puede usar para reconocerte.",
    whenToUse: [
      "Despues de vincular Battle.net.",
      "Cuando cambias de main o alt.",
      "Si la web no te muestra un personaje esperado.",
    ],
    commonMistakes: [
      "Pensar que la sincronizacion es instantanea.",
      "Tener un personaje sin vincular y asumir que falla la web.",
      "No revisar el nombre/reino exactos del personaje.",
    ],
    practicalFlow: [
      "Entra en Cuenta y comprueba si el BattleTag esta correcto.",
      "Confirma que los personajes que vas a usar aparecen en la lista.",
      "Si falta uno, espera y vuelve a revisar la sincronizacion.",
    ],
  },
  notificaciones: {
    zonaRaiderHref: "/zona-raider/notificaciones",
    zonaRaiderLabel: "Abrir Notificaciones",
    highlight:
      "Aqui llegan los avisos importantes: cambios, recordatorios y mensajes de la hermandad.",
    whenToUse: [
      "Antes de cada raid.",
      "Cuando te llega un aviso nuevo.",
      "Si quieres comprobar cambios recientes.",
    ],
    commonMistakes: [
      "Ignorar mensajes sin leer.",
      "Asumir que un cambio ya lo has visto en otro sitio.",
      "No revisar avisos importantes antes de conectar.",
    ],
    practicalFlow: [
      "Entra y revisa si hay avisos nuevos sin leer.",
      "Filtra si buscas solo cambios de raid o recordatorios.",
      "Marca lo leido cuando ya lo hayas comprobado.",
    ],
  },
  "normativa-raider": {
    zonaRaiderHref: "/zona-raider/normativa-raider",
    zonaRaiderLabel: "Abrir Normativa Raider",
    highlight:
      "Es el marco de referencia para saber como funciona la raid dentro de Artic Tempest.",
    whenToUse: [
      "Si tienes dudas sobre asistencia o comportamiento.",
      "Antes de entrar a la hermandad como raider.",
      "Cuando haya cambios de normas o prioridades.",
    ],
    commonMistakes: [
      "Pensar que es un texto decorativo.",
      "No revisarla cuando cambian las normas.",
      "Usarla solo cuando hay un problema.",
    ],
    practicalFlow: [
      "Lela completa antes de aceptar el rol de raider.",
      "Guarda mentalmente las partes de horario, asistencia y loot.",
      "Vuelve a ella cuando tengas dudas o cambie algo importante.",
    ],
  },
  "camara-semanal": {
    zonaRaiderHref: "/zona-raider/camara-semanal",
    zonaRaiderLabel: "Abrir Cámara semanal",
    highlight:
      "Sirve para compartir tu captura de la Gran Cámara y ayudar a organizar el loot semanal.",
    whenToUse: [
      "Cuando terminas de revisar la recompensa semanal.",
      "Si quieres dejar constancia de lo que te ha salido.",
      "Cuando el equipo te pida la captura.",
    ],
    commonMistakes: [
      "Subir la captura equivocada.",
      "Pensar que solo hace falta si has tenido buen loot.",
      "No revisar que la subida se registró correctamente.",
    ],
    practicalFlow: [
      "Selecciona el personaje correcto antes de subir la captura.",
      "Adjunta la imagen de tu Gran Cámara.",
      "Comprueba que la subida aparece en el historial.",
    ],
  },
};

export function generateStaticParams() {
  return guideSections.map((section) => ({ section: section.slug }));
}

export default async function GuideSectionPage({
  params,
}: {
  params: Promise<{ section: GuideSectionSlug }>;
}) {
  const { section } = await params;
  const data = guideSectionMap[section];

  if (!data) {
    notFound();
  }

  return (
    <GuideLayout
      title={data.title}
      description={data.description}
      icon={<IconBook className="size-4" />}
      color="text-cyan-400"
      backHref="/zona-raider/guia-zona-raider"
      backLabel="Volver"
    >
      <div className={`space-y-12 ${RAIDER_PAGE_FADE_IN_CLASSES}`}>
        <section className={`rounded-[1.5rem] border border-cyan-500/15 bg-cyan-500/5 p-6 ${RAIDER_CARD_REVEAL_CLASSES}`}>
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-300">
            Lo mas importante
          </p>
          <p className="mt-3 text-white/70 leading-relaxed">
            {sectionDeepDive[section].highlight}
          </p>
          <div className="mt-5">
            <Link
              href={sectionDeepDive[section].zonaRaiderHref}
              className="inline-flex items-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-cyan-200 no-underline transition-colors hover:bg-cyan-400/15"
            >
              {sectionDeepDive[section].zonaRaiderLabel}
            </Link>
          </div>
        </section>

        <section className={`space-y-4 ${RAIDER_CARD_REVEAL_CLASSES} ${RAIDER_STAGGER_DELAY_CLASSES[1]}`}>
          <h2 className="text-2xl font-semibold text-white uppercase tracking-tight">
            Puntos clave
          </h2>
          <ul className="space-y-3 text-white/60">
            {data.whatYouCanDo.map((item) => (
              <li key={item}>{item}</li>
            ))}
            {sectionDeepDive[section].whenToUse.slice(0, 1).map((item) => (
              <li key={item}>{item}</li>
            ))}
            {sectionDeepDive[section].commonMistakes.slice(0, 1).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={`space-y-4 ${RAIDER_CARD_REVEAL_CLASSES} ${RAIDER_STAGGER_DELAY_CLASSES[2]}`}>
          <h2 className="text-2xl font-semibold text-white uppercase tracking-tight">
            Cuando usarlo
          </h2>
          <ul className="space-y-3 text-white/60">
            {sectionDeepDive[section].whenToUse.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={`space-y-4 ${RAIDER_CARD_REVEAL_CLASSES} ${RAIDER_STAGGER_DELAY_CLASSES[3]}`}>
          <h2 className="text-2xl font-semibold text-white uppercase tracking-tight">
            Flujo rapido
          </h2>
          <ul className="space-y-3 text-white/60">
            {sectionDeepDive[section].practicalFlow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={`space-y-4 ${RAIDER_CARD_REVEAL_CLASSES} ${RAIDER_STAGGER_DELAY_CLASSES[4]}`}>
          <h2 className="text-2xl font-semibold text-white uppercase tracking-tight">
            Errores comunes
          </h2>
          <ul className="space-y-3 text-white/60">
            {sectionDeepDive[section].commonMistakes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={`space-y-4 ${RAIDER_CARD_REVEAL_CLASSES} ${RAIDER_STAGGER_DELAY_CLASSES[5]}`}>
          <h2 className="text-2xl font-semibold text-white uppercase tracking-tight">
            Preguntas frecuentes
          </h2>
          <Accordion
            type="single"
            collapsible
            className="rounded-[1.5rem] border border-white/10 bg-zinc-950/20 px-5"
          >
            {data.faqs.map((item) => (
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
