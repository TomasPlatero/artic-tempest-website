import { describe, expect, it } from "vitest";
import {
  buildWowauditCharacterUpdate,
  toWowauditRank,
  toWowauditRole,
} from "./wowaudit-client";

describe("wowaudit client helpers", () => {
  it("maps local roster roles to WoWAudit roles", () => {
    expect(toWowauditRole("tank")).toBe("Tank");
    expect(toWowauditRole("heal")).toBe("Heal");
    expect(toWowauditRole("melee")).toBe("Melee");
    expect(toWowauditRole("ranged")).toBe("Ranged");
  });

  it("maps local roster rank slots to WoWAudit rank labels", () => {
    expect(toWowauditRank(0)).toBe("Guild Master");
    expect(toWowauditRank(1)).toBe("Oficial");
    expect(toWowauditRank(2)).toBe("Artic Mod");
    expect(toWowauditRank(3)).toBe("Raid Leader");
    expect(toWowauditRank(4)).toBe("Artic Raider");
    expect(toWowauditRank(5)).toBe("Raider");
    expect(toWowauditRank(6)).toBe("Trial");
    expect(toWowauditRank(7)).toBe("Alter Raider");
    expect(toWowauditRank(8)).toBe("Backup");
    expect(toWowauditRank(9, "Member")).toBe("Backup");
  });

  it("builds a compact update payload", () => {
    expect(
      buildWowauditCharacterUpdate({
        role: "Tank",
        rank: "Main",
        note: "Ready for raid",
      }),
    ).toMatchObject({
      role: "Tank",
      rank: "Main",
      note: "Ready for raid",
    });
  });
});
