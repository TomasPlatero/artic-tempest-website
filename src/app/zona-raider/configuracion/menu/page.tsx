import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { getAppPermission } from "@/shared/auth/permissions";
import { SettingsMenuClient } from "@/domains/settings/components/settings-menu";
import { Forbidden } from "@/shared/components/forbidden";

export default async function SettingsMenuPage() {
	const session = await getCachedServerSession();
	const roleLevel = session?.user?.roleLevel ?? "invitado";
	const { canEdit } = await getAppPermission(roleLevel, "settings-menu");

	if (!canEdit) {
		return <Forbidden />;
	}

	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
			<SettingsMenuClient />
		</div>
	);
}
