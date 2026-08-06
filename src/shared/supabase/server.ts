import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// This creates an ADMIN client using the SERVICE ROLE KEY.
// It bypasses RLS completely. It MUST ONLY be used in secure background jobs (cron)
// or internal utilities where authorization has ALREADY been strongly verified manually.
export const createAdminClient = async () => {
	const cookieStore = await cookies();

	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL! || process.env.SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY! ||
			process.env.SUPABASE_SERVICE_ROLE! ||
			process.env.SUPABASE_SERVICE_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookieStore.set(name, value, options),
						);
					} catch {
						// setAll from Server Component — safe to ignore (session refresh handled by middleware)
					}
				},
			},
		},
	);
};
