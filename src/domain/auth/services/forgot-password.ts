'use server';

import { createServerSupabase } from "@/domain/auth/clients/supabase-server";

type Result = { success: true } | { error: string };

/**
 * Envia el correo de recuperación de contraseña.
 * Este servicio se invoca como Server Action desde el formulario.
 */
export async function sendResetPasswordEmail(
  formData: FormData
): Promise<Result> {
  const email = formData.get("email") as string;
  const supabase = await createServerSupabase();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
