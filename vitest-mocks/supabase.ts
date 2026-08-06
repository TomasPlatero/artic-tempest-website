/**
 * Global Supabase client mock for testing.
 *
 * Prevents real network calls to Supabase in tests. Every chained method call
 * is thenable and resolves to { data: null, error: null } by default.
 * Individual tests override specific methods via .mockResolvedValueOnce etc.
 */
import { vi } from "vitest";

function createChainableMock(): any {
	const fn = vi.fn(() => createChainableMock());

	return new Proxy(fn, {
		apply(_target, _thisArg, _args) {
			// Return a thenable chainable mock — intermediate calls like
			// .from("b") chain further, terminal calls are awaited.
			const result = createChainableMock();
			result._isSupabaseMock = true;
			return result;
		},
		get(_target, prop) {
			// Forward vitest mock utilities to the underlying vi.fn()
			if (
				prop === "mockReturnValue" ||
				prop === "mockResolvedValue" ||
				prop === "mockImplementation" ||
				prop === "mockRejectedValue" ||
				prop === "mockResolvedValueOnce" ||
				prop === "mockRejectedValueOnce" ||
				prop === "getMockImplementation" ||
				prop === "mock" ||
				prop === "mockClear" ||
				prop === "mockReset" ||
				prop === "mockRestore" ||
				prop === "mockReturnThis" ||
				prop === "withImplementation" ||
				typeof prop === "symbol"
			) {
				return (fn as Record<string, unknown>)[prop as string];
			}
			// Make it thenable so `await supabaseAdmin.storage.from("b").list()`
			// resolves to a success-like response.
			if (prop === "then") {
				return (resolve: (value: unknown) => void) => {
					resolve({ data: null, error: null });
				};
			}
			if (prop === "catch") {
				return (_reject: (reason: unknown) => void) => {
					// Don't reject by default — treat as success
				};
			}
			// Chainable: supabaseAdmin.storage.from("b").list() etc.
			return createChainableMock();
		},
	});
}

export const mockSupabaseAdmin = createChainableMock();

vi.mock("@/shared/lib/supabase-admin", () => ({
	supabaseAdmin: mockSupabaseAdmin,
	SUPABASE_ADMIN_URL: "https://test-project.supabase.co",
	SUPABASE_ADMIN_KEY: "test-key",
}));
