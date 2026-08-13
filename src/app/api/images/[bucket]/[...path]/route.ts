import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { PUBLIC_PROXY_BUCKETS } from "@/shared/lib/storage-url";
import { sanitizePath } from "@/domains/media/lib/storage";

export const runtime = "nodejs";

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year, immutable

function mimeFromPath(path: string): string {
	const ext = path.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "png":
			return "image/png";
		case "jpg":
		case "jpeg":
			return "image/jpeg";
		case "gif":
			return "image/gif";
		case "webp":
			return "image/webp";
		case "avif":
			return "image/avif";
		case "svg":
			return "image/svg+xml";
		default:
			return "application/octet-stream";
	}
}

/**
 * Public image proxy: serves Supabase Storage objects on the site's own domain
 * so the Supabase origin is never exposed (used by the RSS feed and sitemap).
 *
 * Hardened against abuse:
 * - bucket must be in the PUBLIC_PROXY_BUCKETS allowlist (default deny)
 * - path is sanitized against traversal
 * - the fetch target is always the configured Supabase client (no SSRF)
 */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ bucket: string; path: string[] }> },
) {
	const { bucket, path } = await params;

	if (!PUBLIC_PROXY_BUCKETS.has(bucket)) {
		return new Response("Not found", { status: 404 });
	}

	let safePath: string;
	try {
		safePath = sanitizePath(path.join("/"));
	} catch {
		return new Response("Not found", { status: 404 });
	}

	const { data, error } = await supabaseAdmin.storage
		.from(bucket)
		.download(safePath);

	if (error || !data) {
		return new Response("Not found", { status: 404 });
	}

	const contentType = data.type || mimeFromPath(safePath);

	return new Response(data, {
		status: 200,
		headers: {
			"Content-Type": contentType,
			"Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}, immutable`,
			"X-Content-Type-Options": "nosniff",
		},
	});
}
