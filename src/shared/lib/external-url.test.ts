import { describe, expect, it, vi } from "vitest";

import { isSafeExternalUrl, openExternalUrl } from "./external-url";

describe("isSafeExternalUrl", () => {
	it("accepts absolute http and https URLs", () => {
		expect(
			isSafeExternalUrl(
				"https://worldofwarcraft.blizzard.com/es-es/character/eu/x/y",
			),
		).toBe(true);
		expect(isSafeExternalUrl("http://localhost:3000/assets/x.webp")).toBe(true);
	});

	it("rejects dangerous schemes that could be used for phishing or script execution", () => {
		expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
		expect(isSafeExternalUrl("JaVaScRiPt:alert(1)")).toBe(false);
		expect(
			isSafeExternalUrl("data:text/html,<script>alert(1)</script>"),
		).toBe(false);
		expect(isSafeExternalUrl("vbscript:msgbox(1)")).toBe(false);
	});

	it("rejects relative paths, protocol-relative URLs and malformed input", () => {
		expect(isSafeExternalUrl("/zona-raider")).toBe(false);
		expect(isSafeExternalUrl("//evil.example.com")).toBe(false);
		expect(isSafeExternalUrl("not a url")).toBe(false);
		expect(isSafeExternalUrl("")).toBe(false);
		expect(isSafeExternalUrl(null)).toBe(false);
		expect(isSafeExternalUrl(undefined)).toBe(false);
	});
});

describe("openExternalUrl", () => {
	const captureOpenedAnchor = () => {
		const click = vi
			.spyOn(HTMLAnchorElement.prototype, "click")
			.mockImplementation(() => {});
		return {
			click,
			settle: () => {
				const anchor = click.mock.instances[0] as unknown as HTMLAnchorElement;
				click.mockRestore();
				return anchor;
			},
		};
	};

	it("opens safe URLs in a new tab without leaking the opener", () => {
		const { click, settle } = captureOpenedAnchor();
		openExternalUrl("https://raider.io/guilds/eu/x/y");
		expect(click).toHaveBeenCalledTimes(1);
		const anchor = settle();
		expect(anchor.href).toBe("https://raider.io/guilds/eu/x/y");
		expect(anchor.target).toBe("_blank");
		expect(anchor.rel).toBe("noopener noreferrer");
	});

	it("never navigates for an unsafe URL", () => {
		const { click, settle } = captureOpenedAnchor();
		openExternalUrl("javascript:alert(1)");
		expect(click).not.toHaveBeenCalled();
		settle();
	});

	it("never navigates for a relative path or for a missing URL", () => {
		const { click, settle } = captureOpenedAnchor();
		openExternalUrl("/zona-raider");
		openExternalUrl(null);
		expect(click).not.toHaveBeenCalled();
		settle();
	});
});
