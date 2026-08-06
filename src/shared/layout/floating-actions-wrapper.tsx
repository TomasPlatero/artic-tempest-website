"use client";

import dynamic from "next/dynamic";

const FloatingActionsInner = dynamic(
	() =>
		import("@/shared/layout/floating-actions").then((m) => ({
			default: m.FloatingActions,
		})),
	{ ssr: false },
);

export function FloatingActionsWrapper() {
	return <FloatingActionsInner />;
}
