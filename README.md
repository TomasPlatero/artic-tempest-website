# 🧭 GuildBoard – Dashboard de Hermandad para World of Warcraft

**GuildBoard** es un panel web privado desarrollado con **Next.js**, **Supabase** y **NextAuth** que permite a los líderes y oficiales de hermandades de *World of Warcraft* gestionar su roster, permisos y datos sincronizados con **Discord** y **Raider.io**.

---

## ⚙️ Tecnologías principales

| Componente | Descripción |
|-------------|-------------|
| 🧩 **Next.js 14** | Framework React con App Router y renderizado híbrido (SSR/ISR). |
| 🔐 **NextAuth.js** | Autenticación OAuth2 con Discord y Battle.net. |
| 🗄️ **Supabase** | Base de datos PostgreSQL + autenticación + políticas RLS. |
| 🎨 **TailwindCSS** | Sistema de estilos utilitario para la UI. |
| 🧱 **shadcn/ui** | Componentes accesibles y personalizables para la interfaz. |
| 🧰 **TypeScript** | Tipado estático para mayor robustez y escalabilidad. |

---

## 🏗️ Arquitectura

```
src/
 ├─ app/
 │   ├─ login/                # Página de login
 │   ├─ dashboard/            # Dashboard principal (protegido)
 │   ├─ api/
 │   │   └─ auth/[...nextauth]/ # Rutas de NextAuth
 │   └─ layout.tsx            # Layout base con Sidebar + Header
 ├─ infrastructure/
 │   ├─ auth/                 # Opciones de NextAuth + helpers
 │   ├─ lib/                  # Supabase client y utilidades
 │   └─ components/           # Sidebar, Header, Card, etc.
 └─ styles/
     └─ globals.css
```

---

## 🔐 Autenticación

La autenticación usa **NextAuth** con el proveedor **Discord** y obtiene automáticamente los roles del usuario en el servidor de la hermandad:

- `guilds.members.read` permite comprobar si el usuario pertenece al servidor de Discord de la hermandad.  
- El nivel de rol (`gm`, `officer`, `raider`) se asigna en base al rol que tenga dentro del servidor.  
- Los datos del perfil se guardan en la tabla `profiles` de Supabase.

> ⚠️ La clave `SUPABASE_SERVICE_ROLE_KEY` **solo se usa en el backend** (rutas con `runtime = "nodejs"`).  
> No debe ser accesible desde el cliente.

---

## 🧾 Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# --- NEXTAUTH ---
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=changeme

# --- DISCORD ---
DISCORD_CLIENT_ID=xxxxxxxxxxxxxxxxxx
DISCORD_CLIENT_SECRET=xxxxxxxxxxxxxxxxxx
DISCORD_GUILD_ID=xxxxxxxxxxxxxxxxxx
DISCORD_REQUESTED_SCOPES=identify guilds guilds.members.read

# --- SUPABASE ---
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

> 💡 Ejemplo en el repo: `.env.local.sample`  
> **Nunca comitees `.env.local`** con valores reales.

---

## 🚀 Puesta en marcha

### 1️⃣ Instalar dependencias
```bash
npm install
# o
pnpm install
```

### 2️⃣ Ejecutar en desarrollo
```bash
npm run dev
```
Accede en: [http://localhost:3000](http://localhost:3000)

### 3️⃣ Build de producción
```bash
npm run build
npm run start
```

---

## 🗃️ Base de datos (Supabase)

### Tablas principales
- **profiles:** Usuarios autenticados vinculados a Discord.
- **discord_roles:** Catálogo de roles del servidor (FK de `profiles.discord_role_id`).
- **guilds_managed:** Datos de la hermandad (nombre, región, realm, miembros, etc).

### Políticas RLS
- Solo los **oficiales** y **GM** pueden ver y editar todos los perfiles.
- Los **raiders** solo pueden ver su propio perfil.

> Si alteras el tipo de columnas usadas en policies, **desactiva temporalmente la RLS** antes de ejecutar el `ALTER TABLE`.

### Migraciones (Supabase CLI)

El proyecto usa **Supabase CLI** para gestionar el esquema de base de datos con migraciones versionadas.

```
supabase/
  ├─ config.toml                              # Configuración local
  ├─ migrations/
  │   └─ 20260221000000_initial_schema.sql    # Migración inicial
  └─ seed.sql                                 # Datos iniciales
```

#### Configuración inicial (una sola vez)

```bash
# 1. Crear un Access Token en https://supabase.com/dashboard/account/tokens

# 2. Configurar el token (PowerShell)
$env:SUPABASE_ACCESS_TOKEN="tu-token-aquí"

# 3. Enlazar con el proyecto remoto
npx supabase link --project-ref vrniyndhfaawwqzcrqng
```

#### Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run db:push` | Aplica las migraciones pendientes al proyecto remoto. |
| `npm run db:reset` | Resetea la base de datos y re-aplica todas las migraciones + seed. |
| `npm run db:new nombre` | Crea un nuevo archivo de migración con timestamp. |
| `npm run db:status` | Muestra el estado de las migraciones (aplicadas/pendientes). |

#### Flujo para cambios en la base de datos

```bash
# 1. Crear una nueva migración
npm run db:new add_events_table

# 2. Editar el archivo generado en supabase/migrations/

# 3. Aplicar al proyecto remoto
npm run db:push
```

> ⚠️ **Nunca edites migraciones ya aplicadas.** Si necesitas corregir algo, crea una nueva migración con los cambios.

---

## 🧩 Roles y permisos

| Rol | Permisos |
|------|-----------|
| 🧙‍♂️ Guild Master (`gm`) | Acceso total al dashboard y configuración. |
| 🛡️ Officer (`officer`) | Gestión de roster y miembros. |
| ⚔️ Raider (`raider`) | Acceso de lectura a su propio perfil. |

---

## 🧹 Mantenimiento

- 🔄 **CRON Supabase:** Actualiza datos de Raider.io y sincroniza con Discord.
- 🧽 **Purge automático de Storage:** Todos los miércoles (Europe/Madrid).
- 🛠️ **Seed inicial:** Inserta roles base en `discord_roles` antes de conectar el auth.

---

## 💬 Próximas funcionalidades

- [ ] Integración con **Raider.io** (progreso de banda y M+).
- [ ] Sistema de **Vault semanal**.
- [ ] Gestión de **Roster** con permisos.
- [ ] Panel de **reclutamiento** editable.
- [ ] Sincronización automática de **ranks Discord ↔ roles Supabase**.

---

## 🧑‍💻 Desarrollado por

**Zatoshi**  
Guild Master de *Artic Tempest (EU-Dun Modr)*  
🌐 [www.artictempest.es](https://www.artictempest.es)

---

## 🧱 Licencia

Este proyecto es privado y de uso interno para la hermandad *Artic Tempest*.  
No está destinado a distribución pública.
