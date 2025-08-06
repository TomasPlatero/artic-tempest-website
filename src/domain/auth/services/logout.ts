'use server';

import { createServerSupabase } from "@/domain/auth/clients/supabase-server";

export async function logout() {
  const supabase = await createServerSupabase();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
