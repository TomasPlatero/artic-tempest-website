import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { mockUseSession, mockUseApiQuery } = vi.hoisted(() => ({
	mockUseSession: vi.fn(),
	mockUseApiQuery: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("react")>();

	return {
		...actual,
		useSyncExternalStore: () => true,
	};
});

vi.mock("next-auth/react", () => ({
	useSession: mockUseSession,
	signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	usePathname: () => "/",
	useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/link", () => ({
	default: ({ href, children, ...props }: any) => (
		<a href={typeof href === "string" ? href : "#"} {...props}>
			{children}
		</a>
	),
}));

vi.mock("next/image", () => ({
	default: ({
		priority: _priority,
		alt,
		src,
	}: {
		priority?: boolean;
		alt?: string;
		src?: string;
	}) => <span data-alt={alt ?? ""} data-next-image={src ?? ""} />,
}));

vi.mock("@/domains/notifications/components/notification-bell", () => ({
	NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock("@/shared/hooks/use-api-query", () => ({
	useApiQuery: (key: unknown, config?: unknown) => mockUseApiQuery(key, config),
}));

vi.mock("@/shared/ui/dropdown-menu", () => ({
	DropdownMenu: ({ children }: any) => <div>{children}</div>,
	DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
	DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
	DropdownMenuItem: ({ children }: any) => <div>{children}</div>,
	DropdownMenuSeparator: () => <hr />,
}));

vi.mock("@/shared/ui/sheet", () => ({
	Sheet: ({ children }: any) => <div>{children}</div>,
	SheetContent: ({ children }: any) => <div>{children}</div>,
	SheetTrigger: ({ children }: any) => <>{children}</>,
	SheetHeader: ({ children }: any) => <div>{children}</div>,
	SheetTitle: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/shared/lib/use-prefers-reduced-motion", () => ({
	getScrollBehavior: () => "smooth",
	usePrefersReducedMotion: () => false,
}));

import { LandingNavigation } from "./navigation";

describe("LandingNavigation role color wiring", () => {
	it("renders avatar ring and role badge from /api/me roleColor instead of session.user.roleColor", () => {
		mockUseSession.mockReturnValue({
			data: {
				user: {
					username: "Thrall",
					roleLevel: "gm",
					roleColor: "#ffff00",
					roleFlags: { canAccessZonaRaider: true },
					avatarUrl: "https://example.com/avatar.webp",
				},
			},
		});

		mockUseApiQuery.mockImplementation((key: unknown) => {
			if (Array.isArray(key) && key[0] === "/api/me") {
				return {
					data: {
						role: "officer",
						roleColor: "#ffffff",
					},
				};
			}

			if (key === "/api/streamers") {
				return { data: [] };
			}

			if (key === "/api/recruitment/count") {
				return { data: { count: 0, applicantMessageCount: 0 } };
			}

			return { data: undefined };
		});

		const html = renderToStaticMarkup(<LandingNavigation />);

		expect(html).toContain("OFFICER");
		expect(html).toMatch(
			/style="box-shadow:0 0 0 2px #ffffff,\s*0 0 10px #ffffff66"/i,
		);
		expect(html).toMatch(
			/style="color:#ffffff;border-color:#ffffff33;background-color:#ffffff1A"/i,
		);
		expect(html).not.toContain("#ffff00");
	});
});
