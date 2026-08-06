import { describe, it, expect } from "vitest";
import { getApiRouteBoundary, isPublicApiRoute } from "./proxy-route-access";

describe("proxy route boundaries", () => {
	it("classifies public and protected routes", () => {
		expect(getApiRouteBoundary("/api/auth/signin")).toBe("public");
		expect(getApiRouteBoundary("/api/raiderio")).toBe("public");
		expect(getApiRouteBoundary("/api/desktop/session")).toBe("integration");
		expect(getApiRouteBoundary("/api/desktop/raider-app/status")).toBe(
			"zona-raider",
		);
		expect(getApiRouteBoundary("/api/admin/system/cron")).toBe("cron-internal");
		expect(getApiRouteBoundary("/api/admin/navigation")).toBe("internal-admin");
	});

	it("treats public/integration/raider routes as public api routes", () => {
		expect(isPublicApiRoute("/api/auth/session")).toBe(true);
		expect(isPublicApiRoute("/api/raiderio")).toBe(true);
		expect(isPublicApiRoute("/api/desktop/session")).toBe(true);
		expect(isPublicApiRoute("/api/raider-rules/accept")).toBe(true);
		expect(isPublicApiRoute("/api/admin/system/cron")).toBe(true);
		expect(isPublicApiRoute("/api/admin/navigation")).toBe(false);
	});
});
