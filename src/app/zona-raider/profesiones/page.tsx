import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { getAppPermission } from "@/shared/auth/permissions";
import { getAuthzSnapshot } from "@/shared/auth/authz";
import dynamicImport from "next/dynamic";
import { getRosterProfessions } from "@/domains/professions/lib/server";
import { RAIDER_PAGE_FADE_IN_CLASSES } from "@/shared/components/raider-motion";

const ProfessionsClient = dynamicImport(() =>
	import("@/domains/professions/components/professions-client").then(
		(mod) => mod.ProfessionsClient,
	),
);

export const metadata: Metadata = {
	title: "Profesiones | Zona Raider",
	description: "Gestión de profesiones de los raiders de Artic Tempest.",
	robots: { index: false, follow: false },
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ZonaRaiderProfessionsPage() {
	const session = await getCachedServerSession();
	if (!session) {
		redirect("/");
	}

	const authz = await getAuthzSnapshot(session);
	const roleLevel = authz.roleSlug ?? session.user?.roleLevel ?? "member";
	const { canView } = await getAppPermission(roleLevel, "professions");

	if (!canView) {
		redirect("/zona-raider");
	}

	const data = await getRosterProfessions();

	return (
		<div
			className={RAIDER_PAGE_FADE_IN_CLASSES}
			data-tour-step="professions-page"
		>
			<ProfessionsClient {...data} />
		</div>
	);
}
