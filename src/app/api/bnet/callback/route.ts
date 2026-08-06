import { NextResponse } from "next/server";
import { auth } from '@/auth';
import { supabaseAdmin } from '@/shared/lib/supabase-admin';
import { cookies } from "next/headers";
import { getGuildCredentials } from "@/shared/auth/credentials";
import {
	fetchCharacterSummary,
	fetchCharacterMedia,
} from "@/shared/integrations/bnet/bnet-client";
import { toZonaRaiderPath } from "@/shared/lib/zona-raider-path";

export const runtime = "nodejs";

const ALLOWED_RETURN_TO = new Set(["/mis-personajes", "/zona-raider/cuenta"]);

function resolveReturnTo(pathname: string | null) {
	return pathname && ALLOWED_RETURN_TO.has(pathname)
		? toZonaRaiderPath(pathname)
		: null;
}

/** Build a safe redirect URL — ensures path is trusted and baseUrl is a valid origin. */
function safeRedirectUrl(path: string, baseUrl: string): URL {
	// path must start with / and not contain protocol-relative tricks
	if (!path.startsWith("/") || path.includes("//") || path.includes("@")) {
		return new URL("/", baseUrl);
	}
	try {
		const parsed = new URL(path, baseUrl);
		if (parsed.origin !== new URL(baseUrl).origin) {
			return new URL("/", baseUrl);
		}
		return parsed;
	} catch {
		return new URL("/", "http://localhost");
	}
}

/** Retry helper with exponential backoff for transient errors */
async function fetchWithRetry(
	url: string,
	options: RequestInit,
	maxTotalAttempts = 4,
	label = "request",
): Promise<Response> {
	const FETCH_TIMEOUT_MS = 15_000; // 15s per-attempt timeout
	let lastError: unknown;
	for (let attempt = 0; attempt < maxTotalAttempts; attempt++) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
			const res = await fetch(url, {
				...options,
				cache: "no-store",
				signal: controller.signal,
			});
			clearTimeout(timeoutId);
			// Retry on server errors (5xx) and rate limits (429)
			if (res.ok) return res;
			if (
				attempt < maxTotalAttempts - 1 &&
				(res.status === 429 || res.status >= 500)
			) {
				const waitMs = Math.pow(2, attempt) * 1000 + Math.random() * 500; // 1s+0-500ms, 2s+0-500ms, 4s+0-500ms
				console.warn(
					`[BNET CALLBACK] ${label} attempt ${attempt + 1}/${maxTotalAttempts} failed with ${res.status}, retrying in ${Math.round(waitMs)}ms`,
				);
				await new Promise((r) => setTimeout(r, waitMs));
				continue;
			}
			return res; // Non-retryable error (4xx) or last attempt
		} catch (err: any) {
			lastError = err;
			if (err?.name === "AbortError") {
				console.warn(
					`[BNET CALLBACK] ${label} attempt ${attempt + 1}/${maxTotalAttempts} timed out after ${FETCH_TIMEOUT_MS}ms`,
				);
			}
			if (attempt < maxTotalAttempts - 1) {
				const waitMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
				console.warn(
					`[BNET CALLBACK] ${label} attempt ${attempt + 1}/${maxTotalAttempts} network error, retrying in ${Math.round(waitMs)}ms`,
				);
				await new Promise((r) => setTimeout(r, waitMs));
			}
		}
	}
	throw lastError;
}

export async function GET(request: Request) {
	try {
		const reqUrl = new URL(request.url);
		const baseUrl = process.env.NEXTAUTH_URL || reqUrl.origin;

		const session = await auth();
		if (!session) {
			return NextResponse.redirect(new URL("/", baseUrl));
		}

		const canAccessZonaRaider =
			session.user.roleFlags?.canAccessZonaRaider ?? false;
		const cookieStore = await cookies();
		const requestedReturnTo = resolveReturnTo(
			cookieStore.get("bnet_oauth_return_to")?.value ?? null,
		);
		const finalDest =
			requestedReturnTo ??
			(canAccessZonaRaider ? "/zona-raider/cuenta" : "/mis-personajes");
		cookieStore.delete("bnet_oauth_return_to");

		const { searchParams } = reqUrl;
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");

		if (error || !code) {
			console.error("Bnet OAuth error:", error);
			return NextResponse.redirect(
				safeRedirectUrl(`${finalDest}?error=auth_failed`, baseUrl),
			);
		}

		const savedState = cookieStore.get("bnet_oauth_state")?.value;

		if (!state || state !== savedState) {
			console.error("Bnet OAuth state mismatch");
			cookieStore.delete("bnet_oauth_state");
			return NextResponse.redirect(
				safeRedirectUrl(`${finalDest}?error=invalid_state`, baseUrl),
			);
		}

		// Single-use: delete state cookie after verification
		cookieStore.delete("bnet_oauth_state");

		const creds = await getGuildCredentials();
		const clientId = creds.bnet_client_id;
		const clientSecret = creds.bnet_client_secret;
		const redirectUri = `${baseUrl}/api/bnet/callback`;

		if (!clientId || !clientSecret) {
			throw new Error(
				"Faltan credenciales de Battle.net (configúralas en Ajustes > Zona Raider)",
			);
		}

		const authString = Buffer.from(`${clientId}:${clientSecret}`).toString(
			"base64",
		);

		// 1. Intercambiar code por token (con retry)
		const tokenParams = new URLSearchParams();
		tokenParams.append("redirect_uri", redirectUri);
		tokenParams.append("scope", "wow.profile");
		tokenParams.append("grant_type", "authorization_code");
		tokenParams.append("code", code);

		let tokenRes: Response;
		try {
			tokenRes = await fetchWithRetry(
				"https://oauth.battle.net/token",
				{
					method: "POST",
					headers: {
						Authorization: `Basic ${authString}`,
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: tokenParams.toString(),
				},
				3,
				"token exchange",
			);
		} catch (err) {
			console.error("Bnet token exchange failed after retries:", err);
			return NextResponse.redirect(
				safeRedirectUrl(`${finalDest}?error=token_exchange`, baseUrl),
			);
		}

		if (!tokenRes.ok) {
			const errBody = await tokenRes.text();
			console.error("Bnet token exchange failed:", tokenRes.status, errBody);
			return NextResponse.redirect(
				safeRedirectUrl(`${finalDest}?error=token_exchange`, baseUrl),
			);
		}

		const tokenData = await tokenRes.json();
		const accessToken = tokenData.access_token;

		// 2. Fetch Account User profile (BattleTag + Account ID) — con retry
		let userInfoRes: Response;
		try {
			userInfoRes = await fetchWithRetry(
				"https://oauth.battle.net/userinfo",
				{ headers: { Authorization: `Bearer ${accessToken}` } },
				3,
				"userinfo",
			);
		} catch (err) {
			console.error("Bnet userinfo failed after retries:", err);
			throw new Error("Failed to fetch Battle.net user info");
		}

		if (!userInfoRes.ok) {
			throw new Error(
				`Failed to fetch Battle.net user info (status ${userInfoRes.status})`,
			);
		}

		const userInfo = await userInfoRes.json();
		const bnetId = userInfo.id?.toString();
		const bnetTag = userInfo.battletag;

		// 3. Fetch WoW Profile (Characters) — con retry para errores transitorios
		let characters: any[] = [];
		let wowRes: Response | null = null;
		try {
			wowRes = await fetchWithRetry(
				"https://eu.api.blizzard.com/profile/user/wow?namespace=profile-eu&locale=es_ES",
				{ headers: { Authorization: `Bearer ${accessToken}` } },
				4,
				"WOW profile",
			);
		} catch (err) {
			console.error(
				"[BNET CALLBACK] WOW Profile fetch failed after retries:",
				err,
			);
			wowRes = null; // Will fall through to empty characters
		}

		if (wowRes?.ok) {
			const wowProfile = await wowRes.json();
			console.log(
				"[BNET CALLBACK] WOW Profile base:",
				JSON.stringify({
					id: wowProfile.id,
					accounts_count: wowProfile.wow_accounts?.length || 0,
				}),
			);

			characters =
				wowProfile.wow_accounts?.flatMap((acc: any) => acc.characters || []) ||
				[];
			console.log(
				`[BNET CALLBACK] Flattened characters array length: ${characters.length}`,
			);
		} else if (wowRes) {
			const errorText = await wowRes.text();
			console.error(
				`[BNET CALLBACK] WOW Profile fetch failed (status ${wowRes.status}):`,
				errorText,
			);
		}

		// 4. Update the DB: profiles -> bnet_characters -> link guild_members
		const userId = session.user.id;

		const { data: profile } = await supabaseAdmin
			.from("profiles")
			.select("main_character_id")
			.eq("user_id", userId)
			.maybeSingle();

		let preservedMainCharacter: { name: string; realm_slug: string } | null =
			null;

		if (profile?.main_character_id) {
			const { data: currentMainCharacter } = await supabaseAdmin
				.from("bnet_characters")
				.select("name, realm_slug")
				.eq("id", profile.main_character_id)
				.eq("user_id", userId)
				.maybeSingle();

			if (currentMainCharacter?.name && currentMainCharacter?.realm_slug) {
				preservedMainCharacter = {
					name: currentMainCharacter.name,
					realm_slug: currentMainCharacter.realm_slug,
				};
			}
		}

		// Guardamos battletag en su perfil
		await supabaseAdmin
			.from("profiles")
			.update({
				battlenet_id: bnetId,
				battlenet_battletag: bnetTag,
			})
			.eq("user_id", userId);

		// Limpiamos y reinsertamos sus pjs
		if (characters.length > 0) {
			await supabaseAdmin
				.from("bnet_characters")
				.delete()
				.eq("user_id", userId);

			// Fetch specs and classes metadata to populate bnet_characters correctly
			const { data: specsMetadata } = await supabaseAdmin
				.from("wow_specializations")
				.select("id, name, class_id, role, main_stat");

			const { data: classesMetadata } = await supabaseAdmin
				.from("wow_classes")
				.select("id, armor_type");

			const charRows = await Promise.all(
				characters.map(async (c) => {
					const nameSlug = c.name.toLowerCase();
					const charSummary = await fetchCharacterSummary(
						c.realm.slug,
						nameSlug,
						"eu",
						accessToken,
					);
					const specName = charSummary?.spec || "Unknown";
					const actualLevel = charSummary?.level || c.level;
					const thumbnailUrl = await fetchCharacterMedia(
						c.realm.slug,
						nameSlug,
						"eu",
						accessToken,
					);

					// Find metadata
					const specMeta = specsMetadata?.find(
						(s) => s.name === specName && s.class_id === c.playable_class.id,
					);
					const classMeta = classesMetadata?.find(
						(cl) => cl.id === c.playable_class.id,
					);

					return {
						user_id: userId,
						name: c.name,
						realm: c.realm.name,
						realm_slug: c.realm_slug || c.realm.slug,
						class_id: c.playable_class.id,
						race_id: c.playable_race.id,
						level: actualLevel,
						faction: c.faction?.type?.toLowerCase() || "neutral",
						spec: specName || "Unknown",
						spec_id: specMeta?.id || null,
						role: specMeta?.role || null,
						main_stat: specMeta?.main_stat || null,
						armor_type: classMeta?.armor_type || null,
						thumbnail_url: thumbnailUrl,
					};
				}),
			);

			const { data: upsertedCharacters, error: insertErr } = await supabaseAdmin
				.from("bnet_characters")
				.upsert(charRows, { onConflict: "user_id,realm_slug,name" })
				.select("id, name, realm_slug");

			if (insertErr) {
				console.error("[BNET CALLBACK] DB Upsert Error:", insertErr);
			} else {
				console.log(
					`[BNET CALLBACK] Upserted ${charRows.length} characters with full metadata successfully`,
				);
			}

			if (preservedMainCharacter && upsertedCharacters?.length) {
				const refreshedMainCharacter = upsertedCharacters.find(
					(character) =>
						character.name === preservedMainCharacter?.name &&
						character.realm_slug === preservedMainCharacter?.realm_slug,
				);

				if (refreshedMainCharacter) {
					await supabaseAdmin
						.from("profiles")
						.update({
							main_character_id: refreshedMainCharacter.id,
						})
						.eq("user_id", userId);
				}
			}

			// Finalmente: "Reclamar" los que ya estén en la hermandad (guild_members)
			await Promise.all(
				charRows.map((c) =>
					supabaseAdmin
						.from("guild_members")
						.update({ profile_id: userId })
						.match({
							character_name: c.name,
							realm_slug: c.realm_slug,
							profile_id: null,
						}),
				),
			);
		}

		return NextResponse.redirect(
			safeRedirectUrl(`${finalDest}?success=linked`, baseUrl),
		);
	} catch (e: any) {
		console.error("Bnet callback unhandled error:", e);
		const errUrl = new URL(request.url);

		const currentSession = await auth();
		const cookieStore = await cookies();
		const requestedReturnTo = resolveReturnTo(
			cookieStore.get("bnet_oauth_return_to")?.value ?? null,
		);
		const errorDest =
			requestedReturnTo ??
			((currentSession?.user.roleFlags?.canAccessZonaRaider ?? false)
				? "/zona-raider/cuenta"
				: "/mis-personajes");
		cookieStore.delete("bnet_oauth_return_to");

		const baseUrl = process.env.NEXTAUTH_URL || errUrl.origin;
		return NextResponse.redirect(
			safeRedirectUrl(`${errorDest}?error=unknown`, baseUrl),
		);
	}
}
