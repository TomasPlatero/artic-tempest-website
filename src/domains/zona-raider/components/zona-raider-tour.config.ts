import type { AppId } from "@/shared/auth/permissions";

export type ZonaRaiderTourRole =
  | 'gm'
  | 'officer'
  | 'raider'
  | 'member'
  | 'trial'
  | 'invitado';

export type ZonaRaiderTourStep = {
  id: string;
  route: string;
  selector: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  roles?: ZonaRaiderTourRole[];
  appId?: AppId;
};

export const desktopZonaRaiderTourSteps: ZonaRaiderTourStep[] = [
  {
    id: 'topnav-home',
    route: '/zona-raider',
    selector: '[data-tour-step="zona-raider-topnav-home"]',
    title: 'Bienvenido a Zona Raider',
    description:
      'Vamos a empezar por la puerta de entrada. Desde aquí tendrás siempre a mano el camino de vuelta, así que no pasa nada si luego te pierdes un poco.',
    estimatedMinutes: 1,
  },
  {
    id: 'topnav-main',
    route: '/zona-raider',
    selector: '[data-tour-step="zona-raider-topnav-main"]',
    title: 'Cómo moverte por Zona Raider',
    description:
      'Piensa en esta zona como el menú principal de la casa: desde aquí entras a lo importante sin tener que buscar demasiado.',
    estimatedMinutes: 1,
  },
  {
    id: 'topnav-user',
    route: '/zona-raider',
    selector: '[data-tour-step="zona-raider-topnav-user"]',
    title: 'Tu cuenta y la ayuda',
    description:
      'Aquí dejamos todo lo que suele venir bien tener cerca: tu cuenta, las notificaciones, las normas básicas y la ayuda por si te atascas en algo.',
    estimatedMinutes: 1,
  },
  {
    id: 'home-banner',
    route: '/zona-raider',
    selector: '[data-tour-step="zona-raider-banner"]',
    title: 'Vista general',
    description:
      'Esta es la foto rápida de lo que está pasando en la hermandad. Si quieres hacerte una idea de cómo va todo, empieza por aquí.',
    estimatedMinutes: 1,
  },
  {
    id: 'zona-raider-promotions',
    route: '/zona-raider',
    selector: '[data-tour-step="zona-raider-promotions"]',
    title: 'Anuncios y descargas',
    description:
      'Aquí solemos dejar cosas útiles y avisos importantes, para que no tengas que ir buscando por distintas páginas.',
    estimatedMinutes: 1,
  },
  {
    id: 'zona-raider-logs',
    route: '/zona-raider',
    selector: '[data-tour-step="zona-raider-logs"]',
    title: 'Lo último que ha pasado',
    description:
      'Aquí ves la actividad reciente sin complicarte: lo más nuevo aparece primero para que puedas ponerte al día rápido.',
    estimatedMinutes: 1,
  },
  {
    id: 'account-page',
    route: '/zona-raider/cuenta',
    selector: '[data-tour-step="account-page"]',
    title: 'Tu perfil',
    description:
      'En esta parte vas a ver qué personajes tienes vinculados a tu cuenta.',
    estimatedMinutes: 1,
  },
  {
    id: 'account-main-character',
    route: '/zona-raider/cuenta',
    selector: '[data-tour-step="account-main-character"]',
    title: 'Elige tu personaje principal',
    description:
      'Si tienes varios personajes, aquí marcas cuál quieres dejar como principal para que el sistema lo tome como referencia.',
    estimatedMinutes: 1,
  },

  {
    id: 'weekly-vault-page',
    route: '/zona-raider/camara-semanal',
    selector: '[data-tour-step="weekly-vault-page"]',
    title: 'La cámara semanal',
    description:
      'Aquí subes tu captura de la semana para que luego sea más fácil repartir el loot sin líos.',
    estimatedMinutes: 1,
    appId: 'weekly-vault',
  },
  {
    id: 'weekly-vault-upload',
    route: '/zona-raider/camara-semanal',
    selector: '[data-tour-step="weekly-vault-upload"]',
    title: 'Subir la captura',
    description:
      'Este es el sitio donde adjuntas la imagen de tu Gran Cámara antes de enviarla.',
    estimatedMinutes: 1,
    appId: 'weekly-vault',
  },
  {
    id: 'weekly-vault-character',
    route: '/zona-raider/camara-semanal',
    selector: '[data-tour-step="weekly-vault-character"]',
    title: 'Elegir el personaje',
    description:
      'Aquí confirmas con qué personaje estás entregando la captura para que no haya dudas.',
    estimatedMinutes: 1,
    appId: 'weekly-vault',
  },
  {
    id: 'weekly-vault-notes',
    route: '/zona-raider/camara-semanal',
    selector: '[data-tour-step="weekly-vault-notes"]',
    title: 'Notas y personaje',
    description:
      'Si quieres añadir una aclaración o dejar claro algo, este es el lugar para hacerlo.',
    estimatedMinutes: 1,
    appId: 'weekly-vault',
  },
  {
    id: 'stats-page',
    route: '/zona-raider/estadisticas?tab=logs',
    selector: '[data-tour-step="stats-page"]',
    title: 'Las estadísticas',
    description:
      'Aquí miramos números y rendimiento para entender mejor cómo va el grupo.',
    estimatedMinutes: 1,
    appId: 'stats',
  },
  {
    id: 'stats-tabs',
    route: '/zona-raider/estadisticas?tab=logs',
    selector: '[data-tour-step="stats-tabs"]',
    title: 'Pestañas de análisis',
    description:
      'Estas pestañas te dejan saltar entre distintas formas de revisar la actividad del equipo.',
    estimatedMinutes: 1,
    appId: 'stats',
  },
  {
    id: 'stats-logs',
    route: '/zona-raider/estadisticas?tab=logs',
    selector: '[data-tour-step="stats-logs-panel"]',
    title: 'Registros recientes',
    description:
      'Aquí puedes abrir los últimos reportes y revisar lo que pasó en combate con calma.',
    estimatedMinutes: 1,
    appId: 'stats',
  },
  {
    id: 'stats-armory',
    route: '/zona-raider/estadisticas?tab=armeria',
    selector: '[data-tour-step="stats-armory-panel"]',
    title: 'Armería M+',
    description:
      'Este panel te ayuda a ver de un vistazo el nivel, la clase, el rol y las mejores rutas de cada jugador.',
    estimatedMinutes: 1,
    appId: 'stats',
  },
  {
    id: 'professions',
    route: '/zona-raider/profesiones',
    selector: '[data-tour-step="professions-page"]',
    title: 'Profesiones',
    description:
      'Aquí revisamos qué profesiones tiene cada uno para organizar mejor consumibles y cosas útiles para la raid.',
    estimatedMinutes: 1,
    appId: 'professions',
  },
  {
    id: 'professions-filters',
    route: '/zona-raider/profesiones',
    selector: '[data-tour-step="professions-filters"]',
    title: 'Filtros de profesiones',
    description:
      'Sirven para ir directo a lo que buscas cuando quieres mirar una profesión, un rol o una cobertura concreta.',
    estimatedMinutes: 1,
    appId: 'professions',
  },
  {
    id: 'professions-coverage',
    route: '/zona-raider/profesiones',
    selector: '[data-tour-step="professions-coverage"]',
    title: 'Cobertura',
    description:
      'Con este bloque ves rápido qué aporta cada profesión y qué huecos puede haber en el grupo.',
    estimatedMinutes: 1,
    appId: 'professions',
  },
  {
    id: 'professions-table',
    route: '/zona-raider/profesiones',
    selector: '[data-tour-step="professions-table"]',
    title: 'Tabla de cobertura',
    description:
      'La tabla te deja claro quién puede cubrir cada necesidad sin tener que revisar persona por persona.',
    estimatedMinutes: 1,
    appId: 'professions',
  },
  {
    id: 'notifications',
    route: '/zona-raider/notificaciones',
    selector: '[data-tour-step="notifications-page"]',
    title: 'Notificaciones',
    description:
      'Aquí te van llegando avisos, recordatorios y cambios importantes para que no se te escape nada.',
    estimatedMinutes: 1,
  },
  {
    id: 'tour-farewell',
    route: '/zona-raider',
    selector: '[data-tour-step="zona-raider-help-button"]',
    title: 'Gracias por revisar el tour',
    description:
      'Y con esto cerramos. Si más adelante te surge cualquier duda, recuerda que tienes la Ayuda de Zona Raider en el botón de abajo a la derecha.',
    estimatedMinutes: 1,
  },
];
