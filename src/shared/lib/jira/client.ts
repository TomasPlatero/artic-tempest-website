import "server-only";
import {
	getAccessibleResources,
	parseJson,
	refreshTokens,
} from "@/shared/lib/jira/oauth";
import { getStoredTokens, saveTokens } from "@/shared/lib/jira/token-store";

const API_BASE = "https://api.atlassian.com";
const ACCESS_TOKEN_BUFFER_MS = 60_000;

export type IssueCategory = "bug" | "sugerencia";

type IssueTypeMeta = {
	id: string;
	name: string;
	untranslatedName?: string;
	subtask?: boolean;
};

// Candidatos por categoría: primero el tipo deseado, luego alternativas (por si
// el proyecto usa nombres localizados o no tiene "Story" habilitado).
const ISSUE_TYPE_CANDIDATES: Record<IssueCategory, string[]> = {
	bug: ["Bug", "Error"],
	sugerencia: ["Story", "Historia", "Task", "Tarea"],
};

const LABEL_BY_CATEGORY: Record<IssueCategory, string> = {
	bug: "bug",
	sugerencia: "sugerencia",
};

async function getValidAccessToken(): Promise<{
	accessToken: string;
	cloudId: string;
}> {
	const stored = await getStoredTokens();
	if (!stored?.refresh_token) {
		throw new Error(
			"Jira OAuth no configurado. Ejecuta /api/jira/oauth/start primero.",
		);
	}

	const expiresAt = stored.expires_at
		? new Date(stored.expires_at).getTime()
		: 0;
	const hasValidAccess =
		stored.access_token && expiresAt > Date.now() + ACCESS_TOKEN_BUFFER_MS;

	if (hasValidAccess && stored.cloud_id) {
		return {
			accessToken: stored.access_token as string,
			cloudId: stored.cloud_id,
		};
	}

	const tokens = await refreshTokens(stored.refresh_token);
	const expiresAtDate = new Date(Date.now() + tokens.expires_in * 1000);

	let cloudId = stored.cloud_id;
	if (!cloudId) {
		const resources = await getAccessibleResources(tokens.access_token);
		cloudId = resources[0]?.id ?? null;
		if (!cloudId) {
			throw new Error("No se encontró ningún recurso Jira accesible");
		}
	}

	await saveTokens({
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token ?? stored.refresh_token,
		tokenType: tokens.token_type ?? stored.token_type ?? "Bearer",
		expiresAt: expiresAtDate,
		cloudId,
	});

	return { accessToken: tokens.access_token, cloudId };
}

function toAdfDoc(lines: string[]) {
	return {
		type: "doc",
		version: 1,
		content: lines.map((line) => ({
			type: "paragraph",
			content: line ? [{ type: "text", text: line }] : [],
		})),
	};
}

async function fetchProjectIssueTypes(
	accessToken: string,
	cloudId: string,
	projectKey: string,
): Promise<IssueTypeMeta[]> {
	const res = await fetch(
		`${API_BASE}/ex/jira/${cloudId}/rest/api/3/issue/createmeta/${projectKey}/issuetypes`,
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: "application/json",
			},
		},
	);

	const text = await res.text();
	if (!res.ok) {
		throw new Error(
			`Jira createmeta falló (${res.status}): ${text.slice(0, 300)}`,
		);
	}

	const data = parseJson<{ issueTypes?: IssueTypeMeta[] } | IssueTypeMeta[]>(
		text,
	);
	return Array.isArray(data) ? data : (data.issueTypes ?? []);
}

function resolveIssueTypeId(
	types: IssueTypeMeta[],
	category: IssueCategory,
): string | null {
	const candidates = ISSUE_TYPE_CANDIDATES[category].map((c) =>
		c.toLowerCase(),
	);
	for (const candidate of candidates) {
		const match = types.find((t) => {
			if (t.subtask) return false;
			const untranslated = (t.untranslatedName ?? "").toLowerCase();
			const name = t.name.toLowerCase();
			return untranslated === candidate || name === candidate;
		});
		if (match) return match.id;
	}
	return null;
}

async function attachFileToIssue(
	accessToken: string,
	cloudId: string,
	issueKey: string,
	file: File,
): Promise<void> {
	const form = new FormData();
	form.append("file", file, file.name);

	const res = await fetch(
		`${API_BASE}/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}/attachments`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"X-Atlassian-Token": "no-check",
			},
			body: form,
		},
	);

	const text = await res.text();
	if (!res.ok) {
		throw new Error(`Jira attach falló (${res.status}): ${text.slice(0, 300)}`);
	}
}

export async function createJiraIssue(input: {
	category: IssueCategory;
	name: string;
	email: string;
	message: string;
	files?: File[];
}): Promise<{ key: string; attachmentErrors: string[] }> {
	const { accessToken, cloudId } = await getValidAccessToken();
	const projectKey = process.env.JIRA_PROJECT_KEY || "ATW";
	const label = LABEL_BY_CATEGORY[input.category];

	const issueTypes = await fetchProjectIssueTypes(
		accessToken,
		cloudId,
		projectKey,
	);
	const issueTypeId = resolveIssueTypeId(issueTypes, input.category);
	if (!issueTypeId) {
		throw new Error(
			`No se encontró un tipo de issue válido para "${input.category}" en el proyecto ${projectKey}`,
		);
	}

	const summary = `[${label}] ${input.name}: ${input.message.slice(0, 100)}`;
	const description = toAdfDoc([
		input.message,
		"",
		`Reportado por: ${input.name} (${input.email})`,
	]);

	const res = await fetch(`${API_BASE}/ex/jira/${cloudId}/rest/api/3/issue`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			fields: {
				project: { key: projectKey },
				summary,
				issuetype: { id: issueTypeId },
				description,
				labels: ["web", label],
			},
		}),
	});

	const text = await res.text();
	let body: { key?: string } | null = null;
	try {
		body = JSON.parse(text) as { key?: string };
	} catch {
		body = null;
	}

	if (!res.ok) {
		throw new Error(
			`Jira create issue falló (${res.status}): ${text.slice(0, 500)}`,
		);
	}
	if (!body?.key) {
		throw new Error("Jira respondió sin clave de issue");
	}

	const attachmentErrors: string[] = [];
	for (const file of input.files ?? []) {
		try {
			await attachFileToIssue(accessToken, cloudId, body.key, file);
		} catch (err) {
			attachmentErrors.push(file.name);
			console.error(`Fallo al adjuntar ${file.name}:`, err);
		}
	}

	return { key: body.key, attachmentErrors };
}
