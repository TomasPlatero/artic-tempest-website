import "server-only";

const AUTH_BASE = "https://auth.atlassian.com";
const API_BASE = "https://api.atlassian.com";

const SCOPES = [
	"write:jira-work",
	"read:jira-work",
	"read:jira-user",
	"offline_access",
];

function credentials(): { clientId: string; clientSecret: string } {
	const clientId = process.env.ATLASSIAN_CLIENT_ID;
	const clientSecret = process.env.ATLASSIAN_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throw new Error(
			"ATLASSIAN_CLIENT_ID / ATLASSIAN_CLIENT_SECRET no configurados",
		);
	}
	return { clientId, clientSecret };
}

export function buildAuthorizationUrl(
	redirectUri: string,
	state: string,
): string {
	const { clientId } = credentials();
	const params = new URLSearchParams({
		audience: "api.atlassian.com",
		client_id: clientId,
		scope: SCOPES.join(" "),
		redirect_uri: redirectUri,
		state,
		response_type: "code",
		prompt: "consent",
	});
	return `${AUTH_BASE}/authorize?${params.toString()}`;
}

export type TokenSet = {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	token_type?: string;
};

export function parseJson<T>(text: string): T {
	try {
		return JSON.parse(text) as T;
	} catch {
		throw new Error(
			`Respuesta JSON inválida de Atlassian: ${text.slice(0, 200)}`,
		);
	}
}

async function requestToken(body: Record<string, string>): Promise<TokenSet> {
	const { clientId, clientSecret } = credentials();
	const res = await fetch(`${AUTH_BASE}/oauth/token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			...body,
		}),
	});

	const text = await res.text();
	if (!res.ok) {
		throw new Error(`Atlassian token error (${res.status}): ${text}`);
	}
	return parseJson<TokenSet>(text);
}

export function exchangeCodeForTokens(code: string, redirectUri: string) {
	return requestToken({
		grant_type: "authorization_code",
		code,
		redirect_uri: redirectUri,
	});
}

export function refreshTokens(refreshToken: string) {
	return requestToken({
		grant_type: "refresh_token",
		refresh_token: refreshToken,
	});
}

export type AccessibleResource = {
	id: string;
	url: string;
	name: string;
	scopes: string[];
};

export async function getAccessibleResources(
	accessToken: string,
): Promise<AccessibleResource[]> {
	const res = await fetch(`${API_BASE}/oauth/token/accessible-resources`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/json",
		},
	});

	const text = await res.text();
	if (!res.ok) {
		throw new Error(
			`Atlassian accessible-resources error (${res.status}): ${text}`,
		);
	}
	return parseJson<AccessibleResource[]>(text);
}

export function resolveRedirectUri(origin: string): string {
	const explicit = process.env.ATLASSIAN_REDIRECT_URI;
	if (explicit) return explicit;
	const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/+$/, "");
	return `${base}/api/jira/oauth/callback`;
}
