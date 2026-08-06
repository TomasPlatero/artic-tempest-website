// src/app/zona-raider/configuracion/general/page.tsx
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { SettingsGeneralClient } from "@/domains/settings/components/settings-general";
import React from "react";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { getGuildCredentials } from "@/shared/auth/credentials";
import { getAuthzSnapshot } from "@/shared/auth/authz";

import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";

export const runtime = "nodejs";

const MASK = "••••••••••••••••";

async function getGeneralData() {
	const [{ data: settings }, credentials] = await Promise.all([
		supabaseAdmin
			.from("settings")
			.select(
				"name, realm, region, icon_url, mobile_icon_url, public_logo_url, version, tour_enabled",
			)
			.eq("id", 1)
			.maybeSingle(),
		getGuildCredentials(),
	]);

	return {
		guild: settings
			? {
					name: settings.name,
					realm: settings.realm,
					region: settings.region,
					iconUrl: settings.icon_url,
					mobileIconUrl: settings.mobile_icon_url,
					publicLogoUrl: settings.public_logo_url,
					version: settings.version || "Zona Raider",
				}
			: null,
		tourEnabled: settings?.tour_enabled ?? true,
		credentials: {
			discord_client_id: credentials.discord_client_id || "",
			discord_client_secret: credentials.discord_client_secret ? MASK : "",
			discord_guild_id: credentials.discord_guild_id || "",
			bnet_client_id:
				credentials.bnet_client_id || process.env.BNET_CLIENT_ID || "",
			bnet_client_secret: credentials.bnet_client_secret
				? MASK
				: process.env.BNET_CLIENT_SECRET
					? MASK
					: "",
			wcl_client_id:
				credentials.wcl_client_id || process.env.WCL_CLIENT_ID || "",
			wcl_client_secret: credentials.wcl_client_secret
				? MASK
				: process.env.WCL_CLIENT_SECRET
					? MASK
					: "",
			sources: {
				discord: (credentials.sources?.discord ?? "db") as "db" | "env",
				bnet: (credentials.sources?.bnet ?? "env") as "db" | "env",
				api: (credentials.sources?.api ?? "env") as "db" | "env",
			},
		},
	};
}

export default async function SettingsGeneralPage() {
	const session = await getCachedServerSession();
	const authz = session ? await getAuthzSnapshot(session) : null;
	const roleLevel = authz?.roleSlug ?? session?.user?.roleLevel ?? "invitado";
	const settingsPermission = await getAppPermission(roleLevel, "settings");

	if (!settingsPermission.canView) {
		return <Forbidden />;
	}

	const data = await getGeneralData();

	return (
		<SettingsGeneralClient
			guild={data.guild}
			credentials={data.credentials}
			tourEnabled={data.tourEnabled}
			permissions={{
				general: settingsPermission,
			}}
		/>
	);
}
