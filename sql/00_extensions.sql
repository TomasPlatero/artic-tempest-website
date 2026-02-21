-- 00_extensions.sql
-- Extensiones comunes (idempotentes) para Supabase/Postgres
-- Ejecutar con privilegios suficientes (SQL Editor de Supabase)

create extension if not exists "uuid-ossp" with schema public;
create extension if not exists "pgcrypto" with schema public;
