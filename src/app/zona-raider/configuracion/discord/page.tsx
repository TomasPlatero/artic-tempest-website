import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { getGuildCredentials } from "@/shared/auth/credentials";
import { getAppPermission } from "@/shared/auth/permissions";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { Forbidden } from "@/shared/components/forbidden";
import { createClient } from "@supabase/supabase-js";

const SettingsDiscordClient = dynamic(() =>
	import("@/domains/settings/components/settings-discord").then(
		(mod) => mod.SettingsDiscordClient,
	),
);

export default async function DiscordSettingsPage() {
	const session = await getCachedServerSession();

	if (!session) {
		redirect("/");
	}

	const authz = await getAuthzSnapshot(session);
	const roleLevel = authz.roleSlug ?? session.user?.roleLevel ?? "invitado";
	const { canEdit } = await getAppPermission(roleLevel, "settings-discord");

	if (!canEdit) {
		return <Forbidden />;
	}

	const credentials = await getGuildCredentials();

	// Solo pasar campos públicos al componente cliente; los secretos se gestionan vía PATCH
	const safeCredentials = {
		discord_client_id: credentials.discord_client_id || "",
		discord_client_secret: credentials.discord_client_secret
			? "••••••••••••••••"
			: "",
		discord_app_id: credentials.discord_app_id || "",
		discord_bot_token: credentials.discord_bot_token ? "••••••••••••••••" : "",
		discord_guild_id: credentials.discord_guild_id || "",
		discord_public_key: credentials.discord_public_key || "",
		discord_streams_channel_id: credentials.discord_streams_channel_id || "",
		discord_recruitment_channel_id:
			credentials.discord_recruitment_channel_id || "",
		discord_requested_scopes: credentials.discord_requested_scopes || "",
	};

	const sb = createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{ auth: { persistSession: false } },
	);
	const { data: roles } = await sb
		.from("app_discord_roles")
		.select("role_id, name, level");

	return (
		<SettingsDiscordClient
			initialCredentials={safeCredentials}
			initialRoles={roles || []}
		/>
	);
}
