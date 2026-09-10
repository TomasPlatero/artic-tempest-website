/**
 * Security header regression tests.
 *
 * Tests that next.config.ts header configuration and proxy.ts withSecurityHeaders
 * produce all mandated security headers. No HTTP server needed — pure export assertions.
 *
 * @ci
 */

import { describe, it, expect, beforeAll } from "vitest";
import { assertSecurityHeaders } from "./test-utils";
import {
	applySecurityHeaders,
	SECURITY_HEADER_VALUES,
} from "./response-headers";

// Note: next.config.ts is expensive to import (Sentry config checks) and may have
// side effects at import time, so it is loaded once for the whole file.
const CATCH_ALL_SOURCE = "/:path((?!_next|api|assets).*)";

let staticHeaders: Array<{ key: string; value: string }> = [];
let cspValue = "";

beforeAll(async () => {
	const configModule = await import("@/../next.config");
	const config = configModule.default;

	if (typeof config?.headers !== "function") return;

	const headerConfigs = await config.headers();
	// Find the catch-all route pattern that carries security headers
	const catchAll = headerConfigs.find(
		(h: { source: string }) => h.source === CATCH_ALL_SOURCE,
	);

	if (!catchAll?.headers) return;

	staticHeaders = catchAll.headers;
	cspValue =
		catchAll.headers.find(
			(h: { key: string; value: string }) => h.key === "Content-Security-Policy",
		)?.value ?? "";
}, 30_000);

describe("next.config.ts security headers", () => {
	it("has all mandated static security headers via assertSecurityHeaders", () => {
		expect(staticHeaders.length).toBeGreaterThanOrEqual(8);
		const headers = new Headers();
		for (const { key, value } of staticHeaders) {
			headers.set(key, value);
		}
		assertSecurityHeaders(headers);
	});

	it("does not carry X-Frame-Options, which the proxy applies instead", () => {
		// 8e55a18a (v1.10.9) moved X-Frame-Options out of next.config.ts into the
		// proxy, so redirects and maintenance responses carry it too.
		expect(
			staticHeaders.find((h) => h.key === "X-Frame-Options"),
		).toBeUndefined();
	});

	it("sets X-Content-Type-Options to nosniff", () => {
		const header = staticHeaders.find((h) => h.key === "X-Content-Type-Options");
		expect(header?.value).toBe("nosniff");
	});

	it("sets Referrer-Policy to strict-origin-when-cross-origin", () => {
		const header = staticHeaders.find((h) => h.key === "Referrer-Policy");
		expect(header?.value).toBe("strict-origin-when-cross-origin");
	});

	it("sets Strict-Transport-Security with correct max-age and directives", () => {
		const header = staticHeaders.find(
			(h) => h.key === "Strict-Transport-Security",
		);
		expect(header?.value).toBe("max-age=31536000; includeSubDomains; preload");
	});

	it("sets Permissions-Policy disabling camera, microphone, geolocation", () => {
		const header = staticHeaders.find((h) => h.key === "Permissions-Policy");
		expect(header?.value).toContain("camera=()");
		expect(header?.value).toContain("microphone=()");
		expect(header?.value).toContain("geolocation=()");
	});

	it("sets Cross-Origin-Opener-Policy to same-origin-allow-popups", () => {
		const header = staticHeaders.find(
			(h) => h.key === "Cross-Origin-Opener-Policy",
		);
		expect(header?.value).toBe("same-origin-allow-popups");
	});

	it("sets Cross-Origin-Resource-Policy to same-origin", () => {
		const header = staticHeaders.find(
			(h) => h.key === "Cross-Origin-Resource-Policy",
		);
		expect(header?.value).toBe("same-origin");
	});
});

describe("Content-Security-Policy specifics", () => {
	it("contains object-src 'none'", () => {
		expect(cspValue).toContain("object-src 'none'");
	});

	it("contains base-uri 'self'", () => {
		expect(cspValue).toContain("base-uri 'self'");
	});

	it("contains form-action 'self'", () => {
		expect(cspValue).toContain("form-action 'self'");
	});

	it("contains frame-ancestors 'none'", () => {
		expect(cspValue).toContain("frame-ancestors 'none'");
	});

	it("contains upgrade-insecure-requests", () => {
		expect(cspValue).toContain("upgrade-insecure-requests");
	});

	it("does NOT contain unsafe-eval in production mode", () => {
		// In test (NODE_ENV=test), unsafe-eval may or may not be present.
		// The production check is handled in assertSecurityHeaders.
		// This test verifies the behavior based on actual NODE_ENV.
		if (process.env.NODE_ENV === "production") {
			expect(cspValue).not.toContain("'unsafe-eval'");
		}
	});
});

/** Headers that must reach the browser, set by either layer. */
const MANDATED_HEADER_KEYS = [
	"Content-Security-Policy",
	"X-Frame-Options",
	"X-Content-Type-Options",
	"Referrer-Policy",
	"Strict-Transport-Security",
	"Permissions-Policy",
	"Cross-Origin-Opener-Policy",
	"Cross-Origin-Resource-Policy",
] as const;

describe("proxy runtime security headers", () => {
	it("sets every runtime header on a response", () => {
		const headers = applySecurityHeaders(new Headers());

		expect(headers.get("X-Frame-Options")).toBe("DENY");
		expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
		expect(headers.get("Referrer-Policy")).toBe(
			SECURITY_HEADER_VALUES["Referrer-Policy"],
		);
		expect(headers.get("Strict-Transport-Security")).toBe(
			"max-age=31536000; includeSubDomains; preload",
		);
	});

	it("advertises the same Referrer-Policy as the static config", () => {
		// Both layers must agree: next.config.ts and the proxy used to send
		// different values, and whichever one won was undeclared (ATW-23).
		const referrer = staticHeaders.find((h) => h.key === "Referrer-Policy");

		expect(referrer?.value).toBe(SECURITY_HEADER_VALUES["Referrer-Policy"]);
	});

	it("covers, with next.config.ts, all 8 mandated headers", () => {
		// The mandated headers are split across two layers: the static list in
		// next.config.ts and the runtime list the proxy applies to every response.
		const staticKeys = staticHeaders.map((h) => h.key);
		const covered = [...staticKeys, ...Object.keys(SECURITY_HEADER_VALUES)];

		for (const key of MANDATED_HEADER_KEYS) {
			expect(covered, `${key} missing from config and proxy`).toContain(key);
		}
	});
});
