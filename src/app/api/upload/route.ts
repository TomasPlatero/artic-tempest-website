import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { getAuthzSnapshot } from "@/shared/auth/authz";

const ALLOWED_BUCKETS = new Set([
	"guild_assets",
	"news-images",
	"weekly-vault",
	"feedback_attachments",
]);

const ALLOWED_MIME_TYPES = new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
	"image/svg+xml",
	"application/pdf",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function sanitizeFolder(folder: string): string {
	const cleaned = folder.replace(/\.\./g, "").replace(/[/\\]/g, "");
	return cleaned.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "general";
}

export async function POST(req: Request) {
	const session = await auth();
	const authz = session ? await getAuthzSnapshot(session) : null;
	const roleLevel = authz?.roleSlug ?? session?.user?.roleLevel ?? "";
	if (!session || (roleLevel !== "gm" && roleLevel !== "officer")) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	try {
		const formData = await req.formData();
		const file = formData.get("file") as File;
		const rawBucket = (formData.get("bucket") as string) || "guild_assets";
		const rawFolder = (formData.get("folder") as string) || "general";

		if (!ALLOWED_BUCKETS.has(rawBucket)) {
			return NextResponse.json({ error: "Invalid bucket" }, { status: 400 });
		}

		const folder = sanitizeFolder(rawFolder);

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		if (!ALLOWED_MIME_TYPES.has(file.type)) {
			return NextResponse.json(
				{ error: "File type not allowed" },
				{ status: 400 },
			);
		}

		if (file.size === 0 || file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{ error: "File size exceeds limit" },
				{ status: 400 },
			);
		}

		const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "";
		const allowedExts = new Set([
			"png",
			"jpg",
			"jpeg",
			"webp",
			"gif",
			"svg",
			"pdf",
		]);
		if (!allowedExts.has(rawExt)) {
			return NextResponse.json(
				{ error: "File type not allowed" },
				{ status: 400 },
			);
		}

		const fileName = `${Math.random().toString(36).substring(7)}_${Date.now()}.${rawExt}`;
		const filePath = `${folder}/${fileName}`;

		// Belt-and-suspenders: reject path traversal
		if (filePath.includes("..")) {
			return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
		}

		const buffer = Buffer.from(await file.arrayBuffer());

		const { error } = await supabaseAdmin.storage
			.from(rawBucket)
			.upload(filePath, buffer, {
				contentType: file.type,
				upsert: false,
			});

		if (error) throw error;

		const {
			data: { publicUrl },
		} = supabaseAdmin.storage.from(rawBucket).getPublicUrl(filePath);

		return NextResponse.json({ url: publicUrl, path: filePath });
	} catch (err: any) {
		console.error("Upload error:", err);
		return NextResponse.json(
			{ error: "Error interno del servidor" },
			{ status: 500 },
		);
	}
}
