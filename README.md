# 🧭 Artic Tempest – Official Website & Dashboard

[![Lint](https://github.com/TomasPlatero/artic-tempest-website/actions/workflows/lint.yml/badge.svg?branch=Master)](https://github.com/TomasPlatero/artic-tempest-website/actions/workflows/lint.yml)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/artic-tempest-website)](https://artic-tempest-website.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Artic Tempest Website** es la plataforma central estratégica de la hermandad **Artic Tempests** (_EU-Dun Modr_). Diseñada para optimizar la coordinación de bandas y la gestión de miembros, integra directamente los datos oficiales de **Battle.net** para ofrecer una experiencia fluida, rápida y profesional.

---

## 🌟 Funcionalidades Principales

### 📅 Planificación Estratégica

- **Calendario Interactivo**: Visualización completa de eventos de banda con estados de asistencia y contadores en tiempo real.
- **Programación Recurrente**: Sistema inteligente que gestiona los días de raideo semanales, generando eventos automáticamente para mantener la organización del roster.
- **Editor Táctico (Drag & Drop)**: Herramienta avanzada para oficiales que permite organizar grupos de raid con facilidad, gestionando jugadores activos y en reserva de forma visual.

### ⚔️ Optimización de Banda (Min-Max)

- **Tracking de Buffs**: Monitorización en tiempo real de los bufos de clase obligatorios. El sistema detecta automáticamente qué beneficios faltan según la composición actual del grupo.
- **Objetivos de Raid**: Selección específica de encuentros y bosses programados para cada sesión.

### 👥 Gestión Inteligente del Roster

- **Sincronización BNet**: Importación automática de miembros y personajes desde la API oficial de Blizzard, manteniendo el roster siempre actualizado.
- **Control de Rangos**: Configuración granular de visibilidad y nombres personalizados para los rangos de la hermandad (0-9).
- **Edición Dinámica**: Gestión de roles (Tank, Heal, DPS), notas privadas para oficiales y filtros de búsqueda instantáneos.

### 🔐 Seguridad y Privacidad

- **Identidad Unificada**: Acceso seguro mediante Discord y vinculación oficial de personajes vía Battle.net OAuth2.
- **Cumplimiento Normativo**: Gestión avanzada de cookies y sesiones protegidas (RGPD/LOPD) para garantizar la seguridad de los datos de los miembros.

---

## 🧑‍💻 Administración

**Zatoshi** – Guild Master de _Artic Tempests_  
🌐 [www.artictempest.es](https://www.artictempest.es)

---

## 🏗️ Arquitectura actual

El proyecto está organizado con una estructura basada en dominio:

- `src/app`: rutas App Router, layouts y endpoints `route.ts`
- `src/domains`: features del producto agrupadas por dominio (`bis`, `calendar`, `recruitment`, `roster`, `settings`, etc.)
- `src/shared`: piezas transversales reutilizables (`ui`, `layout`, `auth`, `supabase`, `integrations`, `tailwind`, `lib`)
- `scripts`: utilidades operativas del proyecto

### Dominios principales

- `src/domains/bis`
- `src/domains/calendar`
- `src/domains/recruitment`
- `src/domains/roster`
- `src/domains/settings`
- `src/domains/notifications`
- `src/domains/landing`

### Shared

- `src/shared/ui`: componentes base de shadcn/ui
- `src/shared/layout`: shell del dashboard y providers
- `src/shared/auth`: configuración de NextAuth, permisos y credenciales
- `src/shared/supabase`: clientes browser/server
- `src/shared/integrations`: conectores externos como Battle.net y Raider.io

---

## 🚀 Desarrollo local

```bash
npm run dev
```

Scripts útiles:

- `npm run lint`
- `npm run type-check`
- `npm run build`
- `npm run discord:init`
