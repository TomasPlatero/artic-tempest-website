import { flag } from 'flags/next';
import { cookies } from 'next/headers';

/**
 * Helper to decide the value of a flag based on:
 * 1. Environment variables (Local/Build time)
 * 2. URL/Cookie Overrides (User specific)
 * 3. Default fallback (Vercel Panel)
 */
async function decideFlag(key: string, defaultValue: boolean = false) {
    // 1. Check for manual environment variable (Local)
    const envVar = process.env[`FLAGS_${key.toUpperCase()}`];
    if (envVar === 'true') return true;
    if (envVar === 'false') return false;

    // 2. Check for Manual URL Override (via Cookie set in middleware/proxy)
    const cookieStore = await cookies();
    const override = cookieStore.get(key)?.value;
    if (override === 'true') return true;
    if (override === 'false') return false;

    // 3. Fallback to default (This is what Vercel mostly uses)
    return defaultValue;
}

export const showBetaFeatures = flag({
  key: 'showBetaFeatures',
  defaultValue: false,
  origin: '/.well-known/vercel/flags',
  description: 'Muestra características experimentales en la navegación (ej. Raiders Hub)',
  options: [{ value: false, label: 'Oculto' }, { value: true, label: 'Visible' }],
  async decide() { return decideFlag('showBetaFeatures', false); },
});

// --- APPS FLAGS ---

export const enableRoster = flag({
    key: 'enableRoster',
    defaultValue: true,
    origin: '/.well-known/vercel/flags',
    description: 'Habilita la aplicación de Roster',
    options: [{ value: true, label: 'Habilitado' }, { value: false, label: 'Deshabilitado' }],
    async decide() { return decideFlag('enableRoster', true); },
});

export const enableCalendar = flag({
    key: 'enableCalendar',
    defaultValue: true,
    origin: '/.well-known/vercel/flags',
    description: 'Habilita la aplicación de Calendario',
    options: [{ value: true, label: 'Habilitado' }, { value: false, label: 'Deshabilitado' }],
    async decide() { return decideFlag('enableCalendar', true); },
});

export const enableWishlist = flag({
    key: 'enableWishlist',
    defaultValue: true,
    origin: '/.well-known/vercel/flags',
    description: 'Habilita la aplicación de Lista de Deseos (BiS)',
    options: [{ value: true, label: 'Habilitado' }, { value: false, label: 'Deshabilitado' }],
    async decide() { return decideFlag('enableWishlist', true); },
});

export const enablePlanner = flag({
    key: 'enablePlanner',
    defaultValue: true,
    origin: '/.well-known/vercel/flags',
    description: 'Habilita la aplicación de Planificador de CDs',
    options: [{ value: true, label: 'Habilitado' }, { value: false, label: 'Deshabilitado' }],
    async decide() { return decideFlag('enablePlanner', true); },
});

export const enableStatsLogs = flag({
    key: 'enableStatsLogs',
    defaultValue: true,
    origin: '/.well-known/vercel/flags',
    description: 'Habilita la aplicación de Estadísticas y Logs',
    options: [{ value: true, label: 'Habilitado' }, { value: false, label: 'Deshabilitado' }],
    async decide() { return decideFlag('enableStatsLogs', true); },
});

export const enableWeeklyVault = flag({
    key: 'enableWeeklyVault',
    defaultValue: true,
    origin: '/.well-known/vercel/flags',
    description: 'Habilita la aplicación de Cámara Semanal',
    options: [{ value: true, label: 'Habilitado' }, { value: false, label: 'Deshabilitado' }],
    async decide() { return decideFlag('enableWeeklyVault', true); },
});

// --- ADMIN FLAGS ---

export const enableEconomy = flag({
    key: 'enableEconomy',
    defaultValue: true,
    origin: '/.well-known/vercel/flags',
    description: 'Habilita la gestión de Economía y Donaciones en administración',
    options: [{ value: true, label: 'Habilitado' }, { value: false, label: 'Deshabilitado' }],
    async decide() { return decideFlag('enableEconomy', true); },
});
