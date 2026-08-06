import 'server-only';
import { createClient } from '@supabase/supabase-js';

const {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_SERVICE_ROLE,
} = process.env;

export const SUPABASE_ADMIN_URL =
  NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL || '';
export const SUPABASE_ADMIN_KEY =
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE || '';

if (!SUPABASE_ADMIN_URL || !SUPABASE_ADMIN_KEY) {
  console.error('❌ Error: Falta configuración de Supabase (URL o Key)');
}

export const supabaseAdmin = createClient(
  SUPABASE_ADMIN_URL,
  SUPABASE_ADMIN_KEY,
  {
    auth: { persistSession: false },
  },
);
