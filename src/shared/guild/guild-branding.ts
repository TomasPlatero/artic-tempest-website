import { unstable_cache } from "next/cache";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
export { DEFAULT_PUBLIC_LOGO } from "./guild-constants";

export type GuildBranding = {
	name: string;
	icon_url: string | null;
	public_logo_url: string | null;
} | null;

async function fetchGuildBrandingInternal(): Promise<GuildBranding> {
	const { data } = await supabaseAdmin
		.from("settings")
		.select("name, icon_url, public_logo_url")
		.eq("id", 1)
		.maybeSingle();

	return data ?? null;
}

export const getGuildBranding = unstable_cache(
	fetchGuildBrandingInternal,
	["guild-branding-singleton"],
	{
		revalidate: 60,
	},
);
