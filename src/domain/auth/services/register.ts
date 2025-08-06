import { createBrowserSupabase } from "@/domain/auth/clients/supabase-browser";

type Result = { success: true } | { error: string };

/**
 * Registra al usuario por correo y contraseña,
 * e inserta su perfil con username (igual al email).
 */
export async function registerWithEmail(
  email: string,
  password: string
): Promise<Result> {
  const supabase = createBrowserSupabase();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_SITE_URL + "/verified",
    },
  });

  if (error) return { error: error.message };
  if (!data.user?.id) return { error: "No se creó el usuario" };

  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: data.user.id, username: email });

  if (profileError) return { error: profileError.message };

  return { success: true };
}
