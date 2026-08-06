import {
  IconBook,
  IconChecks,
  IconMessages,
  IconUsers,
} from "@/shared/ui/tabler-icons";

export type GuideSectionSlug =
  | "mis-personajes"
  | "notificaciones"
  | "normativa-raider"
  | "camara-semanal";

type GuideSection = {
  slug: GuideSectionSlug;
  title: string;
  icon: React.ReactNode;
  summary: string;
  description: string;
  whatYouCanDo: string[];
  tips: string[];
  faqs: { q: string; a: string }[];
};

const iconClass = "size-5";

export const guideSections: GuideSection[] = [
  {
    slug: "mis-personajes",
    title: "Mis personajes",
    icon: <IconUsers className={iconClass} />,
    summary:
      "Comprueba que tus personajes estan vinculados y listos para usar en la web.",
    description:
      "Esta parte te enseña como mantener tus personajes conectados con Battle.net y como aprovechar esa informacion dentro de Artic Tempest.",
    whatYouCanDo: [
      "Ver que personajes estan vinculados a tu cuenta.",
      "Comprobar cual sera el personaje principal para raids.",
      "Detectar si falta actualizar algun personaje.",
    ],
    tips: [
      "Si acabas de vincular Battle.net, espera unos minutos antes de asumir que algo falla.",
      "Revisa que el nombre y el reino coincidan con el personaje real.",
      "Usa esta zona para confirmar que la web te identifica bien.",
    ],
    faqs: [
      {
        q: "¿No aparece un personaje que deberia salir?",
        a: "Normalmente es por vinculacion incompleta o por un retraso en la sincronizacion. Revisa Cuenta y vuelve a comprobarlo mas tarde.",
      },
      {
        q: "¿Puedo llevar varios personajes?",
        a: "Si, siempre que esten vinculados a tu cuenta. La web usa esa lista para mostrarte las opciones disponibles.",
      },
    ],
  },
  {
    slug: "notificaciones",
    title: "Notificaciones",
    icon: <IconMessages className={iconClass} />,
    summary: "Lee avisos, cambios y recordatorios importantes de la hermandad.",
    description:
      "La bandeja de notificaciones centraliza los comunicados del equipo para que no se pierda nada importante.",
    whatYouCanDo: [
      "Leer avisos nuevos del equipo.",
      "Revisar cambios de hora o de plan.",
      "Marcar mensajes como leidos para limpiar tu bandeja.",
    ],
    tips: [
      "Revisa esta seccion antes de entrar a raid.",
      "Si hay un cambio importante, normalmente aparecera aqui primero.",
      "No ignores los avisos de tipo importante o urgente.",
    ],
    faqs: [
      {
        q: "¿Por que veo avisos sin leer?",
        a: "Porque el sistema te marca lo nuevo para que lo identifiques de un vistazo.",
      },
      {
        q: "¿Si lo marco como leido, desaparece?",
        a: "No desaparece. Solo deja de destacarse como pendiente.",
      },
    ],
  },
  {
    slug: "normativa-raider",
    title: "Normativa Raider",
    icon: <IconBook className={iconClass} />,
    summary: "Las reglas que debes conocer para mantener tu plaza en raid.",
    description:
      "La normativa resume las expectativas de asistencia, comportamiento y organizacion para raiders.",
    whatYouCanDo: [
      "Leer las reglas basicas de asistencia.",
      "Comprobar que entiendes lo que se espera de ti.",
      "Resolver dudas rapidas antes de una raid o reclutamiento.",
    ],
    tips: [
      "Si dudas entre dos opciones, revisa la normativa antes de preguntar.",
      "Mantener la normativa fresca evita malentendidos en raid.",
      "Es la referencia para saber que pasa si llegas tarde o faltas.",
    ],
    faqs: [
      {
        q: "¿Es obligatorio leerla?",
        a: "Si. Es la base para entender como funciona la raid dentro de la hermandad.",
      },
      {
        q: "¿Cambia con el tiempo?",
        a: "Puede cambiar si cambian las normas de la hermandad o el sistema de raid.",
      },
    ],
  },
  {
    slug: "camara-semanal",
    title: "Cámara semanal",
    icon: <IconChecks className={iconClass} />,
    summary: "Sube tu captura de la Gran Cámara para ayudar con el loot.",
    description:
      "Esta seccion se usa para compartir la captura de tu Gran Cámara y facilitar la gestion del botin semanal.",
    whatYouCanDo: [
      "Subir la captura de tu Gran Cámara.",
      "Revisar si la subida quedo registrada.",
      "Ayudar a los oficiales a repartir mejor el botin.",
    ],
    tips: [
      "Sube la captura cuando termines de revisar tus opciones.",
      "Si cambias de personaje principal, asegúrate de subir la captura correcta.",
      "La informacion aqui ayuda a priorizar el loot de forma mas ordenada.",
    ],
    faqs: [
      {
        q: "¿Cuando debo subirla?",
        a: "Cuando quieras dejar claro lo que te ha tocado en la semana, idealmente lo antes posible.",
      },
      {
        q: "¿Si no tengo nada bueno, tambien la subo?",
        a: "Si. La captura sirve para ver el estado real de tu Gran Cámara, tengas mucho o poco loot.",
      },
    ],
  },
];

export const guideSectionMap = Object.fromEntries(
  guideSections.map((section) => [section.slug, section]),
) as Record<GuideSectionSlug, GuideSection>;
