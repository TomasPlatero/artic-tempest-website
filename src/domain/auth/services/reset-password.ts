"use server";

import { createServerSupabase } from "@/domain/auth/clients/supabase-server";

type Result = { success: true } | { error: string };

export async function resetPassword(password: string): Promise<Result> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }
  return { success: true };
}
