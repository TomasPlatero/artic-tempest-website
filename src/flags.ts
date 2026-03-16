import { flag } from '@vercel/flags/next';
import { vercelAdapter } from '@flags-sdk/vercel';

export const showBetaFeatures = flag({
  key: 'showBetaFeatures',
  defaultValue: false,
  origin: '/.well-known/vercel/flags',
  description: 'Muestra características experimentales en la navegación (ej. Raiders Hub)',
  options: [
    { value: false, label: 'Oculto' },
    { value: true, label: 'Visible' },
  ],
  adapter: vercelAdapter(),
});

// --- APPS FLAGS ---

export const enableRoster = flag({
  key: 'enableRoster',
  defaultValue: true,
  origin: '/.well-known/vercel/flags',
  description: 'Habilita la aplicación de Roster',
  options: [
    { value: true, label: 'Habilitado' },
    { value: false, label: 'Deshabilitado' },
  ],
  adapter: vercelAdapter(),
});

export const enableCalendar = flag({
  key: 'enableCalendar',
  defaultValue: true,
  origin: '/.well-known/vercel/flags',
  description: 'Habilita la aplicación de Calendario',
  options: [
    { value: true, label: 'Habilitado' },
    { value: false, label: 'Deshabilitado' },
  ],
  adapter: vercelAdapter(),
});

export const enableWishlist = flag({
  key: 'enableWishlist',
  defaultValue: true,
  origin: '/.well-known/vercel/flags',
  description: 'Habilita la aplicación de Lista de Deseos (BiS)',
  options: [
    { value: true, label: 'Habilitado' },
    { value: false, label: 'Deshabilitado' },
  ],
  adapter: vercelAdapter(),
});

export const enablePlanner = flag({
  key: 'enablePlanner',
  defaultValue: true,
  origin: '/.well-known/vercel/flags',
  description: 'Habilita la aplicación de Planificador de CDs',
  options: [
    { value: true, label: 'Habilitado' },
    { value: false, label: 'Deshabilitado' },
  ],
  adapter: vercelAdapter(),
});

export const enableStatsLogs = flag({
  key: 'enableStatsLogs',
  defaultValue: true,
  origin: '/.well-known/vercel/flags',
  description: 'Habilita la aplicación de Estadísticas y Logs',
  options: [
    { value: true, label: 'Habilitado' },
    { value: false, label: 'Deshabilitado' },
  ],
  adapter: vercelAdapter(),
});

export const enableWeeklyVault = flag({
  key: 'enableWeeklyVault',
  defaultValue: true,
  origin: '/.well-known/vercel/flags',
  description: 'Habilita la aplicación de Cámara Semanal',
  options: [
    { value: true, label: 'Habilitado' },
    { value: false, label: 'Deshabilitado' },
  ],
  adapter: vercelAdapter(),
});

// --- ADMIN FLAGS ---

export const enableEconomy = flag({
  key: 'enableEconomy',
  defaultValue: true,
  origin: '/.well-known/vercel/flags',
  description: 'Habilita la gestión de Economía y Donaciones en administración',
  options: [
    { value: true, label: 'Habilitado' },
    { value: false, label: 'Deshabilitado' },
  ],
  adapter: vercelAdapter(),
});
