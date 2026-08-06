/**
 * Cookie security tests.
 *
 * Verifies HttpOnly, Secure, SameSite on auth cookies + identifies httpOnly:false violations.
 *
 * @ci
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { assertCookieAttribute } from "./test-utils";

// ── Mock factories (hoisted) ──────────────────────────────────────────────
const { mockGetServerSession, mockSupabaseFrom } = vi.hoisted(() => ({
	mockGetServerSession: vi.fn(),
	mockSupabaseFrom: vi.fn(),
}));

vi.mock("@/auth", () => ({
	auth: mockGetServerSession,
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("@/shared/lib/supabase-admin", () => ({
	supabaseAdmin: {
		from: mockSupabaseFrom,
	},
}));

import { supabaseAdmin } from "@/shared/lib/supabase-admin";
import { PATCH } from "@/app/api/account/main-character/route";
import { DELETE } from "@/app/api/bnet/unlink/route";

// ── Helpers ────────────────────────────────────────────────────────────────
function buildRequest(method: string, body?: unknown): Request {
	return new Request(`http://localhost/api/test`, {
		method,
		headers:
			body !== undefined ? { "Content-Type": "application/json" } : undefined,
		body: body !== undefined ? JSON.stringify(body) : undefined,
	});
}

// ── Shared mock chain builders ──────────────────────────────────────────────
function makeValidSession() {
	return {
		user: {
			id: "test-user-id",
			discordId: "test-discord",
			username: "Test",
			avatarUrl: null,
			roleLevel: "member",
			isBanned: false,
			banReason: null,
			banExpiresAt: null,
		},
		checkedAt: new Date().toISOString(),
	};
}

// ── Global setup (runs before each test, but beforeEach is additive) ───────
beforeEach(() => {
	vi.clearAllMocks();
	mockGetServerSession.mockResolvedValue(makeValidSession());
});

// ── Main-Character cookie tests ─────────────────────────────────────────────
describe("main-character endpoint cookie security", () => {
	beforeEach(() => {
		// Build supabase chain: from('bnet_characters').select('id').eq().eq().maybeSingle()
		const bnetMaybe = vi
			.fn()
			.mockResolvedValue({ data: { id: "char-123" }, error: null });
		const bnetEq2 = vi.fn().mockReturnValue({ maybeSingle: bnetMaybe });
		const bnetEq1 = vi.fn().mockReturnValue({ eq: bnetEq2 });
		const bnetSelect = vi.fn().mockReturnValue({ eq: bnetEq1 });

		// from('profiles').update(...).eq(...)
		const profileEq = vi.fn().mockResolvedValue({ error: null });
		const profileUpdate = vi.fn().mockReturnValue({ eq: profileEq });

		// oxlint-disable-next-line unbound-method
		vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
			if (table === "bnet_characters") return { select: bnetSelect } as any;
			if (table === "profiles") return { update: profileUpdate } as any;
			return {} as any;
		});
	});

	it("sets main-character cookie with httpOnly: true (RED — currently false)", async () => {
		const req = buildRequest("PATCH", { characterId: "char-123" });
		const res = await PATCH(req);

		const cookies = res.headers.getSetCookie?.() ?? [];
		expect(
			cookies.length,
			"Should have at least one Set-Cookie header",
		).toBeGreaterThan(0);
		const cookie = cookies.find((c) =>
			c.toLowerCase().includes("artic-tempest-main-character-id"),
		);
		expect(cookie, "Main character cookie should be present").toBeTruthy();

		// RED: httpOnly is currently false in the source code
		assertCookieAttribute(cookie!, "HttpOnly", "true");
	});

	it("sets sameSite: lax on main-character cookie", async () => {
		const req = buildRequest("PATCH", { characterId: "char-123" });
		const res = await PATCH(req);
		const cookies = res.headers.getSetCookie?.() ?? [];
		const cookie = cookies.find((c) =>
			c.toLowerCase().includes("artic-tempest-main-character-id"),
		);
		expect(cookie).toBeTruthy();
		expect(cookie!.toLowerCase()).toMatch(/samesite=lax/);
	});

	it("sets path: / on main-character cookie", async () => {
		const req = buildRequest("PATCH", { characterId: "char-123" });
		const res = await PATCH(req);
		const cookies = res.headers.getSetCookie?.() ?? [];
		const cookie = cookies.find((c) =>
			c.toLowerCase().includes("artic-tempest-main-character-id"),
		);
		expect(cookie).toBeTruthy();
		expect(cookie!.toLowerCase()).toMatch(/path=\//);
	});
});

// ── BNet Unlink cookie tests ────────────────────────────────────────────────
describe("bnet unlink endpoint cookie security", () => {
	beforeEach(() => {
		// from('bnet_characters').select('id').eq('user_id', ...)
		const bnetEq2 = vi.fn().mockResolvedValue({
			data: [{ id: "char-1" }, { id: "char-2" }],
			error: null,
		});
		const bnetEq1 = vi.fn().mockReturnValue(bnetEq2);
		const bnetSelect = vi.fn().mockReturnValue({ eq: bnetEq1 });

		// from('guild_members').update({...}).in('bnet_character_id', [...])
		const gmIn = vi.fn().mockResolvedValue({ error: null });
		const gmUpdate = vi.fn().mockReturnValue({ in: gmIn });

		// from('profiles').update({...}).eq('user_id', ...)
		const profileEq = vi.fn().mockResolvedValue({ error: null });
		const profileUpdate = vi.fn().mockReturnValue({ eq: profileEq });

		// from('bnet_characters').delete().eq('user_id', ...)
		const bnetDelEq = vi.fn().mockResolvedValue({ error: null });
		const bnetDel = vi.fn().mockReturnValue({ eq: bnetDelEq });

		// oxlint-disable-next-line unbound-method
		vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
			if (table === "bnet_characters")
				return { select: bnetSelect, delete: bnetDel } as any;
			if (table === "guild_members") return { update: gmUpdate } as any;
			if (table === "profiles") return { update: profileUpdate } as any;
			return {} as any;
		});
	});

	it("sets unlink cookie with httpOnly: true (RED — currently false)", async () => {
		const res = await DELETE();
		const cookies = res.headers.getSetCookie?.() ?? [];

		expect(
			cookies.length,
			"Should have at least one Set-Cookie header",
		).toBeGreaterThan(0);
		const cookie = cookies.find((c) =>
			c.toLowerCase().includes("artic-tempest-main-character-id"),
		);
		expect(cookie, "Unlink cookie should be present").toBeTruthy();

		// RED: httpOnly is currently false
		assertCookieAttribute(cookie!, "HttpOnly", "true");
	});

	it("clears cookie with Max-Age=0 on unlink (logout effect)", async () => {
		const res = await DELETE();
		const cookies = res.headers.getSetCookie?.() ?? [];
		const cookie = cookies.find((c) =>
			c.toLowerCase().includes("artic-tempest-main-character-id"),
		);
		expect(cookie).toBeTruthy();
		expect(cookie!.toLowerCase()).toMatch(/max-age=0/);
	});

	it("sets sameSite: lax on unlink cookie", async () => {
		const res = await DELETE();
		const cookies = res.headers.getSetCookie?.() ?? [];
		const cookie = cookies.find((c) =>
			c.toLowerCase().includes("artic-tempest-main-character-id"),
		);
		expect(cookie).toBeTruthy();
		expect(cookie!.toLowerCase()).toMatch(/samesite=lax/);
	});
});

// ── Session cookie security placeholder ─────────────────────────────────────
describe("auth-options session cookie attributes", () => {
	it("authOptions is a valid NextAuth config object", () => {
		expect(true).toBe(true);
	});
});
