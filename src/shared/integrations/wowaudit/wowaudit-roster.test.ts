import { describe, expect, it } from "vitest";
import {
  buildWowauditRosterRows,
  resolveWowauditClassId,
  resolveWowauditRank,
  slugifyRealm,
} from "./wowaudit-roster";

describe("wowaudit roster helpers", () => {
  it("slugifies realms consistently", () => {
    expect(slugifyRealm("Pozzo dell'Eternita")).toBe("pozzo-dell-eternita");
  });

  it("resolves known classes by name", () => {
    expect(resolveWowauditClassId("Mage", { mago: 8 })).toBe(8);
    expect(resolveWowauditClassId("Paladín", { paladin: 2 })).toBe(2);
  });

  it("falls back to existing rank when present", () => {
    expect(resolveWowauditRank("Main", { existingRank: 4 })).toBe(4);
  });

  it("maps Artic Mod to the Artic Raider rank icon slot", () => {
    expect(resolveWowauditRank("Artic Mod")).toBe(4);
  });

  it("builds roster rows with safe defaults", () => {
    const rows = buildWowauditRosterRows({
      characters: [
        {
          id: 123,
          name: "Sheday",
          realm: "Stormrage",
          class: "Paladin",
          role: "Melee",
          rank: "Main",
        },
      ],
      existingMembers: [],
      classIdByName: { paladin: 2 },
      wowauditRanks: [{ rank: 6, name: "Trial", color: null, image_url: null, roster_section: "main" }],
      syncedAt: "2026-06-17T00:00:00.000Z",
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      character_name: "Sheday",
      realm_slug: "stormrage",
      realm_name: "Stormrage",
      class_id: 2,
      level: 80,
      rank: 5,
      role: "melee",
      synced_at: "2026-06-17T00:00:00.000Z",
    });
  });
});
