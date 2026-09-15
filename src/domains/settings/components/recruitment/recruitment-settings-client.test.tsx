/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { RecruitmentSettingsClient } from "./recruitment-settings-client";

// Mirrors how Next.js exposes the query string to client components.
vi.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams(window.location.search),
}));

vi.mock("@/domains/settings/components/recruitment/spots-manager", () => ({
	SpotsManager: () => <div data-testid="spots-content" />,
}));

vi.mock("@/domains/settings/components/recruitment/form-builder", () => ({
	FormBuilder: () => <div data-testid="form-content" />,
}));

vi.mock("@/domains/settings/components/recruitment/recruitment-inbox", () => ({
	RecruitmentInbox: () => <div data-testid="inbox-content" />,
}));

const SETTINGS_PATH = "/zona-raider/configuracion/reclutamiento";

function setUrl(search: string) {
	window.history.replaceState(null, "", `${SETTINGS_PATH}${search}`);
}

function renderSettings() {
	return render(
		<RecruitmentSettingsClient
			initialSpots={[]}
			initialQuestions={[]}
			constants={[]}
			applications={[]}
			currentRoleLevel="officer"
		/>,
	);
}

function tabState(name: RegExp) {
	return screen.getByRole("tab", { name }).getAttribute("data-state");
}

afterEach(() => {
	cleanup();
	window.history.replaceState(null, "", "/");
});

describe("RecruitmentSettingsClient tab routing", () => {
	it("opens the tab requested by ?tab=inbox", () => {
		setUrl("?tab=inbox");

		renderSettings();

		expect(tabState(/bandeja de entrada/i)).toBe("active");
		expect(screen.queryByTestId("inbox-content")).not.toBeNull();
	});

	it("falls back to the spots tab when there is no ?tab param", () => {
		setUrl("");

		renderSettings();

		expect(tabState(/vacantes de clase/i)).toBe("active");
		expect(screen.queryByTestId("spots-content")).not.toBeNull();
	});

	it("switches tab when the query string changes without remounting the route", () => {
		// Regression: the recruitment badge in the public and Zona Raider menus links
		// to `?tab=inbox`. Navigating within the same route only changes the query
		// string, so the route is not remounted and `defaultValue` would be ignored.
		setUrl("?tab=spots");
		const { rerender } = renderSettings();

		expect(tabState(/vacantes de clase/i)).toBe("active");

		setUrl("?tab=inbox");
		rerender(
			<RecruitmentSettingsClient
				initialSpots={[]}
				initialQuestions={[]}
				constants={[]}
				applications={[]}
				currentRoleLevel="officer"
			/>,
		);

		expect(tabState(/bandeja de entrada/i)).toBe("active");
		expect(screen.queryByTestId("inbox-content")).not.toBeNull();
	});

	it("keeps the URL query in sync with the selected tab", () => {
		setUrl("?tab=spots");
		const { rerender } = renderSettings();

		fireEvent.mouseDown(screen.getByRole("tab", { name: /bandeja de entrada/i }));

		expect(window.location.search).toBe("?tab=inbox");

		// Next.js re-renders the router after a native history update.
		rerender(
			<RecruitmentSettingsClient
				initialSpots={[]}
				initialQuestions={[]}
				constants={[]}
				applications={[]}
				currentRoleLevel="officer"
			/>,
		);

		expect(tabState(/bandeja de entrada/i)).toBe("active");
	});
});
