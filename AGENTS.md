# Artic Tempest Web

Next.js 16 App Router site for raid coordination, recruitment, notifications, and member/admin tooling.

## Quick reference

- **Package manager:** npm
- **Build:** `npm run build`
- **Typecheck:** `npm run type-check`
- **Lint:** `npm run lint`
- **React Doctor:** run `npx -y react-doctor@latest . --verbose` before finishing React changes; fix any issues before you stop.
- **Commit/push flow:** the agent handles `gentle_review start → finalize → validate` automatically before `git commit` + `git push origin Master`. No manual review steps needed. No PR or release steps unless the user explicitly asks for them.
- **Before push:** bump `package.json` version and keep `CHANGELOG.md` aligned with the same release version.
- **Version tagging:** when the version crosses a minor or major boundary (e.g. `1.5.25` → `1.6.0`, or `1.6.x` → `2.0.0`), create an annotated tag on that commit: `git tag -a v<version> -m "v<version>"` and push it with `git push origin v<version>`. Patch-only bumps (e.g. `1.6.0` → `1.6.1`) do not need a tag.
- **Supabase schema changes:** use the Supabase MCP tools only; keep migrations and RLS policy changes server-safe. Never use `supabase db push` or any Supabase CLI command that touches the remote database. All SQL changes go through MCP exclusively.

## Where to look

- `docs/index.md` — canonical docs hub
- `docs/setup-workflow.md` — local setup, scripts, validation, repo rules
- `docs/architecture.md` — codebase boundaries and shared systems
- `docs/features-map.md` — route and product-area map
- `docs/public-content.md` — public pages and content areas
- `docs/access-pages.md` — login, maintenance, banned, and error states
- `docs/help-legal-accessibility.md` — help, legal, accessibility, redirects
- `docs/member-zone-raider.md` — member shell and raid operations
- `docs/admin-config.md` — admin/configuration areas
- `docs/shared-systems.md` — auth, permissions, SEO, layout, indexing
- `docs/operations.md` — env vars, deploy, cron, sitemap, robots
- `docs/support.md` — support/contact guidance

## Rules

- Keep technical artifacts in English unless the user explicitly asks otherwise.
- Use factual, repo-backed instructions only; if something is not in the repo, do not invent it.
- Prefer the smallest safe change that solves the real problem.

## Kanban board workflow (`docs/tasks.md`)

Use the Obsidian Kanban board at `docs/tasks.md` as the live task tracker for all work.

### Columns

| Column | Meaning |
| --- | --- |
| 💡 Ideas | Concepts and future features without commitment |
| 📋 Backlog | Concrete tasks pending prioritization |
| 🎯 Siguiente | Prioritized for the current/next cycle |
| 🚧 En curso | Actively being worked on (max 2-3) |
| 👀 Revisión | Done but pending review or testing |
| ✅ Hecho | Completed work |

### When to update

1. **New task assigned** — create the card in 📋 Backlog (or 🎯 Siguiente if clearly prioritized).
2. **Starting work** — move the card to 🚧 En curso.
3. **Work completed** — move through 👀 Revisión (if applicable) then to ✅ Hecho.
4. **Before every commit** — verify the board reflects current state; move done cards to ✅ Hecho.
5. **Archive cada 15 días** — cada 15 días (o cuando se acumulen suficientes tarjetas), mover todas las ✅ Hecho a `docs/tasks-archive.md` bajo un heading con la fecha (ej. `## 2026-07-15`), luego limpiar la columna. Esto mantiene el board ligero sin perder el historial.

Cards can contain checklists, links to code/docs, and free-form notes.

## Zona Raider: new page checklist

Every new page under `/zona-raider/` MUST follow this checklist before shipping:

### 1. Permission app ID (`src/shared/auth/permissions.ts`)

- Add the new app ID to the `AppId` union type (alphabetical order).
- Use `getAppPermission(roleLevel, 'your-new-app-id')` in the page to gate `canView` and `canEdit`.
- The page receives `{ canView, canEdit, canManage }` — do NOT hardcode role checks (`isOfficer`, `['gm','officer'].includes(...)`) unless there is a very specific non-permission reason.

### 2. Role editor UI (`src/domains/settings/components/role-editor.types.ts`)

- Add the new app to `PERMISSION_GROUPS` under the appropriate group.
  - `"core"` — global settings, maintenance
  - `"integrations"` — Discord, Battle.net, APIs, notifications
  - `"content"` — news, widgets
  - `"raider"` — all `/zona-raider/` tools like roster, stats, vault
- This makes it appear in **Configuración → Roles → [rol]** so admins can toggle Ver / Editar / Admin per role.
- **Super admin bypass**: if a role has `is_super_admin = true`, it automatically gets full access to ALL apps regardless of `app_permissions` rows. The toggle UI is disabled for super admin roles. You do NOT need to seed permission rows for super admin.
- **Cross-check**: after adding, run `SELECT DISTINCT app_id FROM app_permissions` against Supabase to ensure no orphan apps exist in the DB that are not in the UI — they'd be configurable via SQL but invisible in the role editor.

### 3. Seed default permissions (Supabase)

- Insert rows into `app_permissions` for non-super-admin roles: at least `officer`, `raider`, `trial`, `member`.
- Convention (gm is covered by super admin or its own row — seeding is safe either way):

  | Role | View | Edit | Manage |
  | --- | --- | --- | --- |
  | gm | ✅ | ✅ | ✅ |
  | officer | ✅ | ✅ | ✅ |
  | raider | ✅ | ✅ | — |
  | trial | ✅ | — | — |
  | member | ✅ | — | — |

- Use `ON CONFLICT (role_level, app_id) DO NOTHING` so re-runs are safe.

### 4. Navigation menu item

- Admin adds the link in **Configuración → Menú**.
- The link URL is the page route (e.g. `/zona-raider/roster/season-2`).
- Assign visibility roles in the menu editor.

### 5. Server actions auth

- Server mutations (`"use server"` functions) check the session and apply business-level authorization (e.g. users can only edit their own data, officers can edit any data).
- This is IN ADDITION to the page-level `canView`/`canEdit` gate — do not rely on the page gate alone for mutations.

- **External integration RGPD/LOPD rule:** whenever a new third-party service, SDK, or external integration is added to the project, you MUST verify and update the following compliance artifacts in the same commit (or flag the gap explicitly if you cannot complete it):
  1. `src/app/privacidad/_components/privacidad-content-sections.tsx` — add the provider to section 4 (Destinatarios) and note relevant cookies/processing in sections 5-7.
  2. `src/app/cookies/_components/cookie-inventory-section.tsx` — add every cookie set by the new integration to the correct category (técnicas/necesarias, funcionales, analítica, or publicidad), including name, type, purpose, duration, and provider.
  3. If the integration involves data transfers outside the EEA, document the transfer mechanism (SCC, DPF, adequacy decision) in both sections.
  4. If it is a security or anti-bot service (e.g., Turnstile, reCAPTCHA, hCaptcha), classify its cookies as strictly necessary under LSSI-CE art. 22.2 — they do not require user consent.

## AI agent rules

- **File search con Everything MCP (OBLIGATORIO).** Siempre que necesites buscar un archivo — por nombre, ruta, extensión, contenido o cualquier criterio — usa PRIMERO y ÚNICAMENTE la herramienta MCP `everything_search`. Si `everything_search` encuentra el archivo, NO uses ninguna otra herramienta de búsqueda (grep, glob, find, fffind, ffgrep, etc.). Es la fuente única y principal para localizar archivos en este proyecto y en todo el sistema.
- **Nunca uses los 4R review lenses.** No están activos en este proyecto. No lances `gentle-ai review start`, no delegues a `review-*` sub-agents, ni ejecutes ningún flujo de revisión adversarial.
- **Nunca agregues spinners, loadings, skeletons ni fallbacks visuales.** `next/dynamic` sin `loading` prop. Sin `Suspense` fallback. Sin estados de carga. El usuario no quiere ver indicadores de carga.
- **Cuando el usuario diga "sube los cambios" (o variantes como "subir", "push", "commit and push"):** ejecuta `gentle_review start` → `finalize` → `validate` → `git commit` → `git push origin Master`. El agente maneja todo el flujo automáticamente.
- **Verification checklist before completing any task:** run `npm run lint`, `npm run type-check`, and `npx -y react-doctor@latest . --verbose`. All three must pass with zero issues. Fix everything — errors AND warnings — no exceptions.
- **Engram project name:** always use `project: "artic-tempest-website"` for mem_* tools. Do NOT pass `ArticTempest-Web`, `guildboard`, or path-based names.
- **CodeGraph:** use `codegraph_explore` / `codegraph_search` (from pi-codegraph-fix extension), NOT the built-in `codegraph` tool (broken on Windows due to path mismatch).
- **Supabase migrations + safety:** load skill `supabase-migration-safety` (`.pi/skills/supabase-migration-safety/SKILL.md`) before ANY migration or SQL execution against prod. The skill enforces 4 gates: destructive pattern scanner → safety wrapper → pre/post verify → user confirmation. **NEVER apply SQL to prod without loading this skill first.**

### Engram mem_search fallback (gentle-engram v0.1.10 bug #672)

**Trigger:** `mem_search` fails with "gentle-engram could not reach the Engram HTTP server" even though Engram IS running (verified via `engram_mem_*` MCP tools or HTTP health check). This is a false timeout in gentle-engram v0.1.10.

**Hard rules:**

1. NO uses `mem_doctor`. El servidor NO está caído.
2. NO reinicies Engram. `mem_context`, `mem_save`, y el resto funcionan.
3. Solo `mem_search` necesita workaround. Las demás `mem_*` tools no.

**Decision gates:**

| Disparador | Acción |
| --- | --- |
| `mem_search` falla + query tiene `_` o `-` | Aplica workaround HTTP inmediatamente |
| `mem_search` falla + query sin `_` o `-` | Reintenta `mem_search` 1 vez. Si sigue fallando, aplica workaround |
| `mem_context` falla | Esto SÍ es raro. Ejecuta `mem_doctor`. Si persiste, reporta caída real |

**Workaround — búsqueda HTTP directa (bash):**

```bash
curl -s "http://127.0.0.1:7437/search?q=QUERY&project=artic-tempest-website&limit=5"
```

**Workaround — búsqueda programática (ctx_execute con JavaScript):**

```javascript
async function engramSearch(query, project = "artic-tempest-website", limit = 5) {
  const url = `http://127.0.0.1:7437/search?q=${encodeURIComponent(query)}&project=${project}&limit=${limit}`;
  const res = await fetch(url);
  const text = await res.text();
  if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
  if (text === "null" || text === "[]") return [];
  return JSON.parse(text);
}
const results = await engramSearch("sdd-init", "artic-tempest-website", 5);
results.forEach(r => console.log(`[${r.id}] ${r.title} (${r.type})\n${r.content?.substring(0, 200)}\n`));
```

**Output contract:**

- Éxito: resultados formateados igual que `mem_search` (ID, título, tipo, primeras 200 chars de content)
- 0 resultados: "0 resultados"
- Error HTTP: "Engram HTTP API error: [status] [body]"

Este workaround se eliminará cuando el [issue #672](https://github.com/Gentleman-Programming/engram/issues/672) esté cerrado.

## Gentle AI review gate

This repo has gentle-ai review hooks active. Every `git commit` and `git push` must pass through the review controller. The Pi agent handles this automatically via `gentle_review`, but here's the manual reference.

### Commit workflow (agent does this)

1. `gentle_review start` with `{"mode":"ordinary"}` → returns `lineage_id`
2. `gentle_review finalize` with lens results, `final_evidence`, and `final_verification_passed: true` → state: `approved`
3. `gentle_review validate` with the EXACT commit command, `lineageId`, `idempotencyKey`, and `input` → `allowed: true`
4. Run the commit: `git commit -m "..."`

### Push workflow

1. `gentle_review validate` with `"git push origin Master"` (same lineage) → `allowed: true`
2. Push: `git push origin Master`

### Troubleshooting

- **Commit blocked:** the `validate` command string must match exactly what you run in bash — command hash is checked.
- **Stale lock:** if `inspect` shows locks from a crashed session, delete `.git/gentle-ai/review-transactions/v2/LOCK`.
- **"Compound or wrapped lifecycle command"**: the bash tool intercepts lifecycle commands. Use `gentle_review validate` first, then run the exact validated command.
- **"Gentle AI pre-commit gate requires..."** : you ran a different command string than what was validated. Re-validate with the correct string.
