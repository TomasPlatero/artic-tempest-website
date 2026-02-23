# AGENTS.md

Este documento describe los agentes automatizados y asistentes de IA involucrados en el ciclo de vida del desarrollo del proyecto **GuildBoard**.

---

## 🎯 Objetivo

Mantener un registro claro y auditable de las herramientas inteligentes, automatizadas o asistidas por IA que intervienen en los procesos de desarrollo, integración, despliegue y mantenimiento del sistema.

---

## 🤖 Agentes y Asistentes

- **Intervención humana requerida**: ✅

---

### 2. **Antigravity (Google DeepMind)**
- **Tipo**: Agente de IA avanzado (LLM).
- **Rol**: Planificación, ejecución de código, refinamiento de UI, debugging y mantenimiento de documentación.
- **Limitaciones**:
  - Requiere aprobación del usuario para ejecutar comandos del sistema.
  - Opera dentro del contexto proporcionado por el usuario.
- **Intervención humana requerida**: ✅

---

### 2. **GitHub Copilot**
- **Tipo**: Asistente de autocompletado inteligente.
- **Rol**: Autocompletado contextual de código, comentarios y tests.
- **Limitaciones**: No realiza cambios automáticos ni tiene acceso al repositorio.
- **Intervención humana requerida**: ✅

---

### 3. **GitHub CLI (`gh`)**
- **Tipo**: Herramienta de línea de comandos oficial de GitHub.
- **Rol**:
  - Creación de PRs desde terminal.
  - Gestión de issues y revisiones.
  - Ejecución de flujos locales de integración.
- **Intervención humana requerida**: ✅

---

### 4. **Dependabot**
- **Tipo**: Bot de seguridad y mantenimiento de dependencias.
- **Rol**:
  - Escaneo de vulnerabilidades en `package.json`, `pnpm-lock.yaml`, etc.
  - Propuesta automática de PRs con versiones seguras.
- **Limitaciones**:
  - No fusiona PRs sin aprobación humana.
- **Intervención humana requerida**: ✅

---

### 5. **GitHub Actions**
- **Tipo**: Plataforma de CI/CD.
- **Rol**:
  - Ejecutar tests, linters y despliegues.
  - Validar integridad tras cambios en ramas `develop` y `main`.
- **Limitaciones**: Puede fallar si hay errores en tests o dependencias.
- **Intervención humana requerida**: 🚫 (automatizado tras cada push)

---

### 6. **Raider.io Sync (Personalizado)**
- **Tipo**: Agente personalizado de sincronización.
- **Rol**:
  - Sincronización periódica (cron) con API de Raider.io.
  - Descarga de rankings y perfiles de hermandad.
  - Cacheo de datos en Redis o base de datos.
- **Limitaciones**:
  - Puede requerir tokens válidos y manejo de rate limits.
- **Intervención humana requerida**: 🚫 (salvo configuración inicial o errores)

---

### 7. **Battle.net OAuth Flow (Middleware)**
- **Tipo**: Servicio de autenticación externo.
- **Rol**:
  - Autenticación de usuarios mediante Battle.net.
  - Obtención de personajes y validación de permisos de hermandad.
- **Limitaciones**:
  - Dependencia directa de la API externa y expiración de tokens.
- **Intervención humana requerida**: 🚫 (después de configuración inicial)

---

## ✅ Buenas prácticas

- Ningún commit generado por un agente de IA o bot se fusiona automáticamente sin revisión.
- Se mantiene trazabilidad de los commits generados por agentes mediante prefijos o mensajes estándar (`chore(deps):`, `bot:`...).
- Todas las tareas periódicas se registran con logs auditables.

---

## 🧩 Última revisión

**22 de febrero de 2026** — Documento actualizado tras la implementación de las fases de Roster, Calendario y Battle.net. Actualiza este archivo si introduces nuevos agentes o cambian las responsabilidades de los existentes.

---