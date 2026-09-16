import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------
const { mockEnsureAdmin } = vi.hoisted(() => ({
	mockEnsureAdmin: vi.fn(),
}));

vi.mock("@/shared/auth/permissions", () => ({
	ensureAdmin: mockEnsureAdmin,
}));

type RecordedOp = { table: string; method: string; args: unknown[] };

const { mockFrom, operations, setResolver } = vi.hoisted(() => {
	const operations: RecordedOp[] = [];
	let resolver: (
		table: string,
		ops: RecordedOp[],
	) => { data?: unknown; error?: unknown } = () => ({ data: null, error: null });

	function buildChain(table: string): Record<string, unknown> {
		const ops: RecordedOp[] = [];
		const chain: Record<string, unknown> = {};
		const chainable =
			(method: string) =>
			(...args: unknown[]) => {
				ops.push({ table, method, args });
				operations.push({ table, method, args });
				return chain;
			};

		chain.insert = chainable("insert");
		chain.update = chainable("update");
		chain.delete = chainable("delete");
		chain.select = chainable("select");
		chain.eq = chainable("eq");
		chain.in = chainable("in");
		chain.order = chainable("order");
		chain.single = () => {
			ops.push({ table, method: "single", args: [] });
			operations.push({ table, method: "single", args: [] });
			return Promise.resolve(resolver(table, ops));
		};
		// oxlint-disable-next-line unicorn/no-thenable
		chain.then = (
			onFulfilled: (value: unknown) => unknown,
			onRejected?: (error: unknown) => unknown,
		) => Promise.resolve(resolver(table, ops)).then(onFulfilled, onRejected);

		return chain;
	}

	const mockFrom = vi.fn((table: string) => {
		const chain = buildChain(table);
		operations.push({ table, method: "from", args: [] });
		return chain;
	});

	return {
		mockFrom,
		operations,
		setResolver: (
			next: (
				table: string,
				ops: RecordedOp[],
			) => { data?: unknown; error?: unknown },
		) => {
			resolver = next;
		},
	};
});

vi.mock("@/shared/lib/supabase-admin", () => ({
	supabaseAdmin: { from: mockFrom },
}));

import { POST, PATCH } from "./route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildRequest(method: "POST" | "PATCH", body: unknown): Request {
	return new Request("http://localhost/api/admin/navigation", {
		method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

function itemsOps() {
	return operations.filter((op) => op.table === "navigation_items");
}

function roleOps() {
	return operations.filter((op) => op.table === "navigation_item_roles");
}

function insertedRoles() {
	const insert = roleOps().find((op) => op.method === "insert");
	return (insert?.args[0] ?? []) as { item_id: string; role_level: string }[];
}

beforeEach(() => {
	operations.length = 0;
	mockFrom.mockClear();
	mockEnsureAdmin.mockReset();
	mockEnsureAdmin.mockResolvedValue({});
	setResolver(() => ({ data: null, error: null }));
});

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------
describe("POST /api/admin/navigation", () => {
	it("creates the item and stores the selected roles", async () => {
		setResolver((table) =>
			table === "navigation_items"
				? { data: { id: "item-1" }, error: null }
				: { error: null },
		);

		const response = await POST(
			buildRequest("POST", {
				name: "Nuevo Enlace",
				url: "/zona-raider/roster",
				icon_name: "IconUsers",
				order_index: 10,
				parent_id: null,
				roles: ["gm", "officer"],
			}),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ id: "item-1" });
		expect(insertedRoles()).toEqual([
			{ item_id: "item-1", role_level: "gm" },
			{ item_id: "item-1", role_level: "officer" },
		]);
	});

	it("never sends a draft placeholder or the menu-editor-only fields to the table", async () => {
		setResolver(() => ({ data: { id: "item-2" }, error: null }));

		await POST(
			buildRequest("POST", {
				name: "Nueva Categoría",
				url: null,
				roles: [],
				isDraft: true,
				insertAfterId: "sibling-1",
			}),
		);

		const insert = itemsOps().find((op) => op.method === "insert");
		expect(insert?.args[0]).not.toHaveProperty("roles");
		expect(insert?.args[0]).not.toHaveProperty("isDraft");
		expect(insert?.args[0]).not.toHaveProperty("insertAfterId");
		expect(roleOps()).toHaveLength(0);
	});

	it("drops blank and duplicate role slugs before inserting", async () => {
		setResolver(() => ({ data: { id: "item-3" }, error: null }));

		await POST(
			buildRequest("POST", {
				name: "Roster",
				url: "/zona-raider/roster",
				roles: ["gm", " gm ", "", null, "officer", "officer"],
			}),
		);

		expect(insertedRoles()).toEqual([
			{ item_id: "item-3", role_level: "gm" },
			{ item_id: "item-3", role_level: "officer" },
		]);
	});

	it("reports a failing role insert as a 500 instead of a silent success", async () => {
		setResolver((table) =>
			table === "navigation_items"
				? { data: { id: "item-4" }, error: null }
				: { error: { message: "null value in column role_level" } },
		);

		const response = await POST(
			buildRequest("POST", { name: "Roster", url: "/a", roles: ["gm"] }),
		);

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			error: "null value in column role_level",
		});
	});
});

// ---------------------------------------------------------------------------
// PATCH
// ---------------------------------------------------------------------------
describe("PATCH /api/admin/navigation", () => {
	it("adds the missing roles and removes the unchecked ones", async () => {
		setResolver((table, ops) => {
			if (
				table === "navigation_item_roles" &&
				ops.some((op) => op.method === "select")
			) {
				return {
					data: [{ role_level: "gm" }, { role_level: "officer" }],
					error: null,
				};
			}
			return { data: null, error: null };
		});

		const response = await PATCH(
			buildRequest("PATCH", {
				id: "item-5",
				name: "Roster",
				roles: ["gm", "raider"],
			}),
		);

		expect(response.status).toBe(200);
		expect(insertedRoles()).toEqual([
			{ item_id: "item-5", role_level: "raider" },
		]);
		const deleteOp = roleOps().find((op) => op.method === "delete");
		const inOp = roleOps().find((op) => op.method === "in");
		expect(deleteOp).toBeDefined();
		expect(inOp?.args).toEqual(["role_level", ["officer"]]);
	});

	it("inserts before deleting so a failed insert cannot wipe the stored roles", async () => {
		setResolver((table, ops) => {
			if (
				table === "navigation_item_roles" &&
				ops.some((op) => op.method === "select")
			) {
				return { data: [{ role_level: "officer" }], error: null };
			}
			return { data: null, error: null };
		});

		await PATCH(
			buildRequest("PATCH", { id: "item-6", name: "Roster", roles: ["gm"] }),
		);

		const insertIndex = roleOps().findIndex((op) => op.method === "insert");
		const deleteIndex = roleOps().findIndex((op) => op.method === "delete");
		expect(insertIndex).toBeGreaterThan(-1);
		expect(deleteIndex).toBeGreaterThan(insertIndex);
	});

	it("leaves the stored roles untouched when the payload has no roles key", async () => {
		setResolver(() => ({ data: null, error: null }));

		await PATCH(buildRequest("PATCH", { id: "item-7", is_active: false }));

		expect(roleOps()).toHaveLength(0);
		expect(itemsOps().some((op) => op.method === "update")).toBe(true);
	});

	it("clears every role when the payload sends an empty list", async () => {
		setResolver((table, ops) => {
			if (
				table === "navigation_item_roles" &&
				ops.some((op) => op.method === "select")
			) {
				return { data: [{ role_level: "gm" }], error: null };
			}
			return { data: null, error: null };
		});

		await PATCH(
			buildRequest("PATCH", { id: "item-8", name: "Comunidad", roles: [] }),
		);

		expect(insertedRoles()).toEqual([]);
		const inOp = roleOps().find((op) => op.method === "in");
		expect(inOp?.args).toEqual(["role_level", ["gm"]]);
	});

	it("rejects a payload without id", async () => {
		const response = await PATCH(buildRequest("PATCH", { name: "Sin id" }));

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ error: "Item ID is required" });
	});
});
