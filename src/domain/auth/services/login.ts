'use server';

import { createServerSupabase } from '@/domain/auth/clients/supabase-server';
import { createBrowserSupabase } from '@/domain/auth/clients/supabase-browser';

/**
 * Autenticación por email y contraseña (Server Action).
 * Retorna success o error;
 * La redirección la gestionas en el cliente.
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabase();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Login con OAuth de Discord (cliente).
 * Rol OAuth — se redirige automáticamente al proveedor.
 */
export async function loginWithDiscord(): Promise<{ success: boolean; error?: string }> {
  const supabase = createBrowserSupabase();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      // Opcional: añade redirectTo si necesitas callback personalizada
      // redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
