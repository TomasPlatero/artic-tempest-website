import { describe, it, expect } from "vitest";
import {
  filterByRoleAndPermissions,
} from "./zona-raider-tour-utils";
import type { ZonaRaiderTourStep } from "./zona-raider-tour.config";

const steps: ZonaRaiderTourStep[] = [
  {
    id: "no-role-no-app",
    route: "/zona-raider",
    selector: "[data-tour-step='a']",
    title: "A",
    description: "A",
    estimatedMinutes: 1,
  },
  {
    id: "officer-only-no-app",
    route: "/zona-raider",
    selector: "[data-tour-step='b']",
    title: "B",
    description: "B",
    estimatedMinutes: 1,
    roles: ["officer"],
  },
  {
    id: "no-role-with-stats",
    route: "/zona-raider/estadisticas",
    selector: "[data-tour-step='c']",
    title: "C",
    description: "C",
    estimatedMinutes: 1,
    appId: "stats",
  },
  {
    id: "no-role-with-weekly-vault",
    route: "/zona-raider/camara-semanal",
    selector: "[data-tour-step='d']",
    title: "D",
    description: "D",
    estimatedMinutes: 1,
    appId: "weekly-vault",
  },
  {
    id: "officer-only-with-stats",
    route: "/zona-raider/estadisticas",
    selector: "[data-tour-step='e']",
    title: "E",
    description: "E",
    estimatedMinutes: 1,
    roles: ["officer"],
    appId: "stats",
  },
  {
    id: "member-only-with-roster",
    route: "/zona-raider/profesiones",
    selector: "[data-tour-step='f']",
    title: "F",
    description: "F",
    estimatedMinutes: 1,
    roles: ["member"],
    appId: "roster",
  },
];

describe("filterByRoleAndPermissions", () => {
  it("keeps steps without appId and without role restriction", () => {
    const result = filterByRoleAndPermissions(steps, "member", []);
    expect(result.map((s) => s.id)).toContain("no-role-no-app");
  });

  it("filters out steps restricted to a different role", () => {
    const result = filterByRoleAndPermissions(steps, "member", []);
    expect(result.map((s) => s.id)).not.toContain("officer-only-no-app");
  });

  it("keeps role-restricted steps when role matches", () => {
    const result = filterByRoleAndPermissions(steps, "officer", []);
    expect(result.map((s) => s.id)).toContain("officer-only-no-app");
  });

  it("filters out steps with appId when appId is NOT in viewableAppIds", () => {
    const result = filterByRoleAndPermissions(steps, "member", []);
    expect(result.map((s) => s.id)).not.toContain("no-role-with-stats");
    expect(result.map((s) => s.id)).not.toContain("no-role-with-weekly-vault");
  });

  it("keeps steps with appId when appId IS in viewableAppIds", () => {
    const result = filterByRoleAndPermissions(steps, "member", ["stats"]);
    expect(result.map((s) => s.id)).toContain("no-role-with-stats");
    expect(result.map((s) => s.id)).not.toContain("no-role-with-weekly-vault");
  });

  it("applies both role and appId filters together (both must match)", () => {
    const result = filterByRoleAndPermissions(steps, "officer", ["stats"]);
    expect(result.map((s) => s.id)).toContain("officer-only-with-stats");
  });

  it("excludes step when role matches but appId does not", () => {
    const result = filterByRoleAndPermissions(steps, "officer", ["roster"]);
    expect(result.map((s) => s.id)).not.toContain("officer-only-with-stats");
  });

  it("excludes step when appId matches but role does not", () => {
    const result = filterByRoleAndPermissions(steps, "member", ["stats"]);
    expect(result.map((s) => s.id)).not.toContain("officer-only-with-stats");
  });

  it("keeps step when both role and appId match", () => {
    const result = filterByRoleAndPermissions(steps, "member", ["roster"]);
    expect(result.map((s) => s.id)).toContain("member-only-with-roster");
  });

  it("is case-insensitive and whitespace-tolerant for role level", () => {
    const result = filterByRoleAndPermissions(steps, "  OFFICER  ", ["stats"]);
    expect(result.map((s) => s.id)).toContain("officer-only-no-app");
    expect(result.map((s) => s.id)).toContain("officer-only-with-stats");
  });

  it("returns all non-appId steps plus matching appId steps", () => {
    const result = filterByRoleAndPermissions(steps, "member", ["stats", "weekly-vault"]);
    const ids = result.map((s) => s.id);
    expect(ids).toContain("no-role-no-app");
    expect(ids).toContain("no-role-with-stats");
    expect(ids).toContain("no-role-with-weekly-vault");
    expect(ids).not.toContain("officer-only-no-app");
    expect(ids).not.toContain("officer-only-with-stats");
    expect(ids).not.toContain("member-only-with-roster");
  });
});
