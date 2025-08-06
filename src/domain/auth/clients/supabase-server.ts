import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // En Next.js 14+ cookies.set acepta objeto con nombre y valores
              cookieStore.set({ name, value, ...options });
            });
          } catch {
            // Ignorar si está siendo llamado desde Server Component directamente;
            // el middleware se encarga de sincronizar cookies.
          }
        },
      },
      
    }
  );
}
