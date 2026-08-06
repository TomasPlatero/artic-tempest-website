import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { getAppPermission } from "@/shared/auth/permissions";
import dynamic from "next/dynamic";
import { Forbidden } from "@/shared/components/forbidden";

const SettingsNewsClient = dynamic(() =>
	import("@/domains/settings/components/settings-news").then(
		(mod) => mod.SettingsNewsClient,
	),
);

export default async function SettingsNewsPage() {
	const session = await getCachedServerSession();
	const roleLevel = session?.user?.roleLevel ?? "member";
	const { canEdit } = await getAppPermission(roleLevel, "settings-news");

	if (!canEdit) {
		return <Forbidden />;
	}

	const [{ data: news, error }, { data: categories }] = await Promise.all([
		supabaseAdmin
			.from("news")
			.select("*")
			.order("created_at", { ascending: false }),
		supabaseAdmin.from("news_categories").select("*").order("name"),
	]);

	if (error) {
		console.error("[NEWS_SETTINGS_FETCH]", error);
	}

	return (
		<div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 lg:px-8">
			<SettingsNewsClient
				initialNews={news || []}
				categories={categories || []}
				currentUser={session?.user?.username || ""}
			/>
		</div>
	);
}
