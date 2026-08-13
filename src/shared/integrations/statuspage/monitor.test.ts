import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  supabaseFrom: vi.fn(),
  setComponentStatus: vi.fn(),
  createIncident: vi.fn(),
  resolveIncident: vi.fn(),
  createIncidentIssue: vi.fn(),
  resolveIncidentIssue: vi.fn(),
}));

vi.mock("@/shared/lib/supabase-admin", () => ({
  supabaseAdmin: {
    from: mocks.supabaseFrom,
  },
}));

vi.mock("@/shared/integrations/statuspage/statuspage-client", () => ({
  setComponentStatus: mocks.setComponentStatus,
  createIncident: mocks.createIncident,
  resolveIncident: mocks.resolveIncident,
}));

vi.mock("@/shared/lib/jira/client", () => ({
  createIncidentIssue: mocks.createIncidentIssue,
  resolveIncidentIssue: mocks.resolveIncidentIssue,
}));

import { reportHeartbeat, type MonitorInput, type MonitorRow } from "./monitor";

const makeInput = (overrides: Partial<MonitorInput> = {}): MonitorInput => ({
  checkKey: "web",
  pageId: "page-1",
  apiKey: "api-key",
  componentId: "comp-1",
  ok: false,
  details: ["URL: https://example.com", "HTTP status: 500"],
  incidentName: "Web no responde",
  ...overrides,
});

function openRow(overrides: Partial<MonitorRow> = {}): MonitorRow {
  return {
    check_key: "web",
    status: "open",
    statuspage_incident_id: "sp_123",
    jira_issue_key: "ATW-1",
    failure_count: 1,
    consecutive_failures: 1,
    first_failed_at: "2024-01-01T00:00:00.000Z",
    last_failed_at: "2024-01-01T00:00:00.000Z",
    resolved_at: null,
    ...overrides,
  };
}

let storedRow: MonitorRow | null;

function makeChain() {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(async () => ({ data: storedRow, error: null })),
      })),
    })),
    upsert: vi.fn(async (row: MonitorRow) => {
      storedRow = row;
      return { error: null };
    }),
  };
}

describe("reportHeartbeat", () => {
  beforeEach(() => {
    storedRow = null;
    vi.clearAllMocks();

    mocks.supabaseFrom.mockImplementation(() => makeChain());
    mocks.setComponentStatus.mockResolvedValue({
      ok: true,
      status: "major_outage",
    });
    mocks.createIncident.mockResolvedValue({ ok: true, incidentId: "sp_123" });
    mocks.createIncidentIssue.mockResolvedValue({ key: "ATW-1" });
    mocks.resolveIncident.mockResolvedValue({ ok: true, status: "resolved" });
    mocks.resolveIncidentIssue.mockResolvedValue(undefined);

    delete process.env.MONITOR_INCIDENT_THRESHOLD;
  });

  it("creates an incident + Jira issue on a confirmed failure and stores ids", async () => {
    const result = await reportHeartbeat(makeInput());

    expect(mocks.setComponentStatus).toHaveBeenCalledTimes(1);
    expect(mocks.createIncident).toHaveBeenCalledTimes(1);
    expect(mocks.createIncidentIssue).toHaveBeenCalledTimes(1);

    expect(result.status).toBe("major_outage");
    expect(result.incidentCreated).toBe(true);
    expect(result.incidentResolved).toBe(false);

    expect(storedRow).toMatchObject({
      check_key: "web",
      status: "open",
      statuspage_incident_id: "sp_123",
      jira_issue_key: "ATW-1",
      failure_count: 1,
      consecutive_failures: 1,
    });
  });

  it("does not duplicate while an incident is already open", async () => {
    storedRow = openRow();

    const result = await reportHeartbeat(makeInput());

    expect(mocks.createIncident).not.toHaveBeenCalled();
    expect(mocks.createIncidentIssue).not.toHaveBeenCalled();
    expect(result.incidentCreated).toBe(false);

    expect(storedRow).toMatchObject({
      status: "open",
      statuspage_incident_id: "sp_123",
      jira_issue_key: "ATW-1",
      failure_count: 2,
      consecutive_failures: 2,
    });
  });

  it("resolves the Statuspage incident and Jira issue on recovery", async () => {
    storedRow = openRow();

    const result = await reportHeartbeat(makeInput({ ok: true }));

    expect(mocks.resolveIncident).toHaveBeenCalledWith(
      "page-1",
      "api-key",
      "sp_123",
      expect.stringContaining("recuperado"),
    );
    expect(mocks.resolveIncidentIssue).toHaveBeenCalledWith("ATW-1");

    expect(result.status).toBe("operational");
    expect(result.incidentResolved).toBe(true);

    expect(storedRow).toMatchObject({
      status: "resolved",
      consecutive_failures: 0,
      resolved_at: expect.any(String),
    });
  });

  it("respects MONITOR_INCIDENT_THRESHOLD before creating an incident", async () => {
    process.env.MONITOR_INCIDENT_THRESHOLD = "2";

    const first = await reportHeartbeat(makeInput());
    expect(mocks.createIncident).not.toHaveBeenCalled();
    expect(mocks.createIncidentIssue).not.toHaveBeenCalled();
    expect(first.incidentCreated).toBe(false);
    expect(storedRow).toMatchObject({ consecutive_failures: 1, status: "resolved" });

    const second = await reportHeartbeat(makeInput());
    expect(mocks.createIncident).toHaveBeenCalledTimes(1);
    expect(mocks.createIncidentIssue).toHaveBeenCalledTimes(1);
    expect(second.incidentCreated).toBe(true);
    expect(storedRow).toMatchObject({ consecutive_failures: 2, status: "open" });
  });
});
