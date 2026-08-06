import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { ensureAppPermission } from "@/shared/auth/permissions";

const BUCKET = "image_boses_kills";
const CATEGORY = "wow_raid_kill_images";

async function persistKillImage(bossSlug: string, imagePath: string) {
	const normalizedBossSlug = bossSlug.trim().toLowerCase();
	const { data: publicUrlData } = supabaseAdmin.storage
		.from(BUCKET)
		.getPublicUrl(imagePath);

	const publicUrl = publicUrlData.publicUrl;

	const { error: deleteError } = await supabaseAdmin
		.from("game_constants")
		.delete()
		.eq("category", CATEGORY)
		.eq("key", normalizedBossSlug);

	if (deleteError) throw deleteError;

	const { error: insertError } = await supabaseAdmin
		.from("game_constants")
		.insert({
			category: CATEGORY,
			key: normalizedBossSlug,
			value: publicUrl,
			metadata: {
				bucket: BUCKET,
				path: imagePath,
				updated_at: new Date().toISOString(),
			},
		});

	if (insertError) throw insertError;

	return publicUrl;
}

export async function PATCH(req: Request) {
	try {
		await ensureAppPermission("settings", "edit");

		const { bossSlug, imagePath } = await req.json();

		if (!bossSlug || !imagePath) {
			return NextResponse.json(
				{ error: "Faltan datos para guardar la imagen" },
				{ status: 400 },
			);
		}

		const publicUrl = await persistKillImage(bossSlug, imagePath);

		revalidateTag("raid-kill-images", "max");
		revalidatePath("/progreso");

		return NextResponse.json({ success: true, imageUrl: publicUrl });
	} catch (error: any) {
		console.error("[KILL_IMAGES_PATCH]", error);
		return NextResponse.json(
			{ error: error.message || "No se pudo guardar la imagen" },
			{ status: 500 },
		);
	}
}

export async function DELETE(req: Request) {
	try {
		await ensureAppPermission("settings", "edit");

		const { searchParams } = new URL(req.url);
		const bossSlug = searchParams.get("bossSlug");

		if (!bossSlug) {
			return NextResponse.json({ error: "Falta el bossSlug" }, { status: 400 });
		}

		const normalizedBossSlug = bossSlug.trim().toLowerCase();

		const { error } = await supabaseAdmin
			.from("game_constants")
			.delete()
			.eq("category", CATEGORY)
			.eq("key", normalizedBossSlug);

		if (error) throw error;

		revalidateTag("raid-kill-images", "max");
		revalidatePath("/progreso");

		return NextResponse.json({ success: true });
	} catch (error: any) {
		console.error("[KILL_IMAGES_DELETE]", error);
		return NextResponse.json(
			{ error: error.message || "No se pudo eliminar la imagen" },
			{ status: 500 },
		);
	}
}
