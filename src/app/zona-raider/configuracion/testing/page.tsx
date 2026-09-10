import Link from "next/link";
import { IconArrowLeft } from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { Forbidden } from "@/shared/components/forbidden";
import { getAppPermission } from "@/shared/auth/permissions";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import { SettingsTestingClient } from "@/domains/settings/components/settings-testing";
import { STATUSPAGE_COMPONENTS_SETTING_KEY } from "@/shared/integrations/statuspage/statuspage-client";

export const runtime = "nodejs";

export default async function SettingsTestingPage() {
	const session = await getCachedServerSession();
	const authz = session ? await getAuthzSnapshot(session) : null;
	const roleLevel = authz?.roleSlug ?? session?.user?.roleLevel ?? "member";
	const { canView, canEdit, canManage } = await getAppPermission(
		roleLevel,
		"settings-testing",
	);

	if (!canView || !session) {
		return (
			<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
				<Forbidden />
			</div>
		);
	}

	const [
		{ data: settings },
		{ data: characters },
		{ data: statuspageSetting },
	] = await Promise.all([
		supabaseAdmin
			.from("settings")
			.select("recruitment_test_channel_id")
			.eq("id", 1)
			.maybeSingle(),
		supabaseAdmin
			.from("bnet_characters")
			.select("id, name, realm, class_id, spec, level")
			.eq("user_id", session.user.id)
			.order("level", { ascending: false }),
		supabaseAdmin
			.from("app_settings")
			.select("value")
			.eq("key", STATUSPAGE_COMPONENTS_SETTING_KEY)
			.maybeSingle(),
	]);

	let initialComponents: Record<string, string> = {};
	if (statuspageSetting?.value) {
		try {
			initialComponents = JSON.parse(statuspageSetting.value);
		} catch {
			initialComponents = {};
		}
	}

	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
			<div className="flex items-center gap-4">
				<Link
					href="/zona-raider/configuracion"
					aria-label="Volver a configuración"
				>
					<Button
						variant="outline"
						size="icon"
						aria-label="Volver a configuración"
						className="size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 shadow-xl"
					>
						<IconArrowLeft className="size-6" />
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-semibold font-heading italic tracking-tight flex items-center gap-3">
						TESTING
					</h1>
					<p className="text-sm font-medium text-white/40 mt-2 tracking-widest leading-relaxed">
						Autodiagnósticos y pruebas del sistema.
					</p>
				</div>
			</div>

			<SettingsTestingClient
				initialChannelId={settings?.recruitment_test_channel_id ?? ""}
				initialComponents={initialComponents}
				characters={
					(characters ?? []) as {
						id: string;
						name: string;
						realm: string;
						level: number;
						class_id: number;
						spec: string;
					}[]
				}
				canEdit={canEdit}
				canManage={canManage}
			/>
		</div>
	);
}
