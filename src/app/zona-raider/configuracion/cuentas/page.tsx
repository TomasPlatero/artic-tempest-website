// src/app/zona-raider/configuracion/cuentas/page.tsx
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { AccountsClient } from "@/domains/settings/components/accounts-client";
import { IconArrowLeft } from "@/shared/ui/tabler-icons";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";

import { getAppPermission } from "@/shared/auth/permissions";
import { Forbidden } from "@/shared/components/forbidden";
import { getPresenceMap, isUserOnline } from "@/shared/lib/presence";

export const dynamic = "force-dynamic";

export default async function AccountsSettingsPage() {
	const session = await getCachedServerSession();
	const roleLevel = session?.user?.roleLevel ?? "invitado";
	const { canEdit } = await getAppPermission(roleLevel, "settings-accounts");

	if (!canEdit) {
		return <Forbidden />;
	}

	const [{ data: profiles }, { data: charCounts }, { data: roles }] =
		await Promise.all([
			supabaseAdmin
				.from("profiles")
				.select("*")
				.order("discord_username", { ascending: true }),
			supabaseAdmin.from("bnet_characters").select("user_id"),
			supabaseAdmin
				.from("app_roles")
				.select(
					"level,label,description,priority,color,can_access_zona_raider,can_use_raider_app,is_super_admin,is_admin",
				)
				.order("priority", { ascending: false }),
		]);

	const countMap: Record<string, number> = {};
	charCounts?.forEach((c) => {
		countMap[c.user_id] = (countMap[c.user_id] || 0) + 1;
	});

	const profilesWithCounts =
		profiles?.map((p) => ({
			...p,
			character_count: countMap[p.user_id] || 0,
		})) || [];

	const presenceMap = await getPresenceMap(
		profilesWithCounts.map((profile) => profile.user_id),
	);

	const enrichedProfiles = profilesWithCounts.map((profile) => {
		const lastSeen = presenceMap[profile.user_id] ?? null;
		const isOnline = isUserOnline(lastSeen);
		return {
			...profile,
			is_online: isOnline,
			last_online_at: lastSeen ? new Date(lastSeen).toISOString() : null,
		};
	});

	return (
		<div className="flex flex-col gap-6 p-6 lg:px-8 w-full max-w-full">
			<div className="flex items-center gap-6">
				<Link href="/zona-raider/configuracion">
					<Button
						variant="outline"
						size="icon"
						className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10  shadow-xl"
					>
						<IconArrowLeft className="size-6" />
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-semibold font-heading italic tracking-tight flex items-center gap-3">
						GESTIÓN DE CUENTAS
					</h1>
					<p className="text-sm font-medium text-white/40 mt-2 tracking-widest leading-relaxed">
						Gestión de cuentas de la web.
					</p>
				</div>
			</div>
			<AccountsClient initialProfiles={enrichedProfiles} roles={roles ?? []} />
		</div>
	);
}
