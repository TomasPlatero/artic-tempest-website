// src/shared/integrations/statuspage/statuspage-client.ts
// Atlassian Statuspage API client — pushes component status.
// Docs: https://developer.statuspage.io/
import { supabaseAdmin } from "@/shared/lib/supabase-admin";

export type ComponentStatus =
	| "operational"
	| "under_maintenance"
	| "degraded_performance"
	| "partial_outage"
	| "major_outage";

export type IncidentStatus =
	| "investigating"
	| "identified"
	| "monitoring"
	| "resolved";

export type StatuspageResult =
	| { ok: true; status: ComponentStatus | IncidentStatus }
	| { ok: false; error: string };

const STATUSPAGE_API = "https://api.statuspage.io/v1";

const COMPONENT_IDS_ENV = "STATUSPAGE_COMPONENT_IDS";

/** Clave en `app_settings` donde se guardan los componentes (editable desde la web). */
export const STATUSPAGE_COMPONENTS_SETTING_KEY = "statuspage_components";

/**
 * Resuelve el component id de Statuspage para una clave (ej. "web",
 * "recruitment"). Primero mira en la base de datos (`app_settings`), editable
 * desde la web en /zona-raider/configuracion/testing; si no está, cae al env
 * var `STATUSPAGE_COMPONENT_IDS` como fallback.
 */
export async function getComponentId(key: string): Promise<string | undefined> {
	// 1. DB (fuente de verdad, editable desde la web)
	try {
		const { data } = await supabaseAdmin
			.from("app_settings")
			.select("value")
			.eq("key", STATUSPAGE_COMPONENTS_SETTING_KEY)
			.maybeSingle();

		if (data?.value) {
			const map = JSON.parse(data.value) as Record<string, string>;
			if (map[key]) return map[key];
		}
	} catch (err) {
		console.error(
			"[statuspage] failed to read statuspage_components from DB:",
			err,
		);
	}

	// 2. Fallback: env var
	const raw = process.env[COMPONENT_IDS_ENV];
	if (!raw) return undefined;

	try {
		const map = JSON.parse(raw) as Record<string, string>;
		return map[key] || undefined;
	} catch {
		console.error(`[statuspage] Invalid ${COMPONENT_IDS_ENV} JSON`);
		return undefined;
	}
}

/**
 * Updates the status of a single component on your Statuspage.
 * Rate limit: 1 request / second per API token.
 */
export async function setComponentStatus(
	pageId: string,
	apiKey: string,
	componentId: string,
	status: ComponentStatus,
): Promise<StatuspageResult> {
	const url = `${STATUSPAGE_API}/pages/${pageId}/components/${componentId}`;

	try {
		const res = await fetch(url, {
			method: "PATCH",
			cache: "no-store",
			headers: {
				Authorization: `OAuth ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ component: { status } }),
		});

		if (!res.ok) {
			const body = await res.text();
			return {
				ok: false,
				error: `Statuspage API ${res.status}: ${body.slice(0, 300)}`,
			};
		}

		const data = (await res.json()) as { status?: ComponentStatus };
		return { ok: true, status: data.status ?? status };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Unknown error",
		};
	}
}

/**
 * Creates a realtime incident on Statuspage and links the component with the
 * given status (e.g. "major_outage"). Returns the new incident id.
 * Docs: https://developer.statuspage.io/#operation/postPagesPageIdIncidents
 */
export async function createIncident(input: {
	pageId: string;
	apiKey: string;
	name: string;
	body: string;
	componentId: string;
	componentStatus: ComponentStatus;
}): Promise<{ ok: true; incidentId: string } | { ok: false; error: string }> {
	const url = `${STATUSPAGE_API}/pages/${input.pageId}/incidents`;

	try {
		const res = await fetch(url, {
			method: "POST",
			cache: "no-store",
			headers: {
				Authorization: `OAuth ${input.apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				incident: {
					name: input.name,
					status: "investigating",
					body: input.body,
					component_ids: [input.componentId],
					components: { [input.componentId]: input.componentStatus },
				},
			}),
		});

		if (!res.ok) {
			const text = await res.text();
			return {
				ok: false,
				error: `Statuspage API ${res.status}: ${text.slice(0, 300)}`,
			};
		}

		const data = (await res.json()) as { id?: string };
		if (!data.id) {
			return { ok: false, error: "Statuspage respondió sin incident id" };
		}

		return { ok: true, incidentId: data.id };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Unknown error",
		};
	}
}

/**
 * Resolves an existing Statuspage incident.
 * Docs: https://developer.statuspage.io/#operation/patchPagesPageIdIncidentsIncidentId
 */
export async function resolveIncident(
	pageId: string,
	apiKey: string,
	incidentId: string,
	body: string,
): Promise<StatuspageResult> {
	const url = `${STATUSPAGE_API}/pages/${pageId}/incidents/${incidentId}`;

	try {
		const res = await fetch(url, {
			method: "PATCH",
			cache: "no-store",
			headers: {
				Authorization: `OAuth ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ incident: { status: "resolved", body } }),
		});

		if (!res.ok) {
			const text = await res.text();
			return {
				ok: false,
				error: `Statuspage API ${res.status}: ${text.slice(0, 300)}`,
			};
		}

		return { ok: true, status: "resolved" };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Unknown error",
		};
	}
}
