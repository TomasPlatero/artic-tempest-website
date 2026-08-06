import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

import { getGuildCredentials, invalidateCredentialsCache } from "./credentials";

function makeMaybeSingle(data: unknown) {
  return vi.fn().mockResolvedValue({ data });
}

function makeTableChain(data: unknown, withEq = false) {
  const maybeSingle = makeMaybeSingle(data);
  const limit = vi.fn(() => ({ maybeSingle }));
  const eq = vi.fn(() => ({ limit, maybeSingle }));
  const select = vi.fn(() => (withEq ? { eq, limit, maybeSingle } : { limit, maybeSingle }));
  return { select };
}

describe("getGuildCredentials", () => {
  beforeEach(() => {
    invalidateCredentialsCache();
    createClientMock.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.WOWAUDIT_API_KEY = "env-wowaudit-key";
  });

  it("loads WoWAudit api key from app_wowaudit", async () => {
    const discord = makeTableChain({ discord_client_id: "discord-id" }, true);
    const battlenet = makeTableChain(null);
    const wowaudit = makeTableChain({ wowaudit_api_key: "db-wowaudit-key" });
    const wcl = makeTableChain(null);

    createClientMock.mockReturnValue({
      from(table: string) {
        switch (table) {
          case "app_discord": return discord;
          case "app_battlenet": return battlenet;
          case "app_wowaudit": return wowaudit;
          case "app_wcl": return wcl;
          default: throw new Error(`Unexpected table ${table}`);
        }
      },
    });

    const creds = await getGuildCredentials();

    expect(creds.wowaudit_api_key).toBe("db-wowaudit-key");
    expect(creds.sources?.wowaudit).toBe("db");
  });

  it("falls back to env when app_wowaudit is empty", async () => {
    const discord = makeTableChain({ discord_client_id: "discord-id" }, true);
    const battlenet = makeTableChain(null);
    const wowaudit = makeTableChain({ wowaudit_api_key: null });
    const wcl = makeTableChain(null);

    createClientMock.mockReturnValue({
      from(table: string) {
        switch (table) {
          case "app_discord": return discord;
          case "app_battlenet": return battlenet;
          case "app_wowaudit": return wowaudit;
          case "app_wcl": return wcl;
          default: throw new Error(`Unexpected table ${table}`);
        }
      },
    });

    const creds = await getGuildCredentials();

    expect(creds.wowaudit_api_key).toBe("env-wowaudit-key");
    expect(creds.sources?.wowaudit).toBe("env");
  });
});
