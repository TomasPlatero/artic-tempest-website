# 🧭 GuildBoard – Dashboard de Hermandad para World of Warcraft

[![Lint](https://github.com/TomasPlatero/guildboard/actions/workflows/lint.yml/badge.svg?branch=Master)](https://github.com/TomasPlatero/guildboard/actions/workflows/lint.yml)
![Vercel Deploy](https://deploy-badge.vercel.app/vercel/guildboard)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**GuildBoard** es un panel web avanzado diseñado para hermandades de *World of Warcraft*. Permite centralizar la gestión del roster, la planificación de raids, y la sincronización de personajes mediante la API de **Battle.net**, proporcionando una interfaz moderna, rápida y personalizada.

---

## ⚙️ Tecnologías principales

| Componente | Descripción |
|-------------|-------------|
| 🧩 **Next.js 16.1.6 (Turbopack)** | Última versión del framework React con App Router. |
| ⚛️ **React 19.2.4** | La última versión estable de la librería de interfaces. |
| 🛡️ **Battle.net API** | Integración oficial para sincronizar hermandades, personajes y rangos. |
| 🔐 **NextAuth.js 4.24** | Autenticación doble vía OAuth2 con Discord y Battle.net. |
| 🗄️ **Supabase 2.57** | Backend-as-a-Service (PostgreSQL, Auth, RLS, Storage). |
| 🎨 **TailwindCSS 4.1.13** | Estilos modernos con soporte nativo para variables CSS. |
| 🧱 **shadcn/ui** | Base de componentes visuales de alta calidad. |
| 🔔 **Sileo 0.1.4** | Sistema de notificaciones (toasts) premium. |
| 🏎️ **Radix UI / Lucide** | Componentes de bajo nivel e iconos modernos. |
| 🏗️ **dnd-kit 6.3** | Motor de arrastrar y soltar para planificación de raids. |

---

## 🏗️ Arquitectura del Proyecto

```text
src/
 ├─ app/
 │   ├─ login/                # Acceso mediante Discord
 │   ├─ dashboard/
 │   │   ├─ calendario/       # Vista mensual interactiva de raids
 │   │   ├─ roster/           # Gestión avanzada de miembros
 │   │   ├─ ajustes/          # Configuración de rangos y hermandad
 │   │   └─ cuenta/           # Vinculación Battle.net y personajes
 │   └─ api/                  # Endpoints de sincronización, notas, roles y eventos
 ├─ components/
 │   ├─ calendar/             # Lógica de grid mensual y diálogos de raid
 │   ├─ roster/               # Filtros y lógica de cliente para miembros
 │   ├─ settings/             # Gestión de nombres de rango y visibilidad
 │   ├─ common/               # RosterTable, Sidebar, etc.
 │   └─ ui/                   # Librería base (Radix UI)
 ├─ infrastructure/
 │   ├─ auth/                 # Configuración de roles y sesión
 │   ├─ bnet/                 # Cliente API Battle.net
 │   └─ raiderio/             # Utilidades para Raider.io (Progreso)
 └─ types/                    # Tipado global de Supabase y WoW
```

---

## 🌟 Funcionalidades Implementadas

### 📅 Planificación Avanzada de Raids
- **Calendario Mensual**: Visualización interactiva de eventos programados, con horas y contadores de asistentes.
- **Horarios Recurrentes (Schedules)**: Configuración automática de días de raideo (Lunes a Domingo) que sincroniza y genera eventos para el roster automáticamente.
- **Editor Drag & Drop**: Gestión fluida de los asistentes arrastrándolos entre las columnas de *Activos* y *En Cola* (`dnd-kit`).
- **Seguimiento de Buffs**: Panel integrado al editor para ver qué bufos obligatorios de banda te faltan según la composición actual del roster.
- **Selección de Bosses**: Especifica qué bosses concretos se van a intentar abatir en cada evento.

### 👥 Gestión de Roster
- **Sincronización BNet**: Importación masiva de miembros desde Battle.net Automáticamente.
- **Personalización de Rangos**: Cambia los nombres de los rangos (0-9) y su visibilidad en el calendario.
- **Filtros Inteligentes**: Oculta rangos irrelevantes o alters en tiempo real.
- **Edición en Línea**: Modifica roles predeterminados (Tanque, Healer, DPS) y añade notas privadas al instante.

### ⚖️ Privacidad y Seguridad (RGPD / LOPD)
- **Gestión Avanzada de Cookies**: Integración con `vanilla-cookieconsent` nativo para permitir opciones granulares y legales de privacidad.
- **Protección de Sesiones**: Cumplimiento del nivel estricto LOPD reduciendo el tiempo máximo de sesión (`maxAge`) a 24 horas para garantizar la seguridad de la cuenta logueada con Battle.net/Discord.

### 🔗 Integraciones
- **Discord OAuth2**: Identificación segura vinculada a tu servidor.
- **Battle.net OAuth2**: Sincroniza tus propios personajes con tu cuenta de usuario.

---

## 🔐 Variables de Entorno

Copia `.env.local.sample` como `.env.local` y rellena los campos:

```env
# --- NEXTAUTH ---
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=                  # Generar con openssl rand -base64 32

# --- DISCORD ---
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_GUILD_ID=

# --- BATTLE.NET ---
BNET_CLIENT_ID=
BNET_CLIENT_SECRET=

# --- SUPABASE ---
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # ¡Solo uso en servidor!
```

---

## 🗃️ Base de Datos e Infraestructura

El proyecto utiliza **Supabase CLI** para gestionar el esquema mediante migraciones progresivas:

1. `npm install` para instalar dependencias.
2. `npm run dev` para lanzar el servidor con Turbopack.
3. `npm run db:push` para desplegar el esquema en tu instancia de Supabase.

### Estructura de tablas clave:
- `profiles`: Datos de usuario vinculados por `discord_id`.
- `guild_members`: Base de datos extendida de personajes de la hermandad.
- `guild_events`: Almacén de raids y eventos sociales.
- `guild_rank_visibility`: Mapeo de nombres y estados de visibilidad para los rangos WoW.

---

## 💬 Roadmap (Próximas funcionalidades)

- [ ] Integración de **Raider.io** para ver progreso de mítica+ y bandas en la tabla.
- [ ] Sistema de **Asistencias** con confirmación desde Discord.
- [ ] Panel de **Auditoría** (ver quién necesita piezas de equipo específicas).
- [ ] **Vault Semanal**: Seguimiento de los personajes que han hecho sus piedras.

---

## 🧑‍💻 Desarrollado por

**Zatoshi**  
Guild Master de *Artic Tempest (EU-Dun Modr)*  
🌐 [www.artictempest.es](https://www.artictempest.es)
