import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { getAppPermission } from "@/shared/auth/permissions";
import { getAuthzSnapshot } from "@/shared/auth/authz";

import { AdminPageHeader } from "@/shared/components/admin-page-header";
import { SeasonRosterClient } from "@/domains/season-roster/components/season-roster-client-wrapper";
import { RAIDER_PAGE_FADE_IN_CLASSES } from "@/shared/components/raider-motion";
import {
	getSeasonRoster,
	getClassNames,
	getAllSpecsByClass,
	enrichWithRaiderIoThumbnails,
} from "@/domains/season-roster/lib/data";
import type { BnetCharacter } from "@/domains/season-roster/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Season2RosterPage() {
	const session = await getCachedServerSession();
	if (!session) redirect("/");

	const authz = await getAuthzSnapshot(session);
	const roleLevel = authz.roleSlug ?? session.user?.roleLevel ?? "member";
	const { canView, canEdit, canManage } = await getAppPermission(
		roleLevel,
		"roster-season-2",
	);

	if (!canView) redirect("/zona-raider");

	// ── Fetch all data in parallel ──
	const [rawEntries, classNames, specsByClass, bnetResult] = await Promise.all([
		getSeasonRoster(),
		getClassNames(),
		getAllSpecsByClass(),
		supabaseAdmin
			.from("bnet_characters")
			.select("id, name, realm, realm_slug, class_id, level, thumbnail_url")
			.eq("user_id", session.user.id)
			.order("level", { ascending: false })
			.order("name", { ascending: true }),
	]);

	// Enrich with Raider.IO thumbnails
	const entries = await enrichWithRaiderIoThumbnails(rawEntries);

	const myBnetCharacters: BnetCharacter[] = (bnetResult.data ?? []).filter(
		(c) => c.class_id != null,
	);

	return (
		<div
			className={`flex w-full flex-1 flex-col gap-6 ${RAIDER_PAGE_FADE_IN_CLASSES}`}
		>
			<AdminPageHeader
				title="ROSTER SEASON 2"
				description="Registro de personajes para Season 2 Midnight"
			/>

			<SeasonRosterClient
				entries={entries}
				classNames={classNames}
				specsByClass={specsByClass}
				currentUserId={session.user.id}
				canEditAll={canEdit}
				canManageAll={canManage}
				myBnetCharacters={myBnetCharacters}
			/>
		</div>
	);
}
