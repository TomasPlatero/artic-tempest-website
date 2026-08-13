import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import {
	createIncident,
	resolveIncident,
	setComponentStatus,
	type ComponentStatus,
	type StatuspageResult,
} from "@/shared/integrations/statuspage/statuspage-client";
import {
	createIncidentIssue,
	resolveIncidentIssue,
} from "@/shared/lib/jira/client";

const TABLE = "monitor_incidents";
const DEFAULT_INCIDENT_THRESHOLD = 1;

export type MonitorInput = {
	checkKey: string;
	pageId: string;
	apiKey: string;
	componentId: string;
	ok: boolean;
	details: string[];
	incidentName: string;
};

export type MonitorRow = {
	id?: number;
	check_key: string;
	status: "open" | "resolved";
	statuspage_incident_id: string | null;
	jira_issue_key: string | null;
	failure_count: number;
	consecutive_failures: number;
	first_failed_at: string | null;
	last_failed_at: string | null;
	resolved_at: string | null;
	created_at?: string;
	updated_at?: string;
};

export type HeartbeatReport = {
	status: ComponentStatus;
	statuspage: StatuspageResult;
	incidentCreated: boolean;
	incidentResolved: boolean;
	error?: string;
};

type MonitorRowUpsert = Omit<MonitorRow, "id" | "created_at" | "updated_at">;

function incidentThreshold(): number {
	const raw = process.env.MONITOR_INCIDENT_THRESHOLD;
	const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
	return Number.isFinite(parsed) && parsed > 0
		? parsed
		: DEFAULT_INCIDENT_THRESHOLD;
}

async function getRow(checkKey: string): Promise<MonitorRow | null> {
	const { data, error } = await supabaseAdmin
		.from(TABLE)
		.select("*")
		.eq("check_key", checkKey)
		.maybeSingle();

	if (error) throw error;
	return (data as MonitorRow | null) ?? null;
}

async function upsertRow(row: MonitorRowUpsert): Promise<void> {
	const { error } = await supabaseAdmin.from(TABLE).upsert(row, {
		onConflict: "check_key",
	});
	if (error) throw error;
}

/**
 * Central heartbeat reporter shared by the cron checks. Always updates the
 * Statuspage component, then creates (or resolves) a public incident + Jira
 * issue when a failure crosses the configured consecutive-failure threshold.
 *
 * External calls are defensive: Statuspage/Jira/Supabase failures are logged
 * and never throw out of this function, so the cron flow keeps running and the
 * component status is always reported.
 */
export async function reportHeartbeat(
	input: MonitorInput,
): Promise<HeartbeatReport> {
	const status: ComponentStatus = input.ok ? "operational" : "major_outage";

	// The component status MUST always be updated, regardless of anything else.
	const statuspage = await setComponentStatus(
		input.pageId,
		input.apiKey,
		input.componentId,
		status,
	);

	let incidentCreated = false;
	let incidentResolved = false;
	let error: string | undefined;

	if (input.ok) {
		try {
			const row = await getRow(input.checkKey);
			if (row?.status === "open") {
				if (row.statuspage_incident_id) {
					await resolveIncident(
						input.pageId,
						input.apiKey,
						row.statuspage_incident_id,
						`Servicio recuperado. Heartbeat "${input.checkKey}" volvió a operational.`,
					);
				}
				if (row.jira_issue_key) {
					await resolveIncidentIssue(row.jira_issue_key);
				}

				await upsertRow({
					check_key: input.checkKey,
					status: "resolved",
					statuspage_incident_id: row.statuspage_incident_id,
					jira_issue_key: row.jira_issue_key,
					failure_count: row.failure_count,
					consecutive_failures: 0,
					first_failed_at: row.first_failed_at,
					last_failed_at: row.last_failed_at,
					resolved_at: new Date().toISOString(),
				});
				incidentResolved = true;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : "Unknown error";
			console.error(
				`[monitor] failed to resolve incident for ${input.checkKey}:`,
				err,
			);
		}
	} else {
		try {
			const row = await getRow(input.checkKey);
			const now = new Date().toISOString();
			const consecutiveFailures = (row?.consecutive_failures ?? 0) + 1;
			const failureCount = (row?.failure_count ?? 0) + 1;
			const hasOpenIncident =
				row?.status === "open" && Boolean(row?.statuspage_incident_id);

			let nextStatus: MonitorRow["status"] = hasOpenIncident
				? "open"
				: (row?.status ?? "resolved");
			let statuspageIncidentId = row?.statuspage_incident_id ?? null;
			let jiraIssueKey = row?.jira_issue_key ?? null;

			if (consecutiveFailures >= incidentThreshold() && !hasOpenIncident) {
				let incidentId: string | null = null;
				let creationError: string | undefined;

				try {
					const created = await createIncident({
						pageId: input.pageId,
						apiKey: input.apiKey,
						name: input.incidentName,
						body: input.details.join("\n"),
						componentId: input.componentId,
						componentStatus: "major_outage",
					});
					if (created.ok) {
						incidentId = created.incidentId;
					} else {
						throw new Error(created.error);
					}
				} catch (err) {
					creationError = err instanceof Error ? err.message : "Unknown error";
					console.error(
						`[monitor] statuspage incident creation failed for ${input.checkKey}:`,
						err,
					);
				}

				try {
					const issue = await createIncidentIssue({
						checkKey: input.checkKey,
						summary: input.incidentName,
						detailLines: input.details,
					});
					jiraIssueKey = issue.key;
				} catch (err) {
					if (!creationError) {
						creationError =
							err instanceof Error ? err.message : "Unknown error";
					}
					console.error(
						`[monitor] jira incident issue creation failed for ${input.checkKey}:`,
						err,
					);
				}

				if (incidentId) {
					statuspageIncidentId = incidentId;
					nextStatus = "open";
					incidentCreated = true;
				}
				if (creationError) error = creationError;
			}

			await upsertRow({
				check_key: input.checkKey,
				status: nextStatus,
				statuspage_incident_id: statuspageIncidentId,
				jira_issue_key: jiraIssueKey,
				failure_count: failureCount,
				consecutive_failures: consecutiveFailures,
				first_failed_at: row?.first_failed_at ?? now,
				last_failed_at: now,
				resolved_at: row?.resolved_at ?? null,
			});
		} catch (err) {
			error = err instanceof Error ? err.message : "Unknown error";
			console.error(
				`[monitor] failed to record incident for ${input.checkKey}:`,
				err,
			);
		}
	}

	return { status, statuspage, incidentCreated, incidentResolved, error };
}
