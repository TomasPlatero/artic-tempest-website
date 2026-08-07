# Artic Tempest

[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/artictempest)](https://artictempest.es)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2-3ECF8E?logo=supabase)](https://supabase.com/)
[![Radix UI](https://img.shields.io/badge/Radix_UI-1-8A2BE2?logo=radix-ui)](https://www.radix-ui.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-0055FF?logo=framer)](https://www.framer.com/motion/)
[![Sentry](https://img.shields.io/badge/Sentry-10-362D59?logo=sentry)](https://sentry.io/)
[![Playwright](https://img.shields.io/badge/Playwright-1-2EAD33?logo=playwright)](https://playwright.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest)](https://vitest.dev/)
[![React Doctor](https://img.shields.io/badge/React_Doctor-checked-6E9F18?logo=react)](https://github.com/doctors-of-react/react-doctor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Plataforma web de **Artic Tempest**, una hermandad de World of Warcraft en el reino Dun Modr (EU-Spanish).

## ¿Qué es Artic Tempest?

Somos una hermandad centrada en **PvE de alto nivel** — banda (raids), progreso de míticas plus (M+), y construcción de comunidad. Este sitio es nuestro centro de operaciones digital: conecta a nuestros raiders, reclutas y oficiales en un solo lugar.

## ¿Qué hace este sitio?

- **Contenido público:** página principal, noticias, reclutamiento, progreso, cultura de hermandad, streams y páginas legales.
- **Zona Raider:** gestión de personajes, roster de raids, estadísticas, notificaciones y herramientas para miembros.
- **Reclutamiento:** flujo de aplicación completo, seguimiento de candidatos y panel de oficiales.
- **Administración:** configuración de hermandad, roles y permisos, cuentas, integraciones (Discord, Battle.net) y editor de menú de navegación.

Todo construido con un sistema de roles y permisos granular que permite a cada miembro ver y hacer exactamente lo que corresponde según su rango.

## Stack tecnológico

### Frontend

| Tecnología | Rol |
| --- | --- |
| [Next.js 16](https://nextjs.org/) (App Router) | Framework full-stack con React Server Components, Server Actions, streaming SSR |
| [React 19](https://react.dev/) | Biblioteca de UI |
| [TypeScript 7](https://www.typescriptlang.org/) | Tipado estático |
| [Tailwind CSS 4](https://tailwindcss.com/) | Estilos utility-first |
| [Radix UI](https://www.radix-ui.com/) | Primitivas de UI accesibles y sin estilos (Dialog, DropdownMenu, Select, Tabs, Avatar, Checkbox, Collapsible, Label, Separator, Slot) |
| [Framer Motion](https://www.framer.com/motion/) | Animaciones declarativas |
| [Tiptap](https://tiptap.dev/) | Editor de texto enriquecido extensible basado en ProseMirror |
| [Recharts](https://recharts.org/) | Gráficos y visualización de datos |
| [@dnd-kit](https://dndkit.com/) | Drag & drop accesible |
| [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm) | Renderizado de Markdown |
| [react-arborist](https://github.com/brimdata/react-arborist) | Vista de árbol para jerarquías |
| [SWR](https://swr.vercel.app/) | Fetching de datos con caché y revalidación |
| [next-themes](https://github.com/pacocoursey/next-themes) | Tema claro/oscuro |
| [Sonner](https://sonner.emilkowal.ski/) | Notificaciones toast |
| [@tabler/icons-react](https://tabler.io/icons) | Iconografía |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) + [cva](https://cva.style/) | Utilidades de composición de clases |

### Backend & datos

| Tecnología | Rol |
| --- | --- |
| [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions) + API Routes | Lógica de servidor tipada, mutaciones y endpoints |
| [Supabase](https://supabase.com/) | PostgreSQL gestionado, autenticación, Row Level Security |
| [next-auth](https://next-auth.js.org/) (NextAuth.js 4) | Capa de autenticación unificada |
| Battle.net OAuth | Inicio de sesión con cuenta de Blizzard |
| [jose](https://github.com/panva/jose) | Manejo de JWTs |
| [pg](https://node-postgres.com/) | Conexión directa a PostgreSQL para queries avanzadas |
| WebSockets (`ws`, `bufferutil`, `utf-8-validate`) | Comunicación en tiempo real |

### Seguridad

| Tecnología | Rol |
| --- | --- |
| [Aikido Firewall](https://www.aikido.dev/) | WAF en runtime — protección contra NoSQL injection, path traversal, SSRF y otras amenazas |
| [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) | CAPTCHA invisible sin cookies de tracking |
| [DOMPurify](https://github.com/cure53/DOMPurify) | Sanitización de HTML contra XSS |
| Content Security Policy | Política de seguridad de contenido con nonces por request |
| Row Level Security (Supabase) | Autorización a nivel de base de datos |

### Observabilidad

| Tecnología | Rol |
| --- | --- |
| [Sentry](https://sentry.io/) | Monitoreo de errores, performance y tracing distribuido |
| [Vercel Analytics](https://vercel.com/analytics) | Analítica de tráfico web |
| [Vercel Speed Insights](https://vercel.com/docs/speed-insights) | Métricas de Core Web Vitals |
| [Vercel Flags](https://vercel.com/docs/workflow-collaboration/feature-flags) | Feature flags |

### Email

| Tecnología | Rol |
|---|---|
| [Resend](https://resend.com/) | API de envío de emails transaccionales |

### Testing

| Tecnología | Rol |
| --- | --- |
| [Vitest](https://vitest.dev/) | Tests unitarios y de integración |
| [Playwright](https://playwright.dev/) | Tests end-to-end |
| [Testing Library](https://testing-library.com/) | Tests centrados en el usuario |

### Tooling

| Tecnología | Rol |
| --- | --- |
| [oxlint](https://oxc.rs/docs/guide/usage/linter.html) | Linting ultrarrápido escrito en Rust |
| [Prettier](https://prettier.io/) | Formateo de código |
| [React Compiler](https://react.dev/learn/react-compiler) | Compilación y optimización automática de React |
| [sharp](https://sharp.pixelplumbing.com/) | Optimización de imágenes en build |
| [@next/bundle-analyzer](https://www.npmjs.com/package/@next/bundle-analyzer) | Análisis de tamaño de bundle |

### Despliegue

| Tecnología | Rol |
|---|---|
| [Vercel](https://vercel.com/) | Plataforma de hosting con CI/CD automático, Edge Functions y CDN global |

## Enlaces

- **Sitio en vivo:** [artictempest.es](https://artictempest.es)
- **Repositorio:** [GitHub](https://github.com/TomasPlatero/artic-tempest-website)
