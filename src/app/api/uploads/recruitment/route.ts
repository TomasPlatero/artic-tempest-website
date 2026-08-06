import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = process.env.RECRUITMENT_ATTACHMENTS_BUCKET || "attachments";
const SIGNED_TTL_SECONDS =
	parseInt(process.env.RECRUITMENT_ATTACHMENTS_SIGNED_TTL || "", 10) || 86400; // default 24h

export async function POST(req: Request) {
	try {
		const form = await req.formData();
		const file = form.get("file") as File | null;
		const applicationId = (form.get("applicationId") as string) || "";

		if (!file) {
			return NextResponse.json({ error: "Falta fichero" }, { status: 400 });
		}

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const timestamp = Date.now();
		const safeName = (file.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
		// Sanitize applicationId to prevent path traversal
		const safeAppId = (applicationId || "anon")
			.replace(/[^a-zA-Z0-9_-]/g, "_")
			.slice(0, 64);
		const path = `recruitment/${safeAppId}/${timestamp}-${safeName}`;

		const { error: uploadError } = await supabaseAdmin.storage
			.from(BUCKET)
			.upload(path, buffer, { contentType: file.type, upsert: false });

		if (uploadError) {
			console.error("[Uploads] Supabase upload error:", uploadError);
			return NextResponse.json({ error: "Upload failed" }, { status: 500 });
		}

		// Generate a signed URL so access can be controlled. We also return the raw storage path
		// so callers can request fresh signed URLs later if needed.
		const { data: signedData, error: signedError } = await supabaseAdmin.storage
			.from(BUCKET)
			.createSignedUrl(path, SIGNED_TTL_SECONDS);

		if (signedError) {
			console.error("[Uploads] Supabase createSignedUrl error:", signedError);
			// Fallback to public URL if signed URL creation fails
			const { data: pub } = supabaseAdmin.storage
				.from(BUCKET)
				.getPublicUrl(path);
			const publicUrl = pub?.publicUrl || "";
			return NextResponse.json({
				url: publicUrl,
				name: file.name,
				contentType: file.type,
				path,
			});
		}

		const signedUrl = signedData?.signedUrl || "";
		const expiresAt = new Date(
			Date.now() + SIGNED_TTL_SECONDS * 1000,
		).toISOString();

		return NextResponse.json({
			url: signedUrl,
			name: file.name,
			contentType: file.type,
			path,
			expiresAt,
		});
	} catch (err: any) {
		console.error("[Uploads] Error:", err);
		return NextResponse.json(
			{ error: err.message || "Error interno" },
			{ status: 500 },
		);
	}
}
