# GuildBoard

[![ESLint](https://img.shields.io/github/actions/workflow/status/TomasPlatero/guildboard/eslint.yml?branch=master&label=ESLint)](https://github.com/TomasPlatero/guildboard/actions)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/TomasPlatero/guildboard/codeql-analysis.yml?branch=master&label=CodeQL)](https://github.com/TomasPlatero/guildboard/actions)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-brightgreen)](https://github.com/TomasPlatero/guildboard/security/dependabot)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://guildboard.vercel.app)

**GuildBoard** es una **webapp privada** para el clan _Artic Tempest_.  
Front en **Next.js** con **Supabase** (Auth/DB/Storage) y **shadcn/ui**.  
Autenticación **exclusivamente con Discord** (sin login por email).

> Producción: `https://guildboard.vercel.app`

---

## Tabla de contenidos

- [Características](#características)
- [Stack técnico](#stack-técnico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Inicio rápido](#inicio-rápido)
- [Configuración](#configuración)
- [Scripts](#scripts)
- [Autenticación y roles](#autenticación-y-roles)
- [Despliegue](#despliegue)
- [Seguridad](#seguridad)
- [Licencia](#licencia)

---

## Características

- **Portada** pública con CTA → **Login Discord** (Supabase OAuth).
- **Dashboard** protegido (SSR) con perfil del usuario y rol interno.
- **RBAC** inicial: `gm`, `officer`, `rl`, `raider_core`, `raider`, `trial`.
- **Tareas programadas** (pg_cron) para purgado semanal de capturas.
- UI con **shadcn/ui** (Tailwind v4) y componentes accesibles.

> Importante: **No** se usa Raider.IO. Los datos externos del juego se integrarán más adelante vía APIs oficiales de **Blizzard** y caché propia.

---

## Stack técnico

- **Framework**: Next.js 15 (App Router) + React 19  
- **UI**: Tailwind CSS v4, shadcn/ui, lucide-react  
- **Datos**: Supabase (Auth, Postgres, Storage, RLS)  
- **Estado**: Server Components + fetch en server  
- **Calidad**: TypeScript, ESLint, Prettier  
- **CI**: GitHub Actions (ESLint, CodeQL)  
- **Infra**: Vercel (front), Supabase (backend gestionado)

---

## Estructura del proyecto

```
/app
  /(marketing)         -> portada pública
  /dashboard           -> zona autenticada (layout + views)
  /api                 -> route handlers server-only (futuro: integraciones)
  /_components         -> componentes compartidos (shadcn/ui wrappers)
/lib
  supabase.ts          -> cliente supabase (browser/server)
/public
/styles                -> estilos globales
```

---

## Inicio rápido

### Requisitos
- Node.js 20+
- Cuenta de Supabase (proyecto creado)
- Proyecto en Vercel (opcional para producción)

### Pasos

1) Clona el repo e instala:
```bash
git clone https://github.com/TomasPlatero/guildboard.git
cd guildboard
npm install
```

2) Crea un `.env.local` a partir de `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```
> **No** subas `.env.local` al repo.

3) Configura **Discord** en Supabase → **Auth → Providers → Discord**  
   - `Redirect URL / Site URL`: `http://localhost:3000` (dev) y `https://guildboard.vercel.app` (prod)  
   - Scopes mínimos: `identify email`  
   - Activa **Save provider tokens** (recomendado)

4) Levanta en local:
```bash
npm run dev
```
Abre `http://localhost:3000`.

---

## Configuración

### Variables de entorno

| Variable                         | Dónde            | Descripción                                |
|----------------------------------|------------------|--------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`       | Vercel / local   | URL del proyecto Supabase                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Vercel / local   | ANON KEY de Supabase                       |

> No uses `NEXT_PUBLIC_*` para secretos de servidor.  
> Blizzard y otras integraciones (server-only) irán sin prefijo `NEXT_PUBLIC_` cuando se añadan.

### Supabase (DB/Storage)

- Tabla `profiles` con RLS.  

> La base ya tiene policies y triggers preparados. Si migras de entorno, aplica los SQL del repo `/supabase/sql`.

---

## Scripts

```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "type-check": "tsc -b",
  "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,md}\""
}
```

Útiles:
- `npm run dev` → desarrollo
- `npm run build && npm start` → producción local
- `npm run lint` / `npm run format` / `npm run type-check`

---

## Autenticación y roles

- Autenticación **solo** con **Discord** vía Supabase.
- Al iniciar sesión se crea/actualiza `public.profiles`.
- Roles internos (`profiles.role`): `gm`, `officer`, `rl`, `raider_core`, `raider`, `trial`.  
- Gating de rutas **en servidor** (SSR). La UI oculta/enseña tarjetas según rol, pero la protección real es server-side.

> Sincronización automática con roles del Discord del clan se tratará más adelante (requiere `guilds.members.read` y mapeo de IDs → `profiles.role`).

---

## Despliegue

- **Vercel**: conecta el repo, añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en “Environment Variables”.
- **Supabase**: en **Auth → URL config** pon la `Site URL` de producción (`https://guildboard.vercel.app`).  
- **Discord developer portal**: registra exactamente los mismos Redirects (`https://guildboard.vercel.app`).

---

## Seguridad

- App **privada** para miembros del clan.  
- RLS activo en tablas sensibles; `role` solo modificable por **GM** (trigger).  
- No se almacenan secretos en el cliente.  
- Revisa `Security Advisor` y `Database Linter` de Supabase después de cada cambio de schema.

> Reporta vulnerabilidades a `taplatero@outlook.es`.

---

## Licencia

MIT — ver [LICENSE](LICENSE).
