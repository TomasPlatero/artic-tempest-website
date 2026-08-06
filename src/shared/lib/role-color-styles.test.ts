import { describe, expect, it } from "vitest";

import {
	getRoleAvatarBorderColor,
	getRoleBadgeStyle,
	getRoleRingStyle,
	resolveRoleColorFromMe,
} from "./role-color-styles";

describe("role color styles", () => {
	it("uses /api/me roleColor for landing navigation ring and badge styling instead of session roleColor", () => {
		const resolvedRoleColor = resolveRoleColorFromMe({
			meRoleColor: "#ffffff",
			sessionRoleColor: "#ffff00",
		});

		expect(resolvedRoleColor).toBe("#ffffff");
		expect(getRoleRingStyle(resolvedRoleColor)).toEqual({
			boxShadow: "0 0 0 2px #ffffff, 0 0 10px #ffffff66",
		});
		expect(getRoleBadgeStyle(resolvedRoleColor)).toEqual({
			color: "#ffffff",
			borderColor: "#ffffff33",
			backgroundColor: "#ffffff1A",
		});
		const yellowStyles = JSON.stringify({
			ring: getRoleRingStyle(resolvedRoleColor),
			badge: getRoleBadgeStyle(resolvedRoleColor),
		});
		expect(yellowStyles).not.toContain("#ffff00");
	});

	it("uses /api/me roleColor for Zona Raider NavUser avatar border and role badge", () => {
		const resolvedRoleColor = resolveRoleColorFromMe({
			meRoleColor: "#c41e3a",
		});

		expect(getRoleAvatarBorderColor(resolvedRoleColor)).toBe("#c41e3a");
		expect(getRoleBadgeStyle(resolvedRoleColor)).toEqual({
			color: "#c41e3a",
			borderColor: "#c41e3a33",
			backgroundColor: "#c41e3a1A",
		});
	});

	it("falls back safely when /api/me roleColor is missing", () => {
		const resolvedRoleColor = resolveRoleColorFromMe({
			meRoleColor: null,
			sessionRoleColor: "#ffff00",
		});

		expect(resolvedRoleColor).toBeNull();
		expect(getRoleRingStyle(resolvedRoleColor)).toBeUndefined();
		expect(getRoleBadgeStyle(resolvedRoleColor)).toBeUndefined();
		expect(getRoleAvatarBorderColor(resolvedRoleColor)).toBeUndefined();
	});
});
