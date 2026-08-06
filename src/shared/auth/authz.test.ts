import { describe, it, expect } from "vitest";
import { hasAuthzScope, resolveAuthzScopeFromFlags } from "./authz-core";

describe("authz scope helpers", () => {
	it("orders scopes correctly", () => {
		expect(hasAuthzScope("public", "public")).toBe(true);
		expect(hasAuthzScope("authenticated", "public")).toBe(true);
		expect(hasAuthzScope("authenticated", "zona_raider")).toBe(false);
		expect(hasAuthzScope("internal_admin", "zona_raider")).toBe(true);
	});

	it("resolves internal admin from super admin flag", () => {
		expect(
			resolveAuthzScopeFromFlags(
				"gm",
				{ canAccessZonaRaider: false, isSuperAdmin: true },
				false,
			),
		).toBe("internal_admin");
		expect(
			resolveAuthzScopeFromFlags(
				"officer",
				{ canAccessZonaRaider: false, isSuperAdmin: true },
				false,
			),
		).toBe("internal_admin");
		expect(
			resolveAuthzScopeFromFlags(
				"raider",
				{ canAccessZonaRaider: true, isSuperAdmin: false },
				false,
			),
		).toBe("zona_raider");
		expect(
			resolveAuthzScopeFromFlags(
				"member",
				{ canAccessZonaRaider: false, isSuperAdmin: false },
				false,
			),
		).toBe("authenticated");
	});
});
