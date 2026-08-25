import { describe, expect, it } from "vitest";
import {
  formatRecruitmentRaidSummary,
  getRecruitmentDiscordRaidProgress,
  getRecruitmentRaidsForSeason,
  getRecruitmentRaidSeasonLabel,
  getRecruitmentRaidName,
} from "./raid-progression";

describe("recruitment raid progression helpers", () => {
  const raidProgression = {
    "tier-mn-1": {
      summary: "5/9 M",
      total_bosses: 9,
      normal_bosses_killed: 9,
      heroic_bosses_killed: 9,
      mythic_bosses_killed: 5,
    },
    sporefall: {
      summary: "1/1 M",
      total_bosses: 1,
      normal_bosses_killed: 1,
      heroic_bosses_killed: 1,
      mythic_bosses_killed: 1,
    },
    "amirdrassil-the-dreams-hope": {
      summary: "9/9 H",
      total_bosses: 9,
      normal_bosses_killed: 9,
      heroic_bosses_killed: 9,
      mythic_bosses_killed: 0,
    },
  } as const;

  it("maps sporefall and midnight seasons to the expected labels", () => {
    expect(getRecruitmentRaidName("sporefall")).toBe("Sporefall");
    expect(getRecruitmentRaidSeasonLabel("sporefall")).toBe("Midnight S1");
    expect(getRecruitmentRaidSeasonLabel("tier-mn-1")).toBe("Midnight S1");
    expect(getRecruitmentRaidSeasonLabel("voidspire")).toBe("Midnight S2");
  });

  it("formats raids for the selected season and keeps sporefall separate", () => {
    const raids = getRecruitmentRaidsForSeason(raidProgression, "season-mn-1");

    expect(raids.map(([slug]) => slug)).toEqual(["tier-mn-1", "sporefall"]);
    expect(raids[0]?.[1].summary).toBe("5/9 M");
    expect(raids[1]?.[1].summary).toBe("1/1 M");
  });

  it("falls back to the expansion group when a seasonal label is not defined", () => {
    const raids = getRecruitmentRaidsForSeason(raidProgression, "season-df-4");

    expect(raids.map(([slug]) => slug)).toEqual([
      "amirdrassil-the-dreams-hope",
    ]);
  });

  it("builds a multi-line discord summary for meaningful raids only", () => {
    const text = getRecruitmentDiscordRaidProgress(raidProgression);

    expect(text).toContain("Midnight S1 • Midnight: 5/9 M");
    expect(text).toContain("Midnight S1 • Sporefall: 1/1 M");
    expect(text).not.toContain("9/9 H");
  });

  it("falls back cleanly when raid summary is missing", () => {
    expect(
      formatRecruitmentRaidSummary({
        summary: "",
        total_bosses: 9,
        normal_bosses_killed: 0,
        heroic_bosses_killed: 0,
        mythic_bosses_killed: 0,
      }),
    ).toBe("0/9 N");

    expect(getRecruitmentDiscordRaidProgress(null)).toBe("N/A");
  });
});
