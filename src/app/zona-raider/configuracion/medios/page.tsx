import { getCachedServerSession } from "@/shared/auth/get-cached-server-session";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { redirect } from "next/navigation";
import Link from "next/link";
import { IconArrowLeft, IconPhoto } from "@/shared/ui/tabler-icons";
import { Button } from "@/shared/ui/button";
import { Forbidden } from "@/shared/components/forbidden";
import { getAppPermission } from "@/shared/auth/permissions";
import { MediaLibraryClient } from "@/domains/media/components/media-library-client";
import type { MediaFolder } from "@/domains/media/types";

export default async function MediaLibraryPage() {
	const session = await getCachedServerSession();
	if (!session) {
		redirect("/");
	}

	const roleLevel = session?.user?.roleLevel ?? "member";
	const { canView, canEdit, canManage } = await getAppPermission(
		roleLevel,
		"media-library",
	);

	if (!canView) {
		return (
			<div className="flex flex-col gap-6 py-6 px-4 lg:px-6 w-full">
				<Forbidden />
			</div>
		);
	}

	// Fetch folders
	const { data: folders } = (await supabaseAdmin
		.from("media_folders")
		.select("*")
		.order("sort_order")) as { data: MediaFolder[] | null };

	// Get file counts per bucket — merge media_metadata + storage
	const folderBuckets = folders?.map((f) => f.bucket_name) ?? [];
	const [{ data: metaCounts }, storageResults] = await Promise.all([
		folderBuckets.length
			? supabaseAdmin
					.from("media_metadata")
					.select("bucket")
					.in("bucket", folderBuckets)
			: { data: [] },
		Promise.all(
			folderBuckets.map((bucket) =>
				supabaseAdmin.storage
					.from(bucket)
					.list()
					.then((r) => ({
						bucket,
						count: r.error ? 0 : (r.data ?? []).length,
					})),
			),
		),
	]);

	const folderCounts: Record<string, number> = {};
	for (const row of metaCounts ?? []) {
		const bucket = (row as { bucket: string }).bucket;
		folderCounts[bucket] = (folderCounts[bucket] ?? 0) + 1;
	}
	// Storage may have files without metadata — take the max
	for (const { bucket, count } of storageResults ?? []) {
		folderCounts[bucket] = Math.max(folderCounts[bucket] ?? 0, count);
	}

	// Ensure all folders have a count (default 0)
	const enrichedFolders: MediaFolder[] = (folders ?? []).map((f) => ({
		...f,
		file_count: folderCounts[f.bucket_name] ?? 0,
	}));

	return (
		<div className="flex flex-col gap-6 py-6 px-4 lg:px-6 w-full animate-in fade-in duration-500">
			{/* Header */}
			<div className="flex items-start md:items-center gap-3 md:gap-4">
				<Link href="/zona-raider/configuracion">
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
						<IconPhoto className="size-6 md:size-8 text-white/50 shrink-0" />
						<span>BIBLIOTECA MULTIMEDIA</span>
					</h1>
					<p className="text-xs sm:text-sm font-medium text-white/40 mt-1 md:mt-2 tracking-widest leading-relaxed">
						Gestiona imágenes, documentos y archivos de toda la web desde una
						biblioteca centralizada.
					</p>
				</div>
			</div>

			{/* Client container */}
			<MediaLibraryClient
				folders={enrichedFolders}
				folderCounts={folderCounts}
				permissions={{ canView, canEdit, canManage }}
			/>
		</div>
	);
}
