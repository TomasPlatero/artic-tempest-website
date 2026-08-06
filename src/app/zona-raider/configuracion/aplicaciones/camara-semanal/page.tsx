import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { redirect } from "next/navigation";
import { WeeklyVaultAdminClient } from "./components/weekly-vault-admin-client";
import { Suspense } from "react";
import { IconArrowLeft, IconCamera } from "@/shared/ui/tabler-icons";
import Link from "next/link";
import { Button } from "@/shared/ui/button";

import { Forbidden } from "@/shared/components/forbidden";
import { getAppPermission } from "@/shared/auth/permissions";
import { SpinnerFallback } from "@/shared/ui/skeletons";

export default async function WeeklyVaultAdminPage() {
	const session = await getCachedServerSession();
	if (!session) {
		redirect("/");
	}

	const roleLevel = session?.user?.roleLevel ?? "member";
	const { canView } = await getAppPermission(roleLevel, "weekly-vault-admin");

	if (!canView) {
		return (
			<div className="flex flex-col gap-6 py-6 px-4 lg:px-6 w-full">
				<Forbidden />
			</div>
		);
	}

	// Fetch data for the client component
	const { data: uploads } = await supabaseAdmin
		.from("weekly_vault_screenshots")
		.select(`
            id, created_at, week_start, image_url, profile_id, character_id,
            profiles(discord_username, discord_avatar),
            bnet_characters(name, class_id, realm_slug)
        `)
		.order("created_at", { ascending: false });

	return (
		<div className="flex flex-col gap-6 py-6 px-4 lg:px-6 w-full animate-in fade-in duration-500">
			<div className="flex items-start md:items-center gap-3 md:gap-4">
				<Link href="/zona-raider/configuracion/aplicaciones">
					<Button
						variant="outline"
						size="icon"
						className="size-10 md:size-12 rounded-xl bg-white/5 border-white/10 hover:bg-white/10  shadow-xl shrink-0"
					>
						<IconArrowLeft className="size-5 md:size-6" />
					</Button>
				</Link>
				<div className="flex-1 min-w-0">
					<h1 className="text-xl sm:text-2xl md:text-3xl font-semibold font-heading italic tracking-tight flex items-center gap-2 md:gap-3 flex-wrap">
						<IconCamera className="size-6 md:size-8 text-white/50 shrink-0" />
						<span>GESTIÓN CÁMARA SEMANAL</span>
					</h1>
					<p className="text-xs sm:text-sm font-medium text-white/40 mt-1 md:mt-2 tracking-widest leading-relaxed">
						Revisa el loot que ha salido en la Gran Cámara a los miembros de la
						hermandad.
					</p>
				</div>
			</div>

			<Suspense fallback={<SpinnerFallback label="Cargando capturas…" />}>
				<WeeklyVaultAdminClient initialUploads={uploads || []} />
			</Suspense>
		</div>
	);
}
